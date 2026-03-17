import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
    try {
        const filePath = path.join(process.cwd(), 'landing page', 'termsofservice.html');
        const html = await fs.readFile(filePath, 'utf8');

        return new NextResponse(html, {
            status: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
    } catch (error) {
        console.error('Failed to read terms of service page HTML', error);
        return new NextResponse('Terms of service page not found', { status: 404 });
    }
}
