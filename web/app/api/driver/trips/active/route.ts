import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticate } from '@/lib/api-auth';

// GET /api/driver/trips/active   (API_CONTRACT entry 17, v13: + scheduled_trip_id, origin, destination)
export async function GET(req: Request) {
  try {
    const a = authenticate(req, ['driver']);
    if ('error' in a) return a.error;

    const [rows] = await pool.query(
      `SELECT t.id, t.driver_id, t.scheduled_trip_id, st.origin, st.destination,
              CAST(t.start_time AS CHAR) AS start_time,
              CAST(t.end_time AS CHAR) AS end_time,
              t.latitude, t.longitude,
              CAST(t.location_updated_at AS CHAR) AS location_updated_at
       FROM drivers d
       LEFT JOIN trips t ON t.driver_id = d.id AND t.end_time IS NULL
       LEFT JOIN scheduled_trips st ON st.id = t.scheduled_trip_id
       WHERE d.user_id = ?`,
      [a.payload.userId]
    );
    const trip = (rows as any[])[0]?.id ? (rows as any[])[0] : null;
    return NextResponse.json({ trip }, { status: 200 });
  } catch (err: any) {
    console.error('GET /driver/trips/active failed:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
