import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db';

export async function GET(req: Request) {
  try {
    // role check (finishes BUS-26)
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
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Admins only' }, { status: 403 });
    }

    const [rows] = await pool.query(
      `SELECT d.id, u.name, u.email, d.license_url, d.status, d.created_at
       FROM drivers d JOIN users u ON d.user_id = u.id
       WHERE d.status = 'pending' ORDER BY d.created_at DESC`
    );
    return NextResponse.json({ drivers: rows });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
