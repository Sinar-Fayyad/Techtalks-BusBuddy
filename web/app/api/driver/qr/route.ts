import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticate } from '@/lib/api-auth';
import { signTripCode } from '@/lib/trip-codes';

// GET /api/driver/qr   (API_CONTRACT entry 24) — boarding + exit codes for the ACTIVE trip
export async function GET(req: Request) {
  try {
    const a = authenticate(req, ['driver']);
    if ('error' in a) return a.error;

    const [drivers] = await pool.query('SELECT id FROM drivers WHERE user_id = ?', [a.payload.userId]);
    const driver = (drivers as any[])[0];
    if (!driver) return NextResponse.json({ error: 'No driver profile' }, { status: 404 });

    const [trips] = await pool.query(
      'SELECT id FROM trips WHERE driver_id = ? AND end_time IS NULL',
      [driver.id]
    );
    const trip = (trips as any[])[0];
    if (!trip) return NextResponse.json({ error: 'No active trip' }, { status: 409 });

    return NextResponse.json(
      {
        trip_id: trip.id,
        board_code: signTripCode('board', trip.id),
        exit_code: signTripCode('exit', trip.id),
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
