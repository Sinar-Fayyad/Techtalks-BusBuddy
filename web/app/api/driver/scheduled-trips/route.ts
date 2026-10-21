import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticate } from '@/lib/api-auth';
import { toMysqlUtc } from '@/lib/validation';
import { PLAN_STATUS_SQL } from '@/lib/trip-sql';

// GET /api/driver/scheduled-trips   (API_CONTRACT entry 28)
// The driver's own planned trips, newest first, with derived status + booked count + totals.
export async function GET(req: Request) {
  try {
    const a = authenticate(req, ['driver']);
    if ('error' in a) return a.error;

    const [rows] = await pool.query(
      `SELECT st.id, st.origin, st.destination,
              CAST(st.scheduled_at AS CHAR) AS scheduled_at,
              st.seats, st.price, st.stops,
              (SELECT COUNT(*) FROM bookings b WHERE b.scheduled_trip_id = st.id) AS booked_count,
              ${PLAN_STATUS_SQL} AS status,
              t.id AS trip_id
       FROM scheduled_trips st
       JOIN drivers d ON d.id = st.driver_id
       LEFT JOIN trips t ON t.scheduled_trip_id = st.id
       WHERE d.user_id = ?
       ORDER BY st.scheduled_at DESC, st.id DESC`,
      [a.payload.userId]
    );
    const trips = rows as any[];
    const counts = {
      total: trips.length,
      upcoming: trips.filter((t) => t.status === 'upcoming' || t.status === 'in_progress').length,
      completed: trips.filter((t) => t.status === 'completed').length,
      cancelled: trips.filter((t) => t.status === 'cancelled').length,
    };
    return NextResponse.json({ trips, counts }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/driver/scheduled-trips   (API_CONTRACT entry 29) — plan a new trip
export async function POST(req: Request) {
  try {
    const a = authenticate(req, ['driver']);
    if ('error' in a) return a.error;

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const origin = typeof body.origin === 'string' ? body.origin.trim() : '';
    const destination = typeof body.destination === 'string' ? body.destination.trim() : '';
    if (!origin || !destination || origin.length > 150 || destination.length > 150) {
      return NextResponse.json({ error: 'origin and destination are required (max 150)' }, { status: 400 });
    }

    const at = toMysqlUtc(body.scheduled_at);
    if (!at) {
      return NextResponse.json({ error: 'Invalid scheduled_at' }, { status: 400 });
    }
    const atMs = new Date(body.scheduled_at).getTime();
    if (atMs < Date.now() - 60 * 60 * 1000) {
      return NextResponse.json({ error: 'scheduled_at is in the past' }, { status: 400 });
    }
    if (atMs > Date.now() + 365 * 24 * 60 * 60 * 1000) {
      return NextResponse.json({ error: 'scheduled_at is too far ahead' }, { status: 400 });
    }

    const seats = Number(body.seats);
    if (!Number.isInteger(seats) || seats < 1 || seats > 100) {
      return NextResponse.json({ error: 'seats must be a whole number 1-100' }, { status: 400 });
    }

    let price = 0;
    if (body.price !== undefined && body.price !== null && body.price !== '') {
      price = Number(body.price);
      if (!Number.isFinite(price) || price < 0 || price > 999999.99) {
        return NextResponse.json({ error: 'Invalid price' }, { status: 400 });
      }
    }

    let stops: string | null = null;
    if (body.stops !== undefined && body.stops !== null) {
      if (typeof body.stops !== 'string' || body.stops.length > 2000) {
        return NextResponse.json({ error: 'Invalid stops' }, { status: 400 });
      }
      stops = body.stops.trim() || null;
    }

    const [drivers] = await pool.query('SELECT id, status FROM drivers WHERE user_id = ?', [a.payload.userId]);
    const driver = (drivers as any[])[0];
    if (!driver) return NextResponse.json({ error: 'No driver profile' }, { status: 404 });
    if (driver.status !== 'verified') {
      return NextResponse.json({ error: 'Driver not verified' }, { status: 403 });
    }

    const [result]: any = await pool.query(
      `INSERT INTO scheduled_trips (driver_id, origin, destination, scheduled_at, seats, price, stops)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [driver.id, origin, destination, at, seats, price, stops]
    );
    return NextResponse.json(
      { message: 'Trip created', trip: { id: result.insertId, origin, destination, seats, price, stops } },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
