import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Post from '@/lib/models/Post';
import { logAudit, getActor, AUDIT_ACTIONS } from '@/lib/audit';
import {
    requireAuth,
    isValidObjectId,
    sanitizeObject,
    pickFields,
    safeErrorResponse,
    parseBody,
} from '@/lib/security';

const POST_UPDATE_FIELDS = [
    'title', 'titleKu', 'titleAr',
    'content', 'contentKu', 'contentAr',
    'category', 'imageUrl',
];

const VALID_CATEGORIES = ['tech', 'science', 'sports', 'entertainment', 'other'];

// GET single post (public for approved, admin/editor for others)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        if (!isValidObjectId(id)) {
            return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
        }

        await dbConnect();
        const post = await Post.findById(id);
        if (!post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        // Non-published posts require authentication
        if (!post.published || post.approvalStatus !== 'approved') {
            const auth = await requireAuth(['admin', 'editor']);
            if (!auth.authorized) {
                return NextResponse.json({ error: 'Post not found' }, { status: 404 });
            }
        }

        return NextResponse.json(post);
    } catch (error: unknown) {
        return safeErrorResponse(error);
    }
}

// UPDATE a post (admin/editor only)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await requireAuth(['admin', 'editor']);
        if (!auth.authorized) return auth.response;

        const { id } = await params;
        if (!isValidObjectId(id)) {
            return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
        }

        let body: any;
        try {
            body = await parseBody(req, 500 * 1024);
        } catch {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }

        // Validate category if provided
        if (body.category && !VALID_CATEGORIES.includes(body.category)) {
            return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
        }

        // Only allow specific fields - prevent modifying approval/publish status through this route
        const safeData = sanitizeObject(pickFields(body, POST_UPDATE_FIELDS) as Record<string, any>);

        await dbConnect();

        // Admin can toggle publish/unpublish
        const userRoles: string[] = (auth.session.user as any)?.roles || [(auth.session.user as any)?.role || 'member'];
        if (userRoles.includes('admin') && typeof body.published === 'boolean') {
            safeData.published = body.published;
            if (body.published) {
                safeData.approvalStatus = 'approved';
            }
        }

        const post = await Post.findByIdAndUpdate(id, safeData, { new: true, runValidators: true });

        if (!post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        await logAudit({
            action: AUDIT_ACTIONS.POST_UPDATE,
            actor: getActor(auth.session),
            target: { type: 'post', id, name: post.title },
            details: { updatedFields: Object.keys(safeData) },
            req,
        });

        return NextResponse.json(post);
    } catch (error: unknown) {
        return safeErrorResponse(error);
    }
}

// DELETE a post (admin only)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await requireAuth(['admin']);
        if (!auth.authorized) return auth.response;

        const { id } = await params;
        if (!isValidObjectId(id)) {
            return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
        }

        await dbConnect();
        const post = await Post.findByIdAndDelete(id);

        if (!post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        await logAudit({
            action: AUDIT_ACTIONS.POST_DELETE,
            actor: getActor(auth.session),
            target: { type: 'post', id, name: post.title },
            severity: 'warning',
            req,
        });

        return NextResponse.json({ message: 'Post deleted' });
    } catch (error: unknown) {
        return safeErrorResponse(error);
    }
}
