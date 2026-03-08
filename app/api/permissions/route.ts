import { NextResponse } from 'next/server';
import { requireAuth, safeErrorResponse } from '@/lib/security';
import { getAllPermissions, canAccessAdmin } from '@/lib/permissions';
import dbConnect from '@/lib/mongodb';
import Role, { SYSTEM_ROLES } from '@/lib/models/Role';

// GET user's permissions
export async function GET() {
    try {
        const auth = await requireAuth();
        if (!auth.authorized) return auth.response;

        await dbConnect();

        // Ensure system roles exist
        for (const sr of SYSTEM_ROLES) {
            const exists = await Role.findOne({ slug: sr.slug });
            if (!exists) {
                await Role.create(sr);
            }
        }

        const userRoles: string[] = (auth.session.user as any).roles || [(auth.session.user as any).role || 'member'];
        const permissions = await getAllPermissions(userRoles);
        const hasAdminAccess = await canAccessAdmin(userRoles);

        return NextResponse.json({
            roles: userRoles,
            permissions,
            hasAdminAccess,
        });
    } catch (error: unknown) {
        return safeErrorResponse(error);
    }
}
