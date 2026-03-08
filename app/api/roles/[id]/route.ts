import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Role, { ALL_PERMISSIONS } from '@/lib/models/Role';
import User from '@/lib/models/User';
import { requireAuth, safeErrorResponse, sanitizeString, parseBody } from '@/lib/security';
import { invalidatePermCache } from '@/lib/permissions';

// GET single role
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await requireAuth(['admin']);
        if (!auth.authorized) return auth.response;

        const { id } = await params;
        await dbConnect();

        const role = await Role.findById(id).lean();
        if (!role) {
            return NextResponse.json({ error: 'Role not found' }, { status: 404 });
        }

        // Count users with this role
        const userCount = await User.countDocuments({ roles: role.slug });

        return NextResponse.json({ role, userCount });
    } catch (error: unknown) {
        return safeErrorResponse(error);
    }
}

// PUT update role (admin only)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await requireAuth(['admin']);
        if (!auth.authorized) return auth.response;

        const { id } = await params;
        await dbConnect();

        const role = await Role.findById(id);
        if (!role) {
            return NextResponse.json({ error: 'Role not found' }, { status: 404 });
        }

        let body: any;
        try {
            body = await parseBody(req, 10 * 1024); // 10KB max
        } catch {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }

        // For system roles, only permissions can be changed (not name/slug), and admin perms are locked
        if (role.isSystem && role.slug === 'admin') {
            return NextResponse.json({ error: 'Admin role cannot be modified' }, { status: 403 });
        }

        if (!role.isSystem) {
            if (body.name !== undefined) {
                role.name = sanitizeString(body.name).slice(0, 50);
            }
            if (body.description !== undefined) {
                role.description = sanitizeString(body.description).slice(0, 200);
            }
            if (body.color !== undefined) {
                role.color = sanitizeString(body.color).slice(0, 20);
            }
            if (body.icon !== undefined) {
                role.icon = (body.icon || '👤').slice(0, 4);
            }
        }

        if (body.permissions !== undefined) {
            role.permissions = Array.isArray(body.permissions)
                ? body.permissions.filter((p: string) => (ALL_PERMISSIONS as readonly string[]).includes(p))
                : role.permissions;
        }

        await role.save();
        invalidatePermCache();

        return NextResponse.json(role);
    } catch (error: unknown) {
        return safeErrorResponse(error);
    }
}

// DELETE role (admin only, not system roles)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await requireAuth(['admin']);
        if (!auth.authorized) return auth.response;

        const { id } = await params;
        await dbConnect();

        const role = await Role.findById(id);
        if (!role) {
            return NextResponse.json({ error: 'Role not found' }, { status: 404 });
        }

        if (role.isSystem) {
            return NextResponse.json({ error: 'System roles cannot be deleted' }, { status: 403 });
        }

        // Remove this role from all users who have it
        await User.updateMany(
            { roles: role.slug },
            { $pull: { roles: role.slug } }
        );

        // Ensure users don't end up with empty roles
        await User.updateMany(
            { roles: { $size: 0 } },
            { $set: { roles: ['member'] } }
        );

        await Role.findByIdAndDelete(id);
        invalidatePermCache();

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return safeErrorResponse(error);
    }
}
