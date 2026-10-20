import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticate } from '@/lib/api-auth';

// GET /api/driver/bookings   (API_CONTRACT entry 22) — who booked this driver
export async function GET(req: Request) {
  try {
    const a = authenticate(req, ['driver']);
    if ('error' in a) return a.error;

    const [drivers] = await pool.query('SELECT id FROM drivers WHERE user_id = ?', [a.payload.userId]);
    const driver = (drivers as any[])[0];
    if (!driver) {
      return NextResponse.json({ bookings: [] }, { status: 200 }); // entry 17/18 precedent
    }

    const [rows] = await pool.query(
      `SELECT b.id, b.student_id, u.name AS student_name, u.email AS student_email,
              b.pickup, CAST(b.created_at AS CHAR) AS created_at
       FROM bookings b
       JOIN users u ON u.id = b.student_id
       WHERE b.driver_id = ?
       ORDER BY b.created_at DESC, b.id DESC`,
      [driver.id]
    );
    return NextResponse.json({ bookings: rows }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
