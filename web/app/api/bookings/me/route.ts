import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticate } from '@/lib/api-auth';
import { PLAN_STATUS_SQL } from '@/lib/trip-sql';

// GET /api/bookings/me   (API_CONTRACT entry 21, v13) — the student's own bookings (trip details included)
export async function GET(req: Request) {
  try {
    const a = authenticate(req, ['student']);
    if ('error' in a) return a.error;

    const [rows] = await pool.query(
      `SELECT b.id, b.scheduled_trip_id, b.pickup, CAST(b.created_at AS CHAR) AS created_at,
              st.origin, st.destination, CAST(st.scheduled_at AS CHAR) AS scheduled_at,
              st.price, st.stops,
              du.name AS driver_name, du.phone AS driver_phone, d.vehicle_plate,
              ${PLAN_STATUS_SQL} AS trip_status,
              t.id AS trip_id,
              CAST(ts.boarded_at AS CHAR) AS boarded_at,
              CAST(ts.exited_at AS CHAR) AS exited_at
       FROM bookings b
       JOIN scheduled_trips st ON st.id = b.scheduled_trip_id
       JOIN drivers d ON d.id = st.driver_id
       JOIN users du ON du.id = d.user_id
       LEFT JOIN trips t ON t.scheduled_trip_id = st.id
       LEFT JOIN trip_students ts ON ts.trip_id = t.id AND ts.student_id = b.student_id
       WHERE b.student_id = ?
       ORDER BY st.scheduled_at DESC, b.id DESC`,
      [a.payload.userId]
    );
    return NextResponse.json({ bookings: rows }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
