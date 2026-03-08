import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Role, { SYSTEM_ROLES, ALL_PERMISSIONS } from '@/lib/models/Role';
import { requireAuth, safeErrorResponse, sanitizeString, parseBody } from '@/lib/security';
import { invalidatePermCache } from '@/lib/permissions';

// GET all roles (admin only)
export async function GET() {
    try {
        const auth = await requireAuth(['admin']);
        if (!auth.authorized) return auth.response;

        await dbConnect();

        // Ensure system roles exist
        for (const sr of SYSTEM_ROLES) {
            const exists = await Role.findOne({ slug: sr.slug });
            if (!exists) {
                await Role.create(sr);
            }
        }

        const roles = await Role.find({}).sort({ isSystem: -1, name: 1 }).lean();
        return NextResponse.json({ roles });
    } catch (error: unknown) {
        return safeErrorResponse(error);
    }
}

// POST create new role (admin only)
export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(['admin']);
        if (!auth.authorized) return auth.response;

        await dbConnect();
        let body: any;
        try {
            body = await parseBody(req, 10 * 1024); // 10KB max
        } catch {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }

        const name = sanitizeString(body.name || '').slice(0, 50);
        const description = sanitizeString(body.description || '').slice(0, 200);
        const color = sanitizeString(body.color || 'blue').slice(0, 20);
        const icon = (body.icon || '👤').slice(0, 4);

        if (!name || name.length < 2) {
            return NextResponse.json({ error: 'Role name must be at least 2 characters' }, { status: 400 });
        }

        // Generate slug from name
        let slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
        if (!slug) slug = 'role_' + Date.now();

        // Check if slug exists
        const existing = await Role.findOne({ slug });
        if (existing) {
            return NextResponse.json({ error: 'A role with this name already exists' }, { status: 409 });
        }

        // Validate permissions
        const permissions = Array.isArray(body.permissions)
            ? body.permissions.filter((p: string) => (ALL_PERMISSIONS as readonly string[]).includes(p))
            : [];

        const role = await Role.create({
            name,
            slug,
            description,
            permissions,
            isSystem: false,
            color,
            icon,
        });

        invalidatePermCache();
        return NextResponse.json(role, { status: 201 });
    } catch (error: unknown) {
        return safeErrorResponse(error);
    }
}
