import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db';

// GET /api/driver/trips   (API_CONTRACT entry 18)
// 🔒 driver — the caller's OWN last 5 trips, newest first (token-based, no URL id)
export async function GET(req: Request) {
  try {
    // --- 1. AUTH: same first block as every protected route here ---
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

    // --- 2. OWN TRIPS: token userId → drivers.user_id (same JOIN shape as
    //        entry 17). Newest first, LIMIT 5, active trip counts toward the 5.
    //        { trips: [] } = no trips / no driver row — documented, NOT 404. ---
    const [rows] = await pool.query(
      `SELECT t.id, t.driver_id,
              CAST(t.start_time AS CHAR) AS start_time,
              CAST(t.end_time AS CHAR) AS end_time,
              CAST(t.created_at AS CHAR) AS created_at
       FROM trips t
       JOIN drivers d ON d.id = t.driver_id
       WHERE d.user_id = ?
       ORDER BY t.start_time DESC, t.id DESC
       LIMIT 5`,
      [payload.userId]
    );

    return NextResponse.json({ trips: rows }, { status: 200 });
  } catch (err: any) {
    console.error('GET /driver/trips failed:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
