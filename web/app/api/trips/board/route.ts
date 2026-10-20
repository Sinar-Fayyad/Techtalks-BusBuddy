import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticate } from '@/lib/api-auth';
import { readTripCode } from '@/lib/trip-codes';

// POST /api/trips/board   (API_CONTRACT entry 25) — student scans the BOARDING code
export async function POST(req: Request) {
  try {
    const a = authenticate(req, ['student']);
    if ('error' in a) return a.error;
    const studentId = a.payload.userId;

    const body = await req.json().catch(() => null);
    const tripId = readTripCode(body?.code, 'board');
    if (tripId === null) {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 });
    }

    const [trips] = await pool.query('SELECT id, driver_id, end_time FROM trips WHERE id = ?', [tripId]);
    const trip = (trips as any[])[0];
    if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    if (trip.end_time !== null) {
      return NextResponse.json({ error: 'Trip already ended' }, { status: 409 });
    }

    const [booked] = await pool.query(
      'SELECT id FROM bookings WHERE student_id = ? AND driver_id = ?',
      [studentId, trip.driver_id]
    );
    if ((booked as any[]).length === 0) {
      return NextResponse.json({ error: 'You have not booked this driver' }, { status: 403 });
    }

    const [rows] = await pool.query(
      'SELECT boarded_at, exited_at FROM trip_students WHERE trip_id = ? AND student_id = ?',
      [tripId, studentId]
    );
    const existing = (rows as any[])[0];
    if (existing?.exited_at) {
      return NextResponse.json({ error: 'Already exited this trip' }, { status: 409 });
    }
    if (existing?.boarded_at) {
      return NextResponse.json({ error: 'Already boarded' }, { status: 409 });
    }

    if (existing) {
      // row created earlier by admin assignment (entry 13) — just stamp boarding
      await pool.query(
        'UPDATE trip_students SET boarded_at = UTC_TIMESTAMP(3) WHERE trip_id = ? AND student_id = ?',
        [tripId, studentId]
      );
    } else {
      await pool.query(
        'INSERT INTO trip_students (trip_id, student_id, boarded_at) VALUES (?, ?, UTC_TIMESTAMP(3))',
        [tripId, studentId]
      );
    }

    const [out] = await pool.query(
      'SELECT CAST(boarded_at AS CHAR) AS boarded_at FROM trip_students WHERE trip_id = ? AND student_id = ?',
      [tripId, studentId]
    );
    return NextResponse.json(
      { message: 'Boarded', trip_id: tripId, boarded_at: (out as any[])[0].boarded_at },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
