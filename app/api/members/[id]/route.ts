import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import Project from '@/lib/models/Project';
import { isValidObjectId, safeErrorResponse } from '@/lib/security';

// GET /api/members/[id] - Get public profile of a member
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        if (!isValidObjectId(id)) {
            return NextResponse.json({ error: 'Invalid member ID' }, { status: 400 });
        }

        await dbConnect();
        const member = await User.findById(id)
            .select('name memberId avatar bio roles department createdAt');

        if (!member || member.blocked) {
            return NextResponse.json({ error: 'Member not found' }, { status: 404 });
        }

        // Get member's projects (published only, exclude email)
        const projects = await Project.find({
            'members.user': id,
            status: 'published',
        })
            .populate('members.user', 'name memberId avatar')
            .populate('createdBy', 'name memberId avatar')
            .sort({ createdAt: -1 });

        return NextResponse.json({
            member,
            projects,
        });
    } catch (error: unknown) {
        return safeErrorResponse(error);
    }
}
