import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // --- AUTH: admin only ---
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

    // --- VALIDATE: id must be a number ---
    if (!/^\d+$/.test(id)) {
      return NextResponse.json({ error: 'Invalid driver id' }, { status: 400 });
    }

    // --- DRIVER MUST EXIST ---
    const [driverRows] = await pool.query('SELECT id FROM drivers WHERE id = ?', [id]);
    if ((driverRows as any[]).length === 0) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    // --- READ-ONLY: all trips for this driver, newest first ---
    const [trips] = await pool.query(
      'SELECT id, driver_id, CAST(start_time AS CHAR) AS start_time, CAST(end_time AS CHAR) AS end_time, CAST(created_at AS CHAR) AS created_at FROM trips WHERE driver_id = ? ORDER BY start_time DESC',
      [id]
    );

    return NextResponse.json({ trips }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
