import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import AuditLog from '@/lib/models/AuditLog';
import { requireAuth, safeErrorResponse } from '@/lib/security';

// Escape regex special characters to prevent ReDoS
function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// GET /api/audit - Retrieve audit logs (admin only)
export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuth(['admin']);
        if (!auth.authorized) return auth.response;

        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
        const action = searchParams.get('action') || '';
        const severity = searchParams.get('severity') || '';
        const actorEmail = searchParams.get('actor') || '';

        // Build filter (escape regex to prevent ReDoS)
        const filter: Record<string, any> = {};
        if (action) filter.action = { $regex: escapeRegex(action), $options: 'i' };
        if (severity && ['info', 'warning', 'critical'].includes(severity)) {
            filter.severity = severity;
        }
        if (actorEmail) filter['actor.email'] = { $regex: escapeRegex(actorEmail), $options: 'i' };

        await dbConnect();

        const [logs, total] = await Promise.all([
            AuditLog.find(filter)
                .sort({ timestamp: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            AuditLog.countDocuments(filter),
        ]);

        return NextResponse.json({
            logs,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error: unknown) {
        return safeErrorResponse(error);
    }
}
