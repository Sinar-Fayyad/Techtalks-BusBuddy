import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticate } from '@/lib/api-auth';
import { PLAN_STATUS_SQL } from '@/lib/trip-sql';

// GET /api/admin/trips?status=all|upcoming|in_progress|completed|cancelled   (API_CONTRACT entry 46)
// Every planned trip of every driver (newest first) with derived status and booking count.
export async function GET(req: Request) {
  try {
    const a = authenticate(req, ['admin']);
    if ('error' in a) return a.error;

    const status = new URL(req.url).searchParams.get('status') ?? 'all';
    if (!['all', 'upcoming', 'in_progress', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    const [rows] = await pool.query(
      `SELECT * FROM (
         SELECT st.id, du.name AS driver_name, d.vehicle_plate, st.origin, st.destination,
                CAST(st.scheduled_at AS CHAR) AS scheduled_at, st.seats, st.price,
                (SELECT COUNT(*) FROM bookings b WHERE b.scheduled_trip_id = st.id) AS booked_count,
                ${PLAN_STATUS_SQL} AS status, t.id AS trip_id
         FROM scheduled_trips st
         JOIN drivers d ON d.id = st.driver_id
         JOIN users du ON du.id = d.user_id
         LEFT JOIN trips t ON t.scheduled_trip_id = st.id
       ) x
       ${status === 'all' ? '' : 'WHERE x.status = ?'}
       ORDER BY x.scheduled_at DESC, x.id DESC LIMIT 500`,
      status === 'all' ? [] : [status]
    );
    return NextResponse.json({ trips: rows }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
