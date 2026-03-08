import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { requireAuth, safeErrorResponse } from '@/lib/security';
import crypto from 'crypto';

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Map validated MIME types to safe file extensions
const MIME_TO_EXT: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
};

// Magic byte signatures for image formats
const MAGIC_BYTES: Record<string, number[][]> = {
    'image/jpeg': [[0xFF, 0xD8, 0xFF]],
    'image/png': [[0x89, 0x50, 0x4E, 0x47]],
    'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF
    'image/gif': [[0x47, 0x49, 0x46, 0x38]],  // GIF8
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
        const auth = await requireAuth(['admin', 'editor', 'media', 'designer']);
        if (!auth.authorized) return auth.response;

        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: 'Invalid file type. Allowed: JPG, PNG, WebP, GIF' },
                { status: 400 }
            );
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: 'File too large. Maximum size: 5MB' },
                { status: 400 }
            );
        }

        // Read file bytes
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Validate magic bytes (actual file content)
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
        const safeName = `${Date.now()}-${crypto.randomUUID()}.${ext}`;

        // Ensure uploads directory exists
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        await mkdir(uploadsDir, { recursive: true });

        // Write file
        const filePath = path.join(uploadsDir, safeName);
        await writeFile(filePath, buffer);

        // Return the public URL
        const url = `/uploads/${safeName}`;

        return NextResponse.json({ url, filename: safeName }, { status: 201 });
    } catch (error: unknown) {
        return safeErrorResponse(error);
    }
}
