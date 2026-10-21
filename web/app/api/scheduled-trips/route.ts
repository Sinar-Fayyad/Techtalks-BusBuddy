import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticate } from '@/lib/api-auth';

// GET /api/scheduled-trips   (API_CONTRACT entry 27) — trips a student can book
// Query: ?q=<text>  (driver name, origin, destination, stops) · ?sort=time|price (default time)
// Only verified drivers' trips that are not cancelled, not started, not older than 1 hour.
export async function GET(req: Request) {
  try {
    const a = authenticate(req, ['student', 'admin']);
    if ('error' in a) return a.error;

    const url = new URL(req.url);
    const q = (url.searchParams.get('q') ?? '').trim().slice(0, 100);
    const sort = url.searchParams.get('sort') === 'price' ? 'price' : 'time';

    const studentId = a.payload.role === 'student' ? a.payload.userId : 0;
    const params: any[] = [studentId];
    let search = '';
    if (q) {
      const like = `%${q}%`;
      search = ' AND (du.name LIKE ? OR st.origin LIKE ? OR st.destination LIKE ? OR st.stops LIKE ?)';
      params.push(like, like, like, like);
    }
    const order =
      sort === 'price'
        ? 'st.price ASC, st.scheduled_at ASC, st.id ASC'
        : 'st.scheduled_at ASC, st.id ASC';

    const [rows] = await pool.query(
      `SELECT st.id, st.driver_id, du.name AS driver_name, du.phone AS driver_phone, d.vehicle_plate,
              st.origin, st.destination, CAST(st.scheduled_at AS CHAR) AS scheduled_at,
              st.seats, st.price, st.stops,
              (SELECT COUNT(*) FROM bookings b WHERE b.scheduled_trip_id = st.id) AS booked_count,
              EXISTS(SELECT 1 FROM bookings b2 WHERE b2.scheduled_trip_id = st.id AND b2.student_id = ?) AS booked
       FROM scheduled_trips st
       JOIN drivers d ON d.id = st.driver_id AND d.status = 'verified'
       JOIN users du ON du.id = d.user_id
       LEFT JOIN trips t ON t.scheduled_trip_id = st.id
       WHERE st.cancelled = 0 AND t.id IS NULL
         AND st.scheduled_at >= UTC_TIMESTAMP(3) - INTERVAL 1 HOUR${search}
       ORDER BY ${order}`,
      params
    );
    const trips = (rows as any[]).map((r) => ({
      ...r,
      booked: !!r.booked,
      seats_left: Math.max(0, r.seats - r.booked_count),
    }));
    return NextResponse.json({ trips }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
