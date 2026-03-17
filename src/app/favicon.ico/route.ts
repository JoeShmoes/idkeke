import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'icon.png');
    const buf = await fs.readFile(filePath);
    return new NextResponse(buf, {
      status: 200,
      headers: { 'Content-Type': 'image/x-icon' },
    });
  } catch (error) {
    console.error('Failed to read favicon (nexaris-module.png)', error);
    return new NextResponse('Not found', { status: 404 });
  }
}
