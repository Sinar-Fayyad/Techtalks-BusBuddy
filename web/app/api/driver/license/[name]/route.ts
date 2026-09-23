import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { readFile } from 'fs/promises';
import path from 'path';
import pool from '@/lib/db';

const MIME: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
};

export async function GET(req: Request, { params }: { params: Promise<{ name: string }> }) {
  try {
    const auth = req.headers.get('authorization') ?? '';
    if (!auth.startsWith('Bearer ') || !auth.slice(7)) {
      return NextResponse.json({ error: 'No token' }, { status: 401 });
    }
    let payload: any;
    try {
      payload = jwt.verify(auth.slice(7), process.env.JWT_SECRET!);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { name } = await params;
    if (name.includes('..') || name.includes('/') || name.includes('\\')) {
      return NextResponse.json({ error: 'Bad name' }, { status: 400 });
    }

    const userId = payload.userId ?? payload.id ?? payload.sub;

    if (payload.role === 'admin') {
      // admins can view any license
    } else if (payload.role === 'driver') {
      const [rows]: any = await pool.query(
        'SELECT license_url FROM drivers WHERE user_id = ? LIMIT 1',
        [userId]
      );
      const own = rows?.[0];
      if (!own || path.basename(own.license_url) !== name) {
        return NextResponse.json({ error: 'Admins only' }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: 'Admins only' }, { status: 403 });
    }

    const filePath = path.join(process.cwd(), 'uploads', name);
    const data = await readFile(filePath);
    const type = MIME[path.extname(name).toLowerCase()] ?? 'application/octet-stream';
    return new NextResponse(new Uint8Array(data), {
      headers: { 'Content-Type': type },
    });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
