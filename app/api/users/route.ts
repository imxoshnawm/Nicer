import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { requireAuth, safeErrorResponse } from '@/lib/security';

// GET all users (admin only)
export async function GET() {
    try {
        const auth = await requireAuth(['admin']);
        if (!auth.authorized) return auth.response;

        await dbConnect();
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });
        return NextResponse.json(users);
    } catch (error: unknown) {
        return safeErrorResponse(error);
    }
}
