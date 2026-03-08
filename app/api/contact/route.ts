import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ContactMessage from '@/lib/models/ContactMessage';
import {
    rateLimit,
    rateLimitResponse,
    requireAuth,
    sanitizeString,
    isValidEmail,
    validateStringLength,
    safeErrorResponse,
    parseBody,
} from '@/lib/security';

// Submit a contact message
export async function POST(req: NextRequest) {
    try {
        // Rate limit: 3 messages per IP per 10 minutes
        const limiter = await rateLimit(req, { maxRequests: 3, windowMs: 10 * 60 * 1000, keyPrefix: 'contact' });
        if (!limiter.success) {
            return rateLimitResponse(limiter.retryAfter!);
        }

        let body: any;
        try {
            body = await parseBody(req, 50 * 1024); // 50KB max
        } catch {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }

        const { name, email, subject, message } = body;

        // Validate all fields
        const nameCheck = validateStringLength(name, 'Name', 2, 100);
        if (!nameCheck.valid) return NextResponse.json({ error: nameCheck.message }, { status: 400 });

        if (!email || !isValidEmail(email)) {
            return NextResponse.json({ error: 'Please provide a valid email address' }, { status: 400 });
        }

        const subjectCheck = validateStringLength(subject, 'Subject', 3, 200);
        if (!subjectCheck.valid) return NextResponse.json({ error: subjectCheck.message }, { status: 400 });

        const messageCheck = validateStringLength(message, 'Message', 10, 5000);
        if (!messageCheck.valid) return NextResponse.json({ error: messageCheck.message }, { status: 400 });

        await dbConnect();
        const contactMsg = await ContactMessage.create({
            name: sanitizeString(name),
            email: email.toLowerCase().trim(),
            subject: sanitizeString(subject),
            message: sanitizeString(message),
        });

        return NextResponse.json({ message: 'Message sent successfully', id: contactMsg._id }, { status: 201 });
    } catch (error: unknown) {
        return safeErrorResponse(error);
    }
}

// GET all contact messages (admin only)
export async function GET() {
    try {
        const auth = await requireAuth(['admin']);
        if (!auth.authorized) return auth.response;

        await dbConnect();
        const messages = await ContactMessage.find({}).sort({ createdAt: -1 });
        return NextResponse.json(messages);
    } catch (error: unknown) {
        return safeErrorResponse(error);
    }
}
