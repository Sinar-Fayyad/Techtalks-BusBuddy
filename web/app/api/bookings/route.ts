import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticate } from '@/lib/api-auth';
import { notify, parentIdsOf } from '@/lib/notify';

// POST /api/bookings   (API_CONTRACT entry 20, v13) — student books a scheduled trip
// Body: { scheduledTripId: number, pickup?: string (max 255) }
export async function POST(req: Request) {
  try {
    const a = authenticate(req, ['student']);
    if ('error' in a) return a.error;

    const body = await req.json().catch(() => null);
    const tripId = Number(body?.scheduledTripId);
    if (!Number.isInteger(tripId) || tripId <= 0) {
      return NextResponse.json({ error: 'Missing or invalid scheduledTripId' }, { status: 400 });
    }
    let pickup: string | null = null;
    if (body.pickup !== undefined && body.pickup !== null) {
      if (typeof body.pickup !== 'string' || body.pickup.trim().length > 255) {
        return NextResponse.json({ error: 'Invalid pickup' }, { status: 400 });
      }
      pickup = body.pickup.trim() || null;
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // lock the plan row so two students cannot take the last seat together
      const [plans] = await conn.query(
        `SELECT st.id, st.seats, st.cancelled, st.scheduled_at, d.status AS driver_status
         FROM scheduled_trips st JOIN drivers d ON d.id = st.driver_id
         WHERE st.id = ? FOR UPDATE`,
        [tripId]
      );
      const plan = (plans as any[])[0];
      if (!plan || plan.driver_status !== 'verified') {
        await conn.rollback();
        return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
      }
      if (plan.cancelled) {
        await conn.rollback();
        return NextResponse.json({ error: 'Trip is cancelled' }, { status: 409 });
      }
      const [ran] = await conn.query('SELECT id FROM trips WHERE scheduled_trip_id = ?', [tripId]);
      if ((ran as any[]).length > 0) {
        await conn.rollback();
        return NextResponse.json({ error: 'Trip already started' }, { status: 409 });
      }
      const [cnt] = await conn.query('SELECT COUNT(*) AS n FROM bookings WHERE scheduled_trip_id = ?', [tripId]);
      if ((cnt as any[])[0].n >= plan.seats) {
        await conn.rollback();
        return NextResponse.json({ error: 'Trip is full' }, { status: 409 });
      }

      try {
        const [result]: any = await conn.query(
          'INSERT INTO bookings (student_id, scheduled_trip_id, pickup) VALUES (?, ?, ?)',
          [a.payload.userId, tripId, pickup]
        );
        await conn.commit();
        const [info] = await pool.query(
          `SELECT d.user_id AS driver_user_id, st.origin, st.destination, u.name AS student_name
           FROM scheduled_trips st JOIN drivers d ON d.id = st.driver_id
           JOIN users u ON u.id = ?
           WHERE st.id = ?`,
          [a.payload.userId, tripId]
        );
        const i = (info as any[])[0];
        if (i) {
          await notify([i.driver_user_id], 'booking', 'New booking',
            `${i.student_name} booked ${i.origin} → ${i.destination}.`, { scheduledTripId: tripId });
        }
        return NextResponse.json(
          { message: 'Booked', booking: { id: result.insertId, scheduled_trip_id: tripId, pickup } },
          { status: 201 }
        );
      } catch (err: any) {
        await conn.rollback();
        if (err.code === 'ER_DUP_ENTRY') {
          return NextResponse.json({ error: 'Already booked this trip' }, { status: 409 });
        }
        throw err;
      }
    } finally {
      conn.release();
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
