import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticate } from '@/lib/api-auth';
import { notify, parentIdsOf } from '@/lib/notify';

// POST /api/driver/trips/start   (API_CONTRACT entry 9, v13)
// Body (optional): { scheduledTripId } — starts that planned trip (students booked on it can board).
// Without a body it starts an ad-hoc trip (nobody can board it).
export async function POST(req: Request) {
  try {
    const a = authenticate(req, ['driver']);
    if ('error' in a) return a.error;

    const body = await req.json().catch(() => null);
    let scheduledTripId: number | null = null;
    if (body && body.scheduledTripId !== undefined && body.scheduledTripId !== null) {
      scheduledTripId = Number(body.scheduledTripId);
      if (!Number.isInteger(scheduledTripId) || scheduledTripId <= 0) {
        return NextResponse.json({ error: 'Invalid scheduledTripId' }, { status: 400 });
      }
    }

    // --- TRANSACTION + LOCK: makes double-start impossible ---
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [drivers] = await conn.query(
        'SELECT id, status FROM drivers WHERE user_id = ? FOR UPDATE',
        [a.payload.userId]
      );
      const driver = (drivers as any[])[0];
      if (!driver) {
        await conn.rollback();
        return NextResponse.json({ error: 'No driver profile' }, { status: 404 });
      }
      if (driver.status !== 'verified') {
        await conn.rollback();
        return NextResponse.json({ error: 'Driver not verified' }, { status: 403 });
      }

      const [active] = await conn.query(
        'SELECT id FROM trips WHERE driver_id = ? AND end_time IS NULL',
        [driver.id]
      );
      if ((active as any[]).length > 0) {
        await conn.rollback();
        return NextResponse.json({ error: 'Active trip already exists' }, { status: 409 });
      }

      if (scheduledTripId !== null) {
        const [plans] = await conn.query(
          'SELECT id, cancelled FROM scheduled_trips WHERE id = ? AND driver_id = ? FOR UPDATE',
          [scheduledTripId, driver.id]
        );
        const plan = (plans as any[])[0];
        if (!plan) {
          await conn.rollback();
          return NextResponse.json({ error: 'Scheduled trip not found' }, { status: 404 });
        }
        if (plan.cancelled) {
          await conn.rollback();
          return NextResponse.json({ error: 'Trip is cancelled' }, { status: 409 });
        }
        const [ran] = await conn.query('SELECT id FROM trips WHERE scheduled_trip_id = ?', [scheduledTripId]);
        if ((ran as any[]).length > 0) {
          await conn.rollback();
          return NextResponse.json({ error: 'Trip already started' }, { status: 409 });
        }
      }

      const [result]: any = await conn.query(
        'INSERT INTO trips (driver_id, scheduled_trip_id, start_time) VALUES (?, ?, UTC_TIMESTAMP(3))',
        [driver.id, scheduledTripId]
      );
      await conn.commit();

      const [rows] = await conn.query(
        `SELECT id, driver_id, scheduled_trip_id, CAST(start_time AS CHAR) AS start_time, end_time
         FROM trips WHERE id = ?`,
        [result.insertId]
      );
      if (scheduledTripId !== null) {
        const [booked] = await pool.query(
          `SELECT b.student_id, st.origin, st.destination
           FROM bookings b JOIN scheduled_trips st ON st.id = b.scheduled_trip_id
           WHERE b.scheduled_trip_id = ?`,
          [scheduledTripId]
        );
        const list = booked as any[];
        if (list.length > 0) {
          await notify(
            list.map((r) => r.student_id),
            'trip_started',
            'Your trip has started',
            `${list[0].origin} → ${list[0].destination}. Track the bus and scan the QR code when you board.`,
            { tripId: result.insertId, scheduledTripId }
          );
        }
      }
      return NextResponse.json({ message: 'Trip started', trip: (rows as any[])[0] }, { status: 201 });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
