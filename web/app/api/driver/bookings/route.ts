import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticate } from '@/lib/api-auth';

// GET /api/driver/bookings   (API_CONTRACT entry 22, v13) — students booked on the caller's trips
// Query: ?tripId=<scheduledTripId> to filter one trip.
// status: booked (trip not started) · waiting (trip running, not boarded) · on_board · exited · no_show (trip ended, never boarded)
export async function GET(req: Request) {
  try {
    const a = authenticate(req, ['driver']);
    if ('error' in a) return a.error;

    const [drivers] = await pool.query('SELECT id FROM drivers WHERE user_id = ?', [a.payload.userId]);
    const driver = (drivers as any[])[0];
    if (!driver) {
      return NextResponse.json({ bookings: [] }, { status: 200 }); // entry 17/18 precedent
    }

    const params: any[] = [driver.id];
    let filter = '';
    const tripIdRaw = new URL(req.url).searchParams.get('tripId');
    if (tripIdRaw !== null) {
      const tripId = Number(tripIdRaw);
      if (!Number.isInteger(tripId) || tripId <= 0) {
        return NextResponse.json({ error: 'Invalid tripId' }, { status: 400 });
      }
      filter = ' AND st.id = ?';
      params.push(tripId);
    }

    const [rows] = await pool.query(
      `SELECT b.id, b.student_id, u.name AS student_name, u.email AS student_email,
              u.phone AS student_phone, u.university AS student_university, b.pickup,
              CAST(b.created_at AS CHAR) AS created_at,
              st.id AS scheduled_trip_id, st.origin, st.destination,
              CAST(st.scheduled_at AS CHAR) AS scheduled_at,
              CASE
                WHEN ts.exited_at IS NOT NULL THEN 'exited'
                WHEN ts.boarded_at IS NOT NULL THEN 'on_board'
                WHEN t.id IS NULL THEN 'booked'
                WHEN t.end_time IS NULL THEN 'waiting'
                ELSE 'no_show'
              END AS status
       FROM bookings b
       JOIN scheduled_trips st ON st.id = b.scheduled_trip_id
       JOIN users u ON u.id = b.student_id
       LEFT JOIN trips t ON t.scheduled_trip_id = st.id
       LEFT JOIN trip_students ts ON ts.trip_id = t.id AND ts.student_id = b.student_id
       WHERE st.driver_id = ?${filter}
       ORDER BY st.scheduled_at DESC, u.name ASC`,
      params
    );
    return NextResponse.json({ bookings: rows }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
