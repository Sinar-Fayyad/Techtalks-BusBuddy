import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticate } from '@/lib/api-auth';
import { notify, parentIdsOf, adminIds } from '@/lib/notify';

const NEARBY_METERS = 3000;
const CATEGORIES = ['breakdown', 'accident', 'delay', 'other'];
const LABELS: Record<string, string> = {
  breakdown: 'a breakdown',
  accident: 'an accident',
  delay: 'a delay',
  other: 'an issue',
};

// POST /api/driver/issues   (API_CONTRACT entry 41) — "Report vehicle issue"
// Body: { category: breakdown|accident|delay|other, message?: string (max 500) }
// Notifies: parents of students ON BOARD the running trip · drivers of other running buses
// within 3 km of this bus (fresh GPS, last 2 minutes) · all admins.
export async function POST(req: Request) {
  try {
    const a = authenticate(req, ['driver']);
    if ('error' in a) return a.error;

    const body = await req.json().catch(() => null);
    const category = body?.category;
    if (!CATEGORIES.includes(category)) {
      return NextResponse.json({ error: 'category must be breakdown, accident, delay or other' }, { status: 400 });
    }
    let message: string | null = null;
    if (body.message !== undefined && body.message !== null) {
      if (typeof body.message !== 'string' || body.message.trim().length > 500) {
        return NextResponse.json({ error: 'Invalid message (max 500 characters)' }, { status: 400 });
      }
      message = body.message.trim() || null;
    }

    const [drivers] = await pool.query(
      `SELECT d.id, d.vehicle_plate, u.name
       FROM drivers d JOIN users u ON u.id = d.user_id WHERE d.user_id = ?`,
      [a.payload.userId]
    );
    const driver = (drivers as any[])[0];
    if (!driver) return NextResponse.json({ error: 'No driver profile' }, { status: 404 });

    // anti-spam: one report every 2 minutes
    const [recent] = await pool.query(
      `SELECT id FROM vehicle_issues
       WHERE driver_id = ? AND created_at > UTC_TIMESTAMP(3) - INTERVAL 2 MINUTE`,
      [driver.id]
    );
    if ((recent as any[]).length > 0) {
      return NextResponse.json({ error: 'You just sent a report. Wait 2 minutes.' }, { status: 429 });
    }

    const [trips] = await pool.query(
      `SELECT t.id, t.latitude, t.longitude, st.origin, st.destination
       FROM trips t LEFT JOIN scheduled_trips st ON st.id = t.scheduled_trip_id
       WHERE t.driver_id = ? AND t.end_time IS NULL`,
      [driver.id]
    );
    const trip = (trips as any[])[0] ?? null;

    const [result]: any = await pool.query(
      `INSERT INTO vehicle_issues (driver_id, trip_id, category, message, latitude, longitude, created_at)
       VALUES (?, ?, ?, ?, ?, ?, UTC_TIMESTAMP(3))`,
      [driver.id, trip?.id ?? null, category, message, trip?.latitude ?? null, trip?.longitude ?? null]
    );

    const what = LABELS[category];
    const route = trip?.origin ? ` (${trip.origin} → ${trip.destination})` : '';
    const bus = driver.vehicle_plate ? `Bus ${driver.vehicle_plate}` : `${driver.name}'s bus`;
    let parentsNotified = 0;
    let driversNotified = 0;

    if (trip) {
      // parents of students currently on board
      const [onBoard] = await pool.query(
        `SELECT ts.student_id, u.name FROM trip_students ts JOIN users u ON u.id = ts.student_id
         WHERE ts.trip_id = ? AND ts.boarded_at IS NOT NULL AND ts.exited_at IS NULL`,
        [trip.id]
      );
      const parentIds = new Set<number>();
      for (const s of onBoard as any[]) {
        for (const pid of await parentIdsOf(s.student_id)) {
          if (!parentIds.has(pid)) {
            parentIds.add(pid);
            await notify(
              [pid],
              'issue',
              'Vehicle issue on your child’s bus',
              `${bus}${route} reported ${what}.${message ? ' ' + message : ''} ${s.name} is on board.`,
              { tripId: trip.id, issueId: result.insertId }
            );
          }
        }
      }
      parentsNotified = parentIds.size;

      // nearby running buses (so those drivers can help)
      if (trip.latitude !== null && trip.longitude !== null) {
        const [near] = await pool.query(
          `SELECT DISTINCT d2.user_id
           FROM trips t2 JOIN drivers d2 ON d2.id = t2.driver_id
           WHERE t2.end_time IS NULL AND t2.id <> ?
             AND t2.latitude IS NOT NULL AND t2.longitude IS NOT NULL
             AND t2.location_updated_at > UTC_TIMESTAMP(3) - INTERVAL 2 MINUTE
             AND ST_Distance_Sphere(POINT(t2.longitude, t2.latitude), POINT(?, ?)) <= ?`,
          [trip.id, trip.longitude, trip.latitude, NEARBY_METERS]
        );
        const nearIds = (near as any[]).map((r) => r.user_id);
        driversNotified = nearIds.length;
        await notify(
          nearIds,
          'issue',
          'A bus near you needs help',
          `${bus} reported ${what} within 3 km of you.${message ? ' ' + message : ''}`,
          { tripId: trip.id, issueId: result.insertId }
        );
      }
    }

    // admins always
    const admins = await adminIds();
    await notify(
      admins,
      'issue',
      'Vehicle issue reported',
      `${driver.name} (${bus}) reported ${what}${route}.${message ? ' ' + message : ''}`,
      { issueId: result.insertId, tripId: trip?.id ?? null }
    );

    return NextResponse.json(
      {
        message: 'Issue reported',
        issue: { id: result.insertId, category, message, trip_id: trip?.id ?? null },
        notified: { parents: parentsNotified, drivers: driversNotified, admins: admins.length },
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
