import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticate } from '@/lib/api-auth';
import { readTripCode } from '@/lib/trip-codes';

// POST /api/trips/exit   (API_CONTRACT entry 26) — student scans the EXIT code
export async function POST(req: Request) {
  try {
    const a = authenticate(req, ['student']);
    if ('error' in a) return a.error;
    const studentId = a.payload.userId;

    const body = await req.json().catch(() => null);
    const tripId = readTripCode(body?.code, 'exit');
    if (tripId === null) {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 });
    }

    const [rows] = await pool.query(
      'SELECT boarded_at, exited_at FROM trip_students WHERE trip_id = ? AND student_id = ?',
      [tripId, studentId]
    );
    const row = (rows as any[])[0];
    if (!row || !row.boarded_at) {
      return NextResponse.json({ error: 'You have not boarded this trip' }, { status: 409 });
    }
    if (row.exited_at) {
      return NextResponse.json({ error: 'Already exited this trip' }, { status: 409 });
    }

    await pool.query(
      `UPDATE trip_students SET exited_at = UTC_TIMESTAMP(3)
       WHERE trip_id = ? AND student_id = ? AND exited_at IS NULL`,
      [tripId, studentId]
    );
    const [out] = await pool.query(
      'SELECT CAST(exited_at AS CHAR) AS exited_at FROM trip_students WHERE trip_id = ? AND student_id = ?',
      [tripId, studentId]
    );
    return NextResponse.json(
      { message: 'Exited', trip_id: tripId, exited_at: (out as any[])[0].exited_at },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
