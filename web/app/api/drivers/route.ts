import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticate } from '@/lib/api-auth';

// GET /api/drivers   (API_CONTRACT entry 19) — verified drivers directory
export async function GET(req: Request) {
  try {
    const a = authenticate(req, ['student', 'admin']);
    if ('error' in a) return a.error;

    const studentId = a.payload.role === 'student' ? a.payload.userId : 0;
    const [rows] = await pool.query(
      `SELECT d.id, u.name, d.phone, d.route, d.stops, d.price,
              (b.id IS NOT NULL) AS booked
       FROM drivers d
       JOIN users u ON u.id = d.user_id
       LEFT JOIN bookings b ON b.driver_id = d.id AND b.student_id = ?
       WHERE d.status = 'verified'
       ORDER BY u.name ASC`,
      [studentId]
    );
    const drivers = (rows as any[]).map((r) => ({ ...r, booked: !!r.booked }));
    return NextResponse.json({ drivers }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
