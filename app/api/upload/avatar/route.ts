import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { rateLimit, rateLimitResponse, safeErrorResponse } from '@/lib/security';
import crypto from 'crypto';

// Avatar upload - public (for registration) or authenticated
// Stricter limits than general upload
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB (reduced from 10MB)
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Map validated MIME types to safe file extensions
const MIME_TO_EXT: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
};

// Magic byte signatures
const MAGIC_BYTES: Record<string, number[][]> = {
    'image/jpeg': [[0xFF, 0xD8, 0xFF]],
    'image/png': [[0x89, 0x50, 0x4E, 0x47]],
    'image/webp': [[0x52, 0x49, 0x46, 0x46]],
};

function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
    const signatures = MAGIC_BYTES[mimeType];
    if (!signatures) return false;
    return signatures.some(sig =>
        sig.every((byte, i) => buffer[i] === byte)
    );
}

export async function POST(req: NextRequest) {
    try {
        // Rate limit: 5 uploads per IP per 15 minutes (tighter for unauthenticated endpoint)
        const limiter = await rateLimit(req, { maxRequests: 5, windowMs: 15 * 60 * 1000, keyPrefix: 'avatar-upload' });
        if (!limiter.success) {
            return rateLimitResponse(limiter.retryAfter!);
        }

        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: 'Invalid file type. Allowed: JPG, PNG, WebP' },
                { status: 400 }
            );
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: 'File too large. Maximum size: 2MB' },
                { status: 400 }
            );
        }

        // Read file bytes
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Validate magic bytes (actual file content matches declared type)
        if (!validateMagicBytes(buffer, file.type)) {
            return NextResponse.json(
                { error: 'File content does not match declared type' },
                { status: 400 }
            );
        }

        // Derive extension from validated MIME type (not user-provided filename)
        const ext = MIME_TO_EXT[file.type];
        if (!ext) {
            return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
        }
        const safeName = `avatar-${Date.now()}-${crypto.randomUUID()}.${ext}`;

        // Ensure avatars directory exists
        const avatarsDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
        await mkdir(avatarsDir, { recursive: true });

        // Write file
        const filePath = path.join(avatarsDir, safeName);
        await writeFile(filePath, buffer);

        // Return the public URL
        const url = `/uploads/avatars/${safeName}`;

        return NextResponse.json({ url, filename: safeName }, { status: 201 });
    } catch (error: unknown) {
        return safeErrorResponse(error);
    }
}
