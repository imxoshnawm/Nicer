import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Post from '@/lib/models/Post';
import { logAudit, getActor, AUDIT_ACTIONS } from '@/lib/audit';
import {
    requireAuth,
    isValidObjectId,
    sanitizeString,
    safeErrorResponse,
    parseBody,
} from '@/lib/security';

// Submit post for approval (admin/editor only)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await requireAuth(['admin', 'editor']);
        if (!auth.authorized) return auth.response;

        const { id } = await params;
        if (!isValidObjectId(id)) {
            return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
        }

        await dbConnect();

        const post = await Post.findById(id);
        if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

        post.approvalStatus = 'pending';
        await post.save();

        await logAudit({
            action: AUDIT_ACTIONS.POST_UPDATE,
            actor: getActor(auth.session),
            target: { type: 'post', id, name: post.title },
            details: { action: 'submit_for_approval' },
            req,
        });

        return NextResponse.json({ message: 'Post submitted for approval', post });
    } catch (error: unknown) {
        return safeErrorResponse(error);
    }
}

// Approve or reject (admin only - editors cannot approve their own posts)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await requireAuth(['admin']);
        if (!auth.authorized) return auth.response;

        const { id } = await params;
        if (!isValidObjectId(id)) {
            return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
        }

        let body: any;
        try {
            body = await parseBody(req, 10 * 1024);
        } catch {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }

        const { action, reason } = body;

        if (!action || !['approve', 'reject'].includes(action)) {
            return NextResponse.json({ error: 'Invalid action. Must be "approve" or "reject"' }, { status: 400 });
        }

        await dbConnect();

        const post = await Post.findById(id);
        if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

        const userId = (auth.session.user as any)?.id;
        const userName = auth.session.user?.name || 'Unknown';

        if (!userId) {
            return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
        }

        if (action === 'approve') {
            // Check if user already approved
            const alreadyApproved = post.approvals.some((a: any) => a.userId === userId);
            if (alreadyApproved) {
                return NextResponse.json({ error: 'You have already approved this post' }, { status: 400 });
            }

            post.approvals.push({ userId, userName, date: new Date() });

            // If enough approvals, auto-publish
            if (post.approvals.length >= post.requiredApprovals) {
                post.approvalStatus = 'approved';
                post.published = true;
            }

            await post.save();

            await logAudit({
                action: AUDIT_ACTIONS.POST_APPROVE,
                actor: getActor(auth.session),
                target: { type: 'post', id, name: post.title },
                details: { approvals: post.approvals.length, required: post.requiredApprovals },
                req,
            });

            return NextResponse.json({
                message: `Approved (${post.approvals.length}/${post.requiredApprovals})`,
                post,
            });
        } else if (action === 'reject') {
            const rejectionReason = reason ? sanitizeString(reason).substring(0, 1000) : 'No reason provided';
            post.approvalStatus = 'rejected';
            post.rejectionReason = rejectionReason;
            post.published = false;
            await post.save();

            await logAudit({
                action: AUDIT_ACTIONS.POST_REJECT,
                actor: getActor(auth.session),
                target: { type: 'post', id, name: post.title },
                details: { reason: rejectionReason },
                severity: 'warning',
                req,
            });

            return NextResponse.json({ message: 'Post rejected', post });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: unknown) {
        return safeErrorResponse(error);
    }
}
