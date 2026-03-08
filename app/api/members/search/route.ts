import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { requireAuth, safeErrorResponse } from '@/lib/security';

// GET /api/members/search?q=... - Search members by name or memberId
// Requires authentication (for adding members to projects)
export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuth();
        if (!auth.authorized) return auth.response;

        const q = req.nextUrl.searchParams.get('q')?.trim();
        if (!q || q.length < 2) {
            return NextResponse.json({ members: [] });
        }

        await dbConnect();
        const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        const members = await User.find({
            blocked: { $ne: true },
            $or: [
                { name: regex },
                { memberId: regex },
            ],
        })
            .select('name memberId avatar roles')
            .limit(10);

        return NextResponse.json({ members });
    } catch (error: unknown) {
        return safeErrorResponse(error);
    }
}
