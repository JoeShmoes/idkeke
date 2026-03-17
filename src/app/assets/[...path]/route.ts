import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const resolvedParams = await params;
    const filePath = path.join(process.cwd(), 'landing page', 'assets', ...resolvedParams.path);

    try {
        const buf = await fs.readFile(filePath);
        const ext = path.extname(filePath).toLowerCase();

        let contentType = 'application/octet-stream';
        if (ext === '.png') contentType = 'image/png';
        else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
        else if (ext === '.svg') contentType = 'image/svg+xml';
        else if (ext === '.ico') contentType = 'image/x-icon';
        else if (ext === '.exe') contentType = 'application/vnd.microsoft.portable-executable';
        else if (ext === '.mp3') contentType = 'audio/mpeg';

        return new NextResponse(buf, {
            status: 200,
            headers: { 'Content-Type': contentType },
        });
    } catch (error) {
        console.error('Asset not found:', filePath);
        return new NextResponse('Asset not found', { status: 404 });
    }
}
