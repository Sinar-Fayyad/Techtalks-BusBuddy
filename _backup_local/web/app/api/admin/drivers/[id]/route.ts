import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
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
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Admins only' }, { status: 403 });
    }

    const { id } = await params;
    const { action } = await req.json(); // "verify" or "reject"

    if (!['verify', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'action must be verify or reject' }, { status: 400 });
    }

    const status = action === 'verify' ? 'verified' : 'rejected';
    const [result]: any = await pool.query('UPDATE drivers SET status = ? WHERE id = ?', [status, id]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }
    return NextResponse.json({ message: `Driver ${status}` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
