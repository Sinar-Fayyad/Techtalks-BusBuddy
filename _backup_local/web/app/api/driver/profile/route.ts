import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db';

export async function POST(req: Request) {
  try {
    const auth = req.headers.get('authorization');
    if (!auth?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token' }, { status: 401 });
    }
    let payload: any;
    try {
      payload = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET!);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { license_url } = await req.json();
    if (!license_url) {
      return NextResponse.json({ error: 'license_url required' }, { status: 400 });
    }

    // prevent duplicates
    const [existing] = await pool.query('SELECT id FROM drivers WHERE user_id = ?', [payload.userId]);
    if ((existing as any[]).length > 0) {
      return NextResponse.json({ error: 'Profile already exists' }, { status: 409 });
    }

    await pool.query('INSERT INTO drivers (user_id, license_url) VALUES (?, ?)', [payload.userId, license_url]);
    return NextResponse.json({ message: 'Driver profile created, pending review' }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
