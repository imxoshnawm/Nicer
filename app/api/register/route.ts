import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User, { generateMemberId } from '@/lib/models/User';
import {
    rateLimit,
    rateLimitResponse,
    sanitizeString,
    isValidEmail,
    validatePassword,
    validateStringLength,
    safeErrorResponse,
    parseBody,
} from '@/lib/security';
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit';

// Register a new student user
export async function POST(req: NextRequest) {
    try {
        // Rate limit: 5 registrations per IP per 15 minutes
        const limiter = await rateLimit(req, { maxRequests: 5, windowMs: 15 * 60 * 1000, keyPrefix: 'register' });
        if (!limiter.success) {
            return rateLimitResponse(limiter.retryAfter!);
        }

        let body: any;
        try {
            body = await parseBody(req, 10 * 1024); // 10KB max
        } catch {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }

        const { name, email, password, department, avatar } = body;

        // Validate name
        const nameCheck = validateStringLength(name, 'Name', 2, 100);
        if (!nameCheck.valid) {
            return NextResponse.json({ error: nameCheck.message }, { status: 400 });
        }

        // Validate email
        if (!email || !isValidEmail(email)) {
            return NextResponse.json({ error: 'Please provide a valid email address' }, { status: 400 });
        }

        // Validate password strength
        if (!password) {
            return NextResponse.json({ error: 'Password is required' }, { status: 400 });
        }
        const passwordCheck = validatePassword(password);
        if (!passwordCheck.valid) {
            return NextResponse.json({ error: passwordCheck.message }, { status: 400 });
        }

        // Validate department if provided
        if (department) {
            const deptCheck = validateStringLength(department, 'Department', 1, 100);
            if (!deptCheck.valid) {
                return NextResponse.json({ error: deptCheck.message }, { status: 400 });
            }
        }

        await dbConnect();

        // Normalize email
        const normalizedEmail = email.toLowerCase().trim();

        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            // Generic message to prevent account enumeration
            return NextResponse.json({ error: 'Registration failed. Please try again or use a different email.' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        // Generate unique member ID with collision check
        let memberId: string;
        let attempts = 0;
        do {
            memberId = generateMemberId();
            const existing = await User.findOne({ memberId });
            if (!existing) break;
            attempts++;
        } while (attempts < 10);

        const user = await User.create({
            name: sanitizeString(name),
            email: normalizedEmail,
            password: hashedPassword,
            roles: ['member'], // ALWAYS force member role - never trust client input
            memberId,
            department: department ? sanitizeString(department) : '',
            avatar: avatar && typeof avatar === 'string' && avatar.startsWith('/uploads/') ? avatar : '',
        });

        await logAudit({
            action: AUDIT_ACTIONS.REGISTER,
            actor: { id: user._id.toString(), name: user.name, email: user.email },
            target: { type: 'user', id: user._id.toString(), name: user.name },
            req,
        });

        return NextResponse.json({
            message: 'Registration successful',
            user: { id: user._id, name: user.name, email: user.email, roles: user.roles, memberId: user.memberId },
        }, { status: 201 });
    } catch (error: unknown) {
        return safeErrorResponse(error);
    }
}
