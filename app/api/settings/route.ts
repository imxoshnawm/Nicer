import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SiteSettings, { DEFAULT_SETTINGS } from '@/lib/models/SiteSettings';
import { requireAuth, safeErrorResponse, parseBody, sanitizeObject, pickFields } from '@/lib/security';
import { logAudit, getActor, AUDIT_ACTIONS } from '@/lib/audit';

const SETTINGS_ALLOWED_FIELDS = [
    'stats', 'categories', 'coverTitle', 'coverTitleKu', 'coverTitleAr',
    'coverSubtitle', 'coverSubtitleKu', 'coverSubtitleAr',
    'aboutText', 'aboutTextKu', 'aboutTextAr',
    'contactEmail', 'contactPhone', 'socialLinks',
    'joinEnabled', 'joinURL',
];

// GET site settings (public)
export async function GET() {
    try {
        await dbConnect();
        let settings = await SiteSettings.findOne({ key: 'main' }).lean();

        if (!settings) {
            // Create default settings if none exist
            settings = await SiteSettings.create(DEFAULT_SETTINGS);
            settings = settings.toObject();
        }

        return NextResponse.json(settings);
    } catch (error: unknown) {
        return safeErrorResponse(error);
    }
}

// UPDATE site settings (admin only)
export async function PUT(req: NextRequest) {
    try {
        const auth = await requireAuth(['admin']);
        if (!auth.authorized) return auth.response;

        let body: any;
        try {
            body = await parseBody(req, 100 * 1024); // 100KB max
        } catch {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }

        // Validate stats array
        if (body.stats) {
            if (!Array.isArray(body.stats) || body.stats.length > 10) {
                return NextResponse.json({ error: 'Stats must be an array of max 10 items' }, { status: 400 });
            }
            for (const stat of body.stats) {
                if (!stat.value || !stat.label) {
                    return NextResponse.json({ error: 'Each stat must have value and label' }, { status: 400 });
                }
            }
        }

        // Validate categories array
        if (body.categories) {
            if (!Array.isArray(body.categories) || body.categories.length > 12) {
                return NextResponse.json({ error: 'Categories must be an array of max 12 items' }, { status: 400 });
            }
            for (const cat of body.categories) {
                if (!cat.name || !cat.icon) {
                    return NextResponse.json({ error: 'Each category must have name and icon' }, { status: 400 });
                }
            }
        }

        // Sanitize text fields (only allowed fields)
        const safeBody = sanitizeObject(pickFields(body, SETTINGS_ALLOWED_FIELDS) as Record<string, any>);

        await dbConnect();
        const settings = await SiteSettings.findOneAndUpdate(
            { key: 'main' },
            { $set: safeBody },
            { new: true, upsert: true, runValidators: true }
        );

        await logAudit({
            action: AUDIT_ACTIONS.SETTINGS_UPDATE,
            actor: getActor(auth.session),
            target: { type: 'settings', id: 'main' },
            details: { updatedSections: Object.keys(body).filter(k => k !== '_id' && k !== '__v') },
            req,
        });

        return NextResponse.json(settings);
    } catch (error: unknown) {
        return safeErrorResponse(error);
    }
}
