import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db';

export async function POST(req: Request) {
  try {
    // --- 1. AUTH: same pattern as profile/route.ts ---
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

    // --- ROLE CHECK: only drivers may start trips (contract: 403) ---
    if (payload.role !== 'driver') {
      return NextResponse.json({ error: 'Not a driver' }, { status: 403 });
    }

    // --- 2. TRANSACTION + LOCK: makes double-start impossible ---
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

      const [active] = await conn.query(
        'SELECT id FROM trips WHERE driver_id = ? AND end_time IS NULL',
        [driver.id]
      );
      if ((active as any[]).length > 0) {
        await conn.rollback();
        return NextResponse.json({ error: 'Active trip already exists' }, { status: 409 });
      }

      const [result]: any = await conn.query(
        'INSERT INTO trips (driver_id, start_time) VALUES (?, UTC_TIMESTAMP(3))',
        [driver.id]
      );

      await conn.commit();

      // --- 3. Read the row back so the response matches MySQL exactly ---
      const [rows] = await conn.query(
        'SELECT id, driver_id, CAST(start_time AS CHAR) AS start_time, end_time FROM trips WHERE id = ?',
        [result.insertId]
      );
      return NextResponse.json(
        { message: 'Trip started', trip: (rows as any[])[0] },
        { status: 201 }
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
