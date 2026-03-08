import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';
import {
    requireAuth,
    sanitizeString,
    validateStringLength,
    validatePassword,
    safeErrorResponse,
    parseBody,
    pickFields,
    rateLimit,
    rateLimitResponse,
} from '@/lib/security';
import { logAudit, getActor, AUDIT_ACTIONS } from '@/lib/audit';

const PROFILE_ALLOWED_FIELDS = ['name', 'department', 'avatar', 'bio'];

// GET own profile
export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuth();
        if (!auth.authorized) return auth.response;

        const userId = (auth.session.user as any).id;

        await dbConnect();
        const user = await User.findById(userId).select('-password');
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        return NextResponse.json(user);
    } catch (error: unknown) {
        return safeErrorResponse(error);
    }
}

// UPDATE own profile (name, department, password)
export async function PUT(req: NextRequest) {
    try {
        const auth = await requireAuth();
        if (!auth.authorized) return auth.response;

        // Rate limit password change attempts
        const limiter = await rateLimit(req, { maxRequests: 10, windowMs: 15 * 60 * 1000, keyPrefix: 'profile-update' });
        if (!limiter.success) return rateLimitResponse(limiter.retryAfter!);

        const userId = (auth.session.user as any).id;

        let body: any;
        try {
            body = await parseBody(req, 10 * 1024);
        } catch {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }

        // Sanitize text fields
        if (body.name) {
            body.name = sanitizeString(body.name);
            const nameCheck = validateStringLength(body.name, 'name', 2, 100);
            if (!nameCheck.valid) {
                return NextResponse.json({ error: nameCheck.message }, { status: 400 });
            }
        }

        if (body.department) {
            body.department = sanitizeString(body.department);
            const deptCheck = validateStringLength(body.department, 'department', 0, 100);
            if (!deptCheck.valid) {
                return NextResponse.json({ error: deptCheck.message }, { status: 400 });
            }
        }

        const safeData: Record<string, any> = pickFields(body, PROFILE_ALLOWED_FIELDS);

        // Handle password change separately
        if (body.currentPassword && body.newPassword) {
            await dbConnect();
            const user = await User.findById(userId);
            if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

            const isCurrentValid = await bcrypt.compare(body.currentPassword, user.password);
            if (!isCurrentValid) {
                return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
            }

            const passwordCheck = validatePassword(body.newPassword);
            if (!passwordCheck.valid) {
                return NextResponse.json({ error: passwordCheck.message }, { status: 400 });
            }

            safeData.password = await bcrypt.hash(body.newPassword, 12);
        }

        if (Object.keys(safeData).length === 0) {
            return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
        }

        await dbConnect();
        const updatedUser = await User.findByIdAndUpdate(userId, safeData, {
            new: true,
            runValidators: true,
        }).select('-password');

        if (!updatedUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // Audit log for profile changes
        await logAudit({
            action: safeData.password ? AUDIT_ACTIONS.USER_UPDATE : AUDIT_ACTIONS.USER_UPDATE,
            actor: getActor(auth.session),
            target: { type: 'user', id: userId, name: updatedUser.name },
            details: { 
                action: safeData.password ? 'password_change' : 'profile_update',
                updatedFields: Object.keys(safeData).filter(k => k !== 'password'),
            },
            severity: safeData.password ? 'warning' : 'info',
            req,
        });

        return NextResponse.json(updatedUser);
    } catch (error: unknown) {
        return safeErrorResponse(error);
    }
}
