import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import AIKnowledge from '@/lib/models/AIKnowledge';
import { requireAuth, sanitizeString, parseBody, safeErrorResponse } from '@/lib/security';

const VALID_CATEGORIES = ['general', 'faq', 'rules', 'events', 'custom'];

export async function GET() {
    try {
        const auth = await requireAuth(['admin']);
        if (!auth.authorized) return auth.response;

        await dbConnect();
        const items = await AIKnowledge.find().sort({ createdAt: -1 }).lean();
        return NextResponse.json(items);
    } catch (error: unknown) {
        return safeErrorResponse(error);
    }
}

export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(['admin']);
        if (!auth.authorized) return auth.response;

        let body: any;
        try {
            body = await parseBody(req, 50 * 1024); // 50KB max
        } catch {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }

        const title = sanitizeString(body.title || '').slice(0, 200);
        const content = sanitizeString(body.content || '').slice(0, 10000);
        const category = VALID_CATEGORIES.includes(body.category) ? body.category : 'general';

        if (!title.trim() || !content.trim()) {
            return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
        }

        await dbConnect();
        const item = await AIKnowledge.create({
            title,
            content,
            category,
            isActive: body.isActive !== false,
        });

        return NextResponse.json(item, { status: 201 });
    } catch (error: unknown) {
        return safeErrorResponse(error);
    }
}
