import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(req: Request, { params }: { params: Promise<{ name: string }> }) {
  try {
    const auth = req.headers.get('authorization') ?? '';
    const qsToken = new URL(req.url).searchParams.get('token') ?? '';
    const tokenValue = auth.startsWith('Bearer ') ? auth.split(' ')[1] : qsToken;
    let payload: any;
    try {
      payload = jwt.verify(tokenValue, process.env.JWT_SECRET!);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { name } = await params;
    if (name.includes('..') || name.includes('/')) {
      return NextResponse.json({ error: 'Bad name' }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), 'uploads', name);
    const data = await readFile(filePath);
    return new NextResponse(new Uint8Array(data)); // admin appends their token to view
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
