import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticate } from '@/lib/api-auth';

// POST /api/bookings   (API_CONTRACT entry 20) — student books a verified driver
export async function POST(req: Request) {
  try {
    const a = authenticate(req, ['student']);
    if ('error' in a) return a.error;

    const body = await req.json().catch(() => null);
    const driverId = Number(body?.driverId);
    if (!Number.isInteger(driverId) || driverId <= 0) {
      return NextResponse.json({ error: 'Missing or invalid driverId' }, { status: 400 });
    }
    let pickup: string | null = null;
    if (body.pickup !== undefined && body.pickup !== null) {
      if (typeof body.pickup !== 'string' || body.pickup.trim().length > 255) {
        return NextResponse.json({ error: 'Invalid pickup' }, { status: 400 });
      }
      pickup = body.pickup.trim() || null;
    }

    const [drivers] = await pool.query(
      "SELECT id FROM drivers WHERE id = ? AND status = 'verified'",
      [driverId]
    );
    if ((drivers as any[]).length === 0) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    try {
      const [result]: any = await pool.query(
        'INSERT INTO bookings (student_id, driver_id, pickup) VALUES (?, ?, ?)',
        [a.payload.userId, driverId, pickup]
      );
      return NextResponse.json(
        { message: 'Booked', booking: { id: result.insertId, driver_id: driverId, pickup } },
        { status: 201 }
      );
    } catch (err: any) {
      if (err.code === 'ER_DUP_ENTRY') {
        return NextResponse.json({ error: 'Already booked with this driver' }, { status: 409 });
      }
      throw err;
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
