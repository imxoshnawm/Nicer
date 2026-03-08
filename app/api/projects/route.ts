import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Project from '@/lib/models/Project';
import User from '@/lib/models/User';
import {
    requireAuth,
    sanitizeObject,
    pickFields,
    validateStringLength,
    safeErrorResponse,
    parseBody,
} from '@/lib/security';
import { logAudit, getActor, AUDIT_ACTIONS } from '@/lib/audit';

const PROJECT_ALLOWED_FIELDS = [
    'title', 'description', 'images', 'members', 'link', 'videoUrl', 'status',
];

// GET projects (public: published only, admin with ?all=true: all statuses)
export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(req.url);
        const showAll = searchParams.get('all') === 'true';

        let filter: any = { status: 'published' };

        // If admin requesting all projects
        if (showAll) {
            const auth = await requireAuth();
            if (auth.authorized) {
                const roles: string[] = (auth.session.user as any)?.roles || [];
                if (roles.includes('admin') || roles.includes('president')) {
                    filter = {}; // show all
                }
            }
        }

        const projects = await Project.find(filter)
            .populate('members.user', 'name memberId avatar')
            .populate('createdBy', 'name memberId avatar')
            .sort({ createdAt: -1 });
        return NextResponse.json({ projects });
    } catch (error: unknown) {
        return safeErrorResponse(error);
    }
}

// CREATE a new project (any authenticated member)
export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth();
        if (!auth.authorized) return auth.response;

        let body: any;
        try {
            body = await parseBody(req, 100 * 1024);
        } catch {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }

        // Validate required fields
        const titleCheck = validateStringLength(body.title, 'Title', 3, 200);
        if (!titleCheck.valid) return NextResponse.json({ error: titleCheck.message }, { status: 400 });

        const descCheck = validateStringLength(body.description, 'Description', 10, 5000);
        if (!descCheck.valid) return NextResponse.json({ error: descCheck.message }, { status: 400 });

        // Validate members array
        if (!body.members || !Array.isArray(body.members) || body.members.length === 0) {
            return NextResponse.json({ error: 'At least one member is required' }, { status: 400 });
        }

        // Validate images array
        if (body.images && (!Array.isArray(body.images) || body.images.length > 10)) {
            return NextResponse.json({ error: 'Maximum 10 images allowed' }, { status: 400 });
        }

        // Validate video URL if provided
        if (body.videoUrl && body.videoUrl.trim()) {
            const videoUrl = body.videoUrl.trim().toLowerCase();
            const isValidVideo = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') ||
                videoUrl.includes('drive.google.com') || videoUrl.includes('docs.google.com');
            if (!isValidVideo) {
                return NextResponse.json({ error: 'Video URL must be from YouTube or Google Drive' }, { status: 400 });
            }
        }

        // Verify all member users exist
        await dbConnect();
        const memberUserIds = body.members.map((m: any) => m.user);
        const existingUsers = await User.find({ _id: { $in: memberUserIds } }).select('_id');
        if (existingUsers.length !== memberUserIds.length) {
            return NextResponse.json({ error: 'One or more members not found' }, { status: 400 });
        }

        const userId = (auth.session.user as any).id;
        const safeData = sanitizeObject(pickFields(body, PROJECT_ALLOWED_FIELDS) as Record<string, any>);

        // Validate and sanitize images array
        if (body.images && Array.isArray(body.images)) {
            safeData.images = body.images.filter((img: unknown) =>
                typeof img === 'string' && img.length < 2048 && /^(\/uploads\/|https?:\/\/)/.test(img)
            ).slice(0, 10);
        } else {
            safeData.images = [];
        }
        // Sanitize members: only allow user ID and role string
        safeData.members = body.members.map((m: any) => ({
            user: typeof m.user === 'string' ? m.user : String(m.user),
            role: typeof m.role === 'string' ? m.role.replace(/<[^>]*>/g, '').slice(0, 100) : 'Member',
        }));
        safeData.createdBy = userId;

        const project = await Project.create(safeData);

        // Populate for response
        const populated = await Project.findById(project._id)
            .populate('members.user', 'name memberId avatar')
            .populate('createdBy', 'name memberId avatar');

        await logAudit({
            action: AUDIT_ACTIONS.PROJECT_CREATE || 'project.create',
            actor: getActor(auth.session),
            target: { type: 'project', id: project._id.toString(), name: safeData.title },
            req,
        });

        return NextResponse.json(populated, { status: 201 });
    } catch (error: unknown) {
        return safeErrorResponse(error);
    }
}
