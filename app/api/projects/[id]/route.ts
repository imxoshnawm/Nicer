import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Project from '@/lib/models/Project';
import User from '@/lib/models/User';
import {
    requireAuth,
    isValidObjectId,
    sanitizeObject,
    pickFields,
    safeErrorResponse,
    parseBody,
} from '@/lib/security';
import { logAudit, getActor, AUDIT_ACTIONS } from '@/lib/audit';

const PROJECT_ALLOWED_FIELDS = [
    'title', 'description', 'images', 'members', 'link', 'videoUrl', 'status',
];

// GET single project (public if published, auth required for drafts)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        if (!isValidObjectId(id)) {
            return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
        }

        await dbConnect();
        const project = await Project.findById(id)
            .populate('members.user', 'name memberId avatar bio roles')
            .populate('createdBy', 'name memberId avatar');

        if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

        // Non-published projects require authentication
        if (project.status !== 'published') {
            const auth = await requireAuth();
            if (!auth.authorized) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        return NextResponse.json(project);
    } catch (error: unknown) {
        return safeErrorResponse(error);
    }
}

// UPDATE project (creator or admin)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await requireAuth();
        if (!auth.authorized) return auth.response;

        const { id } = await params;
        if (!isValidObjectId(id)) {
            return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
        }

        let body: any;
        try {
            body = await parseBody(req, 100 * 1024);
        } catch {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }

        await dbConnect();
        const project = await Project.findById(id);
        if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

        // Only creator or admin can edit
        const userId = (auth.session.user as any).id;
        const userRoles: string[] = (auth.session.user as any).roles || [];
        const isAdmin = userRoles.includes('admin');
        if (project.createdBy.toString() !== userId && !isAdmin) {
            return NextResponse.json({ error: 'Not authorized to edit this project' }, { status: 403 });
        }

        // Validate members if provided
        if (body.members) {
            if (!Array.isArray(body.members) || body.members.length === 0) {
                return NextResponse.json({ error: 'At least one member is required' }, { status: 400 });
            }
            const memberUserIds = body.members.map((m: any) => m.user);
            const existingUsers = await User.find({ _id: { $in: memberUserIds } }).select('_id');
            if (existingUsers.length !== memberUserIds.length) {
                return NextResponse.json({ error: 'One or more members not found' }, { status: 400 });
            }
        }

        const safeData = sanitizeObject(pickFields(body, PROJECT_ALLOWED_FIELDS) as Record<string, any>);
        // Validate and sanitize structured data
        if (body.images && Array.isArray(body.images)) {
            safeData.images = body.images.filter((img: unknown) =>
                typeof img === 'string' && img.length < 2048 && /^(\/uploads\/|https?:\/\/)/.test(img)
            ).slice(0, 10);
        }
        if (body.members) {
            safeData.members = body.members.map((m: any) => ({
                user: typeof m.user === 'string' ? m.user : String(m.user),
                role: typeof m.role === 'string' ? m.role.replace(/<[^>]*>/g, '').slice(0, 100) : 'Member',
            }));
        }

        const updated = await Project.findByIdAndUpdate(id, safeData, { new: true, runValidators: true })
            .populate('members.user', 'name memberId avatar')
            .populate('createdBy', 'name memberId avatar');

        await logAudit({
            action: AUDIT_ACTIONS.PROJECT_UPDATE || 'project.update',
            actor: getActor(auth.session),
            target: { type: 'project', id, name: updated?.title || '' },
            details: { updatedFields: Object.keys(safeData) },
            req,
        });

        return NextResponse.json(updated);
    } catch (error: unknown) {
        return safeErrorResponse(error);
    }
}

// DELETE project (creator or admin)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await requireAuth();
        if (!auth.authorized) return auth.response;

        const { id } = await params;
        if (!isValidObjectId(id)) {
            return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
        }

        await dbConnect();
        const project = await Project.findById(id);
        if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

        const userId = (auth.session.user as any).id;
        const userRoles: string[] = (auth.session.user as any).roles || [];
        const isAdmin = userRoles.includes('admin');
        if (project.createdBy.toString() !== userId && !isAdmin) {
            return NextResponse.json({ error: 'Not authorized to delete this project' }, { status: 403 });
        }

        await Project.findByIdAndDelete(id);

        await logAudit({
            action: AUDIT_ACTIONS.PROJECT_DELETE || 'project.delete',
            actor: getActor(auth.session),
            target: { type: 'project', id, name: project.title },
            req,
        });

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return safeErrorResponse(error);
    }
}
