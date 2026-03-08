import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Activity from '@/lib/models/Activity';
import {
    requireAuth,
    sanitizeObject,
    pickFields,
    validateStringLength,
    safeErrorResponse,
    parseBody,
    isValidImageUrl,
} from '@/lib/security';
import { logAudit, getActor, AUDIT_ACTIONS } from '@/lib/audit';

const ACTIVITY_ALLOWED_FIELDS = [
    'title', 'titleKu', 'titleAr',
    'description', 'descriptionKu', 'descriptionAr',
    'date', 'location', 'imageUrl', 'status',
];

// GET all activities (public)
export async function GET() {
    try {
        await dbConnect();
        // Performance: Select only needed fields
        const activities = await Activity.find({})
            .select('title titleKu titleAr description descriptionKu descriptionAr date location imageUrl status')
            .sort({ date: 1 });
        return NextResponse.json(activities);
    } catch (error: unknown) {
        return safeErrorResponse(error);
    }
}

// CREATE a new activity (admin only)
export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(['admin']);
        if (!auth.authorized) return auth.response;

        let body: any;
        try {
            body = await parseBody(req, 50 * 1024);
        } catch {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }

        // Validate required fields
        const titleCheck = validateStringLength(body.title, 'Title', 3, 200);
        if (!titleCheck.valid) return NextResponse.json({ error: titleCheck.message }, { status: 400 });

        const descCheck = validateStringLength(body.description, 'Description', 10, 5000);
        if (!descCheck.valid) return NextResponse.json({ error: descCheck.message }, { status: 400 });

        if (!body.date || isNaN(new Date(body.date).getTime())) {
            return NextResponse.json({ error: 'Valid date is required' }, { status: 400 });
        }

        // Validate status enum
        if (body.status && !['upcoming', 'ongoing', 'completed'].includes(body.status)) {
            return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
        }

        // Validate imageUrl if provided
        if (body.imageUrl && typeof body.imageUrl === 'string') {
            if (!isValidImageUrl(body.imageUrl)) {
                return NextResponse.json({ error: 'Invalid image URL' }, { status: 400 });
            }
        }

        // Only allow specific fields (prevent mass assignment)
        const safeData = sanitizeObject(pickFields(body, ACTIVITY_ALLOWED_FIELDS) as Record<string, any>);

        await dbConnect();
        const activity = await Activity.create(safeData);

        await logAudit({
            action: AUDIT_ACTIONS.ACTIVITY_CREATE,
            actor: getActor(auth.session),
            target: { type: 'activity', id: activity._id.toString(), name: safeData.title },
            req,
        });

        return NextResponse.json(activity, { status: 201 });
    } catch (error: unknown) {
        return safeErrorResponse(error);
    }
}
