import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticate } from '@/lib/api-auth';

// GET /api/bookings/me   (API_CONTRACT entry 21) — the student's own bookings
export async function GET(req: Request) {
  try {
    const a = authenticate(req, ['student']);
    if ('error' in a) return a.error;

    const [rows] = await pool.query(
      `SELECT b.id, b.driver_id, u.name AS driver_name, d.phone, d.route, d.stops, d.price,
              b.pickup, CAST(b.created_at AS CHAR) AS created_at
       FROM bookings b
       JOIN drivers d ON d.id = b.driver_id
       JOIN users u ON u.id = d.user_id
       WHERE b.student_id = ?
       ORDER BY b.created_at DESC, b.id DESC`,
      [a.payload.userId]
    );
    return NextResponse.json({ bookings: rows }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
