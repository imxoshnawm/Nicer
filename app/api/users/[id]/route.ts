import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';
import { logAudit, getActor, AUDIT_ACTIONS } from '@/lib/audit';
import {
    requireAuth,
    isValidObjectId,
    pickFields,
    safeErrorResponse,
    parseBody,
    validatePassword,
} from '@/lib/security';

// Only these fields can be updated by admin
const USER_ALLOWED_UPDATE_FIELDS = ['name', 'roles', 'blocked', 'department', 'memberId', 'avatar', 'bio', 'displayOrder'];

// GET single user (admin only)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await requireAuth(['admin']);
        if (!auth.authorized) return auth.response;

        const { id } = await params;
        if (!isValidObjectId(id)) {
            return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
        }

        await dbConnect();
        const user = await User.findById(id).select('-password');
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
        return NextResponse.json(user);
    } catch (error: unknown) {
        return safeErrorResponse(error);
    }
}

// UPDATE user (admin only - role, blocked, etc.)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await requireAuth(['admin']);
        if (!auth.authorized) return auth.response;

        const { id } = await params;
        if (!isValidObjectId(id)) {
            return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
        }

        let body: any;
        try {
            body = await parseBody(req, 10 * 1024);
        } catch {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }

        // Validate roles if being updated
        const VALID_ROLES = ['admin', 'president', 'vice_president', 'secretary', 'treasurer', 'media', 'editor', 'designer', 'developer', 'coordinator', 'member'];
        if (body.roles) {
            if (!Array.isArray(body.roles) || body.roles.length === 0) {
                return NextResponse.json({ error: 'Roles must be a non-empty array' }, { status: 400 });
            }
            if (!body.roles.every((r: string) => VALID_ROLES.includes(r))) {
                return NextResponse.json({ error: 'Invalid role value' }, { status: 400 });
            }
        }

        // Only allow specific fields - NEVER allow password, email, or _id updates
        const safeData = pickFields(body, USER_ALLOWED_UPDATE_FIELDS);

        // Handle password reset (separate from other field updates)
        if (body.newPassword && typeof body.newPassword === 'string') {
            const passwordCheck = validatePassword(body.newPassword);
            if (!passwordCheck.valid) {
                return NextResponse.json({ error: passwordCheck.message }, { status: 400 });
            }
            const hashedPassword = await bcrypt.hash(body.newPassword, 12);
            (safeData as any).password = hashedPassword;
        }

        // Prevent admin from blocking themselves
        const adminId = (auth.session.user as any).id;
        if (id === adminId && safeData.blocked === true) {
            return NextResponse.json({ error: 'Cannot block your own account' }, { status: 400 });
        }

        // Prevent removing admin role if this would leave zero admins
        if (safeData.roles && !safeData.roles.includes('admin')) {
            await dbConnect();
            const targetUser = await User.findById(id).select('roles');
            if (targetUser?.roles?.includes('admin')) {
                const adminCount = await User.countDocuments({ roles: 'admin', blocked: { $ne: true }, _id: { $ne: id } });
                if (adminCount === 0) {
                    return NextResponse.json({ error: 'Cannot remove last admin. Assign another admin first.' }, { status: 400 });
                }
            }
        }

        await dbConnect();
        const user = await User.findByIdAndUpdate(id, safeData, { new: true, runValidators: true }).select('-password');
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // Determine audit action based on what changed
        if (safeData.roles) {
            await logAudit({
                action: AUDIT_ACTIONS.USER_ROLE_CHANGE,
                actor: getActor(auth.session),
                target: { type: 'user', id, name: user.name },
                details: { newRoles: safeData.roles },
                severity: 'warning',
                req,
            });
        }
        if (safeData.blocked !== undefined) {
            await logAudit({
                action: safeData.blocked ? AUDIT_ACTIONS.USER_BLOCK : AUDIT_ACTIONS.USER_UNBLOCK,
                actor: getActor(auth.session),
                target: { type: 'user', id, name: user.name },
                severity: safeData.blocked ? 'warning' : 'info',
                req,
            });
        }
        if (!safeData.roles && safeData.blocked === undefined) {
            await logAudit({
                action: AUDIT_ACTIONS.USER_UPDATE,
                actor: getActor(auth.session),
                target: { type: 'user', id, name: user.name },
                details: { updatedFields: Object.keys(safeData).filter(k => k !== 'password') },
                req,
            });
        }
        if ((body as any).newPassword) {
            await logAudit({
                action: AUDIT_ACTIONS.USER_UPDATE,
                actor: getActor(auth.session),
                target: { type: 'user', id, name: user.name },
                details: { action: 'password_reset' },
                severity: 'warning',
                req,
            });
        }

        return NextResponse.json(user);
    } catch (error: unknown) {
        return safeErrorResponse(error);
    }
}

// DELETE user (admin only)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await requireAuth(['admin']);
        if (!auth.authorized) return auth.response;

        const { id } = await params;
        if (!isValidObjectId(id)) {
            return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
        }

        // Prevent admin from deleting themselves
        const adminId = (auth.session.user as any).id;
        if (id === adminId) {
            return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
        }

        await dbConnect();
        const user = await User.findByIdAndDelete(id);
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        await logAudit({
            action: AUDIT_ACTIONS.USER_DELETE,
            actor: getActor(auth.session),
            target: { type: 'user', id, name: user.name },
            severity: 'critical',
            req,
        });

        return NextResponse.json({ message: 'User deleted' });
    } catch (error: unknown) {
        return safeErrorResponse(error);
    }
}
