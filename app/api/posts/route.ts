import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Post from '@/lib/models/Post';
import { logAudit, getActor, AUDIT_ACTIONS } from '@/lib/audit';
import {
    requireAuth,
    sanitizeObject,
    pickFields,
    validateStringLength,
    safeErrorResponse,
    parseBody,
    isValidImageUrl,
} from '@/lib/security';

const POST_ALLOWED_FIELDS = [
    'title', 'titleKu', 'titleAr',
    'content', 'contentKu', 'contentAr',
    'category', 'imageUrl',
];

const VALID_CATEGORIES = ['tech', 'science', 'sports', 'entertainment', 'other'];

// GET all posts (public - but only show approved/published posts to non-admins)
export async function GET() {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);
        const userRoles: string[] = (session?.user as any)?.roles || [(session?.user as any)?.role || 'member'];

        // If admin/editor, show all posts; otherwise only published
        const canViewAll = userRoles.includes('admin') || userRoles.includes('editor');
        const filter = canViewAll
            ? {}
            : { published: true, approvalStatus: 'approved' };

        // Performance: Select only needed fields
        const posts = await Post.find(filter)
            .select('title titleKu titleAr category imageUrl author published approvalStatus createdAt')
            .sort({ createdAt: -1 });
        return NextResponse.json(posts);
    } catch (error: unknown) {
        return safeErrorResponse(error);
    }
}

// CREATE a new post (admin/editor only)
export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(['admin', 'editor']);
        if (!auth.authorized) return auth.response;

        let body: any;
        try {
            body = await parseBody(req, 500 * 1024); // 500KB max
        } catch {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }

        // Validate required fields
        const titleCheck = validateStringLength(body.title, 'Title', 3, 300);
        if (!titleCheck.valid) return NextResponse.json({ error: titleCheck.message }, { status: 400 });

        const contentCheck = validateStringLength(body.content, 'Content', 10, 50000);
        if (!contentCheck.valid) return NextResponse.json({ error: contentCheck.message }, { status: 400 });

        if (!body.category || !VALID_CATEGORIES.includes(body.category)) {
            return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
        }

        // Validate imageUrl if provided
        if (body.imageUrl && typeof body.imageUrl === 'string') {
            if (!isValidImageUrl(body.imageUrl)) {
                return NextResponse.json({ error: 'Invalid image URL' }, { status: 400 });
            }
        }

        // Only allow specific fields
        const safeData = sanitizeObject(pickFields(body, POST_ALLOWED_FIELDS) as Record<string, any>);

        const userRoles: string[] = (auth.session.user as any)?.roles || [(auth.session.user as any)?.role || 'member'];
        const isAdmin = userRoles.includes('admin');

        await dbConnect();
        const post = await Post.create({
            ...safeData,
            author: auth.session.user?.name || 'Admin',
            // Admin can publish directly; other roles start as draft
            published: isAdmin && body.publishNow === true,
            approvalStatus: isAdmin && body.publishNow === true ? 'approved' : 'draft',
        });

        await logAudit({
            action: AUDIT_ACTIONS.POST_CREATE,
            actor: getActor(auth.session),
            target: { type: 'post', id: post._id.toString(), name: safeData.title },
            req,
        });

        return NextResponse.json(post, { status: 201 });
    } catch (error: unknown) {
        return safeErrorResponse(error);
    }
}
