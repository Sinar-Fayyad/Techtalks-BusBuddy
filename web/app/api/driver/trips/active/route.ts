import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db';

export async function GET(req: Request) {
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
    if (payload.role !== 'driver') {
      return NextResponse.json({ error: 'Not a driver' }, { status: 403 });
    }

    // Read-only lookup — no transaction/FOR UPDATE needed (nothing is written).
    // LEFT JOIN: no driver row OR no active trip both naturally give trip = null.
    const [rows] = await pool.query(
      `SELECT t.id, t.driver_id,
              CAST(t.start_time AS CHAR) AS start_time,
              CAST(t.end_time AS CHAR) AS end_time,
              t.latitude, t.longitude,
              CAST(t.location_updated_at AS CHAR) AS location_updated_at
       FROM drivers d
       LEFT JOIN trips t ON t.driver_id = d.id AND t.end_time IS NULL
       WHERE d.user_id = ?`,
      [payload.userId]
    );

    const trip = (rows as any[])[0]?.id ? (rows as any[])[0] : null;
    return NextResponse.json({ trip }, { status: 200 });
  } catch (err: any) {
    console.error('GET /driver/trips/active failed:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
