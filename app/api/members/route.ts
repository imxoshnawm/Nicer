import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { safeErrorResponse } from '@/lib/security';

// GET all members (public - for members page)
// Returns name, memberId, avatar, bio, roles, department, displayOrder
// Sorted by displayOrder (ascending) - role holders first, then regular members
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const members = await User.find({ blocked: { $ne: true } })
            .select('name memberId avatar bio roles department displayOrder createdAt')
            .sort({ displayOrder: 1, createdAt: 1 });
        return NextResponse.json({ members });
    } catch (error: unknown) {
        return safeErrorResponse(error);
    }
}
