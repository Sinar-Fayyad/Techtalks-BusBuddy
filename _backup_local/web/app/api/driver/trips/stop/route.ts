import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db';

export async function POST(req: Request) {
  try {
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
    if (payload.role !== 'driver') {
      return NextResponse.json({ error: 'Not a driver' }, { status: 403 });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [drivers] = await conn.query(
        'SELECT id FROM drivers WHERE user_id = ? FOR UPDATE',
        [payload.userId]
      );
      const driver = (drivers as any[])[0];
      if (!driver) {
        await conn.rollback();
        return NextResponse.json({ error: 'No driver profile' }, { status: 404 });
      }

      const [active] = await conn.query(
        'SELECT id FROM trips WHERE driver_id = ? AND end_time IS NULL FOR UPDATE',
        [driver.id]
      );
      const trip = (active as any[])[0];
      if (!trip) {
        await conn.rollback();
        return NextResponse.json({ error: 'No active trip' }, { status: 404 });
      }

      await conn.query(
        'UPDATE trips SET end_time = UTC_TIMESTAMP(3) WHERE id = ?',
        [trip.id]
      );

      await conn.commit();

      const [rows] = await conn.query(
        'SELECT id, driver_id, CAST(start_time AS CHAR) AS start_time, CAST(end_time AS CHAR) AS end_time FROM trips WHERE id = ?',
        [trip.id]
      );
      return NextResponse.json(
        { message: 'Trip stopped', trip: (rows as any[])[0] },
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
