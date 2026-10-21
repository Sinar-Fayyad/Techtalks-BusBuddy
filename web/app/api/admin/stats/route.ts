import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticate } from '@/lib/api-auth';

// GET /api/admin/stats   (API_CONTRACT entry 44) — dashboard numbers
export async function GET(req: Request) {
  try {
    const a = authenticate(req, ['admin']);
    if ('error' in a) return a.error;

    const [[u]]: any = await pool.query(
      `SELECT SUM(role = 'student') AS students, SUM(role = 'parent') AS parents FROM users`
    );
    const [[d]]: any = await pool.query(
      `SELECT SUM(status = 'pending') AS pending, SUM(status = 'verified') AS verified,
              SUM(status = 'rejected') AS rejected FROM drivers`
    );
    const [[t]]: any = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM trips WHERE end_time IS NULL) AS running,
         (SELECT COUNT(*) FROM scheduled_trips st LEFT JOIN trips t ON t.scheduled_trip_id = st.id
            WHERE st.cancelled = 0 AND t.id IS NULL AND st.scheduled_at >= UTC_TIMESTAMP(3) - INTERVAL 1 HOUR) AS upcoming,
         (SELECT COUNT(*) FROM trips WHERE end_time IS NOT NULL) AS completed,
         (SELECT COUNT(*) FROM scheduled_trips WHERE cancelled = 1) AS cancelled,
         (SELECT COUNT(*) FROM bookings) AS bookings,
         (SELECT COUNT(*) FROM vehicle_issues WHERE status = 'open') AS open_issues`
    );
    return NextResponse.json(
      {
        users: { students: Number(u.students ?? 0), parents: Number(u.parents ?? 0) },
        drivers: {
          pending: Number(d.pending ?? 0),
          verified: Number(d.verified ?? 0),
          rejected: Number(d.rejected ?? 0),
        },
        trips: {
          running: t.running,
          upcoming: t.upcoming,
          completed: t.completed,
          cancelled: t.cancelled,
        },
        bookings: t.bookings,
        open_issues: t.open_issues,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
