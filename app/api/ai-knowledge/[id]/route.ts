import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import AIKnowledge from '@/lib/models/AIKnowledge';
import { requireAuth, isValidObjectId, sanitizeString, parseBody, safeErrorResponse } from '@/lib/security';

const VALID_CATEGORIES = ['general', 'faq', 'rules', 'events', 'custom'];

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await requireAuth(['admin']);
        if (!auth.authorized) return auth.response;

        const { id } = await params;
        if (!isValidObjectId(id)) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
        }

        let body: any;
        try {
            body = await parseBody(req, 50 * 1024);
        } catch {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }

        const updateData: Record<string, any> = {};
        if (body.title !== undefined) updateData.title = sanitizeString(body.title).slice(0, 200);
        if (body.content !== undefined) updateData.content = sanitizeString(body.content).slice(0, 10000);
        if (body.category !== undefined && VALID_CATEGORIES.includes(body.category)) updateData.category = body.category;
        if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive);

        await dbConnect();
        const item = await AIKnowledge.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

        if (!item) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json(item);
    } catch (error: unknown) {
        return safeErrorResponse(error);
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await requireAuth(['admin']);
        if (!auth.authorized) return auth.response;

        const { id } = await params;
        if (!isValidObjectId(id)) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
        }

        await dbConnect();
        const item = await AIKnowledge.findByIdAndDelete(id);

        if (!item) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return safeErrorResponse(error);
    }
}
