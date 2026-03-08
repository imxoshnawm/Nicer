import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';

// Constant-time string comparison to prevent timing attacks
function timingSafeCompare(a: string, b: string): boolean {
    try {
        return crypto.timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
    } catch {
        return false; // Different lengths
    }
}

// Seed or reset the default admin user
// SECURITY: Protected by secret token via POST + header
export async function POST(req: NextRequest) {
    try {
        // SECURITY: Require a secret token
        const seedSecret = process.env.SEED_SECRET;
        if (!seedSecret) {
            return NextResponse.json({ error: 'Seed route is disabled' }, { status: 403 });
        }

        // Token from header (not query string — avoids logging/referer leaks)
        const token = req.headers.get('x-seed-token') || '';

        if (!token || !timingSafeCompare(token, seedSecret)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await dbConnect();

        const email = process.env.ADMIN_EMAIL;
        const password = process.env.ADMIN_PASSWORD;

        // SECURITY: Require environment variables - never use hardcoded defaults
        if (!email || !password) {
            return NextResponse.json(
                { error: 'ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required' },
                { status: 500 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const existingAdmin = await User.findOne({ email });

        if (existingAdmin) {
            // Reset password and ensure admin role
            existingAdmin.password = hashedPassword;
            existingAdmin.blocked = false;
            existingAdmin.roles = ['admin'];
            await existingAdmin.save();

            // Also migrate any other users with old 'role' field
            await User.collection.updateMany(
                { role: { $exists: true }, roles: { $exists: false } },
                [{ $set: { roles: ['$role'] } }, { $unset: 'role' }]
            );

            return NextResponse.json({ message: 'Admin reset with roles: [admin]' }, { status: 200 });
        }

        await User.create({
            name: 'NICER Admin',
            email,
            password: hashedPassword,
            roles: ['admin'],
        });

        return NextResponse.json({ message: 'Admin user created successfully' }, { status: 201 });
    } catch (error: unknown) {
        console.error('[Seed Error]:', error);
        return NextResponse.json({ error: 'An internal error occurred' }, { status: 500 });
    }
}
