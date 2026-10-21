import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticate } from '@/lib/api-auth';
import { toMysqlUtc } from '@/lib/validation';
import { notify } from '@/lib/notify';

type Ctx = { params: Promise<{ id: string }> };

// Loads the plan only if it belongs to the caller (someone else's plan = 404, no leak).
async function loadOwn(userId: number, rawId: string) {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) return { bad: true as const };
  const [rows] = await pool.query(
    `SELECT st.*, (SELECT COUNT(*) FROM bookings b WHERE b.scheduled_trip_id = st.id) AS booked_count,
            (SELECT COUNT(*) FROM trips t WHERE t.scheduled_trip_id = st.id) AS runs
     FROM scheduled_trips st JOIN drivers d ON d.id = st.driver_id
     WHERE st.id = ? AND d.user_id = ?`,
    [id, userId]
  );
  return { bad: false as const, trip: (rows as any[])[0] ?? null };
}

// PATCH /api/driver/scheduled-trips/{id}   (API_CONTRACT entry 30)
// Edit any of origin, destination, scheduled_at, seats, price, stops — or { cancelled: true }.
// Only before the trip has started.
export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const a = authenticate(req, ['driver']);
    if ('error' in a) return a.error;
    const { id } = await params;
    const found = await loadOwn(a.payload.userId, id);
    if (found.bad) return NextResponse.json({ error: 'Invalid trip id' }, { status: 400 });
    const trip = found.trip;
    if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    if (trip.runs > 0) return NextResponse.json({ error: 'Trip already started' }, { status: 409 });
    if (trip.cancelled) return NextResponse.json({ error: 'Trip is cancelled' }, { status: 409 });

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const sets: string[] = [];
    const vals: any[] = [];

    for (const key of ['origin', 'destination'] as const) {
      if (body[key] === undefined) continue;
      const v = typeof body[key] === 'string' ? body[key].trim() : '';
      if (!v || v.length > 150) {
        return NextResponse.json({ error: `Invalid ${key}` }, { status: 400 });
      }
      sets.push(`${key} = ?`);
      vals.push(v);
    }
    if (body.scheduled_at !== undefined) {
      const at = toMysqlUtc(body.scheduled_at);
      if (!at) return NextResponse.json({ error: 'Invalid scheduled_at' }, { status: 400 });
      const ms = new Date(body.scheduled_at).getTime();
      if (ms < Date.now() - 60 * 60 * 1000) {
        return NextResponse.json({ error: 'scheduled_at is in the past' }, { status: 400 });
      }
      if (ms > Date.now() + 365 * 24 * 60 * 60 * 1000) {
        return NextResponse.json({ error: 'scheduled_at is too far ahead' }, { status: 400 });
      }
      sets.push('scheduled_at = ?');
      vals.push(at);
    }
    if (body.seats !== undefined) {
      const n = Number(body.seats);
      if (!Number.isInteger(n) || n < 1 || n > 100) {
        return NextResponse.json({ error: 'seats must be a whole number 1-100' }, { status: 400 });
      }
      if (n < trip.booked_count) {
        return NextResponse.json({ error: 'Fewer seats than current bookings' }, { status: 409 });
      }
      sets.push('seats = ?');
      vals.push(n);
    }
    if (body.price !== undefined) {
      const p = Number(body.price);
      if (body.price === null || body.price === '' || !Number.isFinite(p) || p < 0 || p > 999999.99) {
        return NextResponse.json({ error: 'Invalid price' }, { status: 400 });
      }
      sets.push('price = ?');
      vals.push(p);
    }
    if (body.stops !== undefined) {
      if (body.stops !== null && (typeof body.stops !== 'string' || body.stops.length > 2000)) {
        return NextResponse.json({ error: 'Invalid stops' }, { status: 400 });
      }
      sets.push('stops = ?');
      vals.push(body.stops === null ? null : body.stops.trim() || null);
    }
    if (body.cancelled !== undefined) {
      if (body.cancelled !== true) {
        return NextResponse.json({ error: 'cancelled can only be set to true' }, { status: 400 });
      }
      sets.push('cancelled = 1');
    }

    if (sets.length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }
    await pool.query(`UPDATE scheduled_trips SET ${sets.join(', ')} WHERE id = ?`, [...vals, trip.id]);
    if (body.cancelled === true) {
      const [booked] = await pool.query('SELECT student_id FROM bookings WHERE scheduled_trip_id = ?', [trip.id]);
      await notify((booked as any[]).map((r) => r.student_id), 'cancelled', 'Trip cancelled',
        `${trip.origin} → ${trip.destination} was cancelled by the driver.`, { scheduledTripId: trip.id });
    }
    return NextResponse.json({ message: 'Trip updated' }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/driver/scheduled-trips/{id}   (API_CONTRACT entry 31)
// Only if it has not started and nobody booked it (otherwise cancel it with PATCH).
export async function DELETE(req: Request, { params }: Ctx) {
  try {
    const a = authenticate(req, ['driver']);
    if ('error' in a) return a.error;
    const { id } = await params;
    const found = await loadOwn(a.payload.userId, id);
    if (found.bad) return NextResponse.json({ error: 'Invalid trip id' }, { status: 400 });
    const trip = found.trip;
    if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    if (trip.runs > 0) return NextResponse.json({ error: 'Trip already started' }, { status: 409 });
    if (trip.booked_count > 0) {
      return NextResponse.json({ error: 'Trip has bookings: cancel it instead' }, { status: 409 });
    }
    await pool.query('DELETE FROM scheduled_trips WHERE id = ?', [trip.id]);
    return NextResponse.json({ message: 'Trip deleted' }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
