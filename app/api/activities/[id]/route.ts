import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Activity from '@/lib/models/Activity';
import {
    requireAuth,
    isValidObjectId,
    sanitizeObject,
    pickFields,
    safeErrorResponse,
    parseBody,
} from '@/lib/security';
import { logAudit, getActor, AUDIT_ACTIONS } from '@/lib/audit';

const ACTIVITY_ALLOWED_FIELDS = [
    'title', 'titleKu', 'titleAr',
    'description', 'descriptionKu', 'descriptionAr',
    'date', 'location', 'imageUrl', 'status',
];

// GET single activity (public)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        if (!isValidObjectId(id)) {
            return NextResponse.json({ error: 'Invalid activity ID' }, { status: 400 });
        }

        await dbConnect();
        const activity = await Activity.findById(id);
        if (!activity) return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
        return NextResponse.json(activity);
    } catch (error: unknown) {
        return safeErrorResponse(error);
    }
}

// UPDATE activity (admin only)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await requireAuth(['admin']);
        if (!auth.authorized) return auth.response;

        const { id } = await params;
        if (!isValidObjectId(id)) {
            return NextResponse.json({ error: 'Invalid activity ID' }, { status: 400 });
        }

        let body: any;
        try {
            body = await parseBody(req, 50 * 1024);
        } catch {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }

        // Validate status enum if provided
        if (body.status && !['upcoming', 'ongoing', 'completed'].includes(body.status)) {
            return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
        }

        const safeData = sanitizeObject(pickFields(body, ACTIVITY_ALLOWED_FIELDS) as Record<string, any>);

        await dbConnect();
        const activity = await Activity.findByIdAndUpdate(id, safeData, { new: true, runValidators: true });
        if (!activity) return NextResponse.json({ error: 'Activity not found' }, { status: 404 });

        await logAudit({
            action: AUDIT_ACTIONS.ACTIVITY_UPDATE,
            actor: getActor(auth.session),
            target: { type: 'activity', id, name: activity.title },
            details: { updatedFields: Object.keys(safeData) },
            req,
        });

        return NextResponse.json(activity);
    } catch (error: unknown) {
        return safeErrorResponse(error);
    }
}

// DELETE activity (admin only)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await requireAuth(['admin']);
        if (!auth.authorized) return auth.response;

        const { id } = await params;
        if (!isValidObjectId(id)) {
            return NextResponse.json({ error: 'Invalid activity ID' }, { status: 400 });
        }

        await dbConnect();
        const activity = await Activity.findByIdAndDelete(id);
        if (!activity) return NextResponse.json({ error: 'Activity not found' }, { status: 404 });

        await logAudit({
            action: AUDIT_ACTIONS.ACTIVITY_DELETE,
            actor: getActor(auth.session),
            target: { type: 'activity', id, name: activity.title },
            severity: 'warning',
            req,
        });

        return NextResponse.json({ message: 'Activity deleted' });
    } catch (error: unknown) {
        return safeErrorResponse(error);
    }
}
