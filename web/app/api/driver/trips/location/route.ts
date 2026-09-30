import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db';

// POST /api/driver/trips/location   (API_CONTRACT entry 16)
// Verified driver with an ACTIVE trip only. Records a GPS ping on that trip.
export async function POST(req: Request) {
  try {
    // --- 1. AUTH: same first block as every protected route here ---
    const auth = req.headers.get('authorization');
    if (!auth?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token' }, { status: 401 });
    }
    let payload: any;
    try {
      payload = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET!);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // --- 2. ROLE CHECK: only drivers may send location (contract: 403) ---
    if (payload.role !== 'driver') {
      return NextResponse.json({ error: 'Not a driver' }, { status: 403 });
    }

    // --- 3. BODY + COORDINATE VALIDATION (contract: 400) ---
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const { latitude, longitude } = body ?? {};
    if (
      typeof latitude !== 'number' || !Number.isFinite(latitude) ||
      latitude < -90 || latitude > 90
    ) {
      return NextResponse.json({ error: 'Invalid latitude' }, { status: 400 });
    }
    if (
      typeof longitude !== 'number' || !Number.isFinite(longitude) ||
      longitude < -180 || longitude > 180
    ) {
      return NextResponse.json({ error: 'Invalid longitude' }, { status: 400 });
    }

    // --- 4. TRANSACTION + LOCK: same pattern as trips/start ---
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [drivers] = await conn.query(
        'SELECT id, status FROM drivers WHERE user_id = ? FOR UPDATE',
        [payload.userId]
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

      // Lock the active trip row (if any) — prevents a race with /stop
      const [active] = await conn.query(
        'SELECT id FROM trips WHERE driver_id = ? AND end_time IS NULL FOR UPDATE',
        [driver.id]
      );
      const trip = (active as any[])[0];
      if (!trip) {
        await conn.rollback();
        return NextResponse.json({ error: 'No active trip' }, { status: 409 });
      }

      await conn.query(
        `UPDATE trips
            SET latitude = ?, longitude = ?, location_updated_at = UTC_TIMESTAMP(3)
          WHERE id = ?`,
        [latitude, longitude, trip.id]
      );

      await conn.commit();

      // --- 5. Read the row back so the response matches MySQL exactly ---
      const [rows] = await conn.query(
        `SELECT id, driver_id,
                CAST(start_time AS CHAR) AS start_time,
                CAST(end_time AS CHAR) AS end_time,
                latitude, longitude,
                CAST(location_updated_at AS CHAR) AS location_updated_at
           FROM trips WHERE id = ?`,
        [trip.id]
      );
      return NextResponse.json(
        { message: 'Location updated', trip: (rows as any[])[0] },
        { status: 200 }
      );
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
