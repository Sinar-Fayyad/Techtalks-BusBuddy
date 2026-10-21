import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticate } from '@/lib/api-auth';
import { getTripStatus } from '@/lib/trip-status';
import { fromMysqlUtc } from '@/lib/validation';

const ARRIVED_WINDOW_MS = 3 * 60 * 60 * 1000; // "Arrived" shows for 3 hours after the ride

// GET /api/parents/me/children/live   (API_CONTRACT entry 37)
// All linked children with their current ride status in ONE call.
// status: idle (no recent ride) · waiting (trip started, not boarded) · on_board · arrived
// Location is only present while status = on_board (server-enforced).
export async function GET(req: Request) {
  try {
    const a = authenticate(req, ['parent']);
    if ('error' in a) return a.error;

    const [kids] = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone, u.university
       FROM parent_student ps JOIN users u ON u.id = ps.student_user_id
       WHERE ps.parent_user_id = ? AND u.role = 'student' ORDER BY u.name ASC`,
      [a.payload.userId]
    );

    const children = [];
    for (const kid of kids as any[]) {
      const trip = await getTripStatus(kid.id, 'parent');
      let status = 'idle';
      if (trip) {
        if (trip.phase === 'onboard') status = 'on_board';
        else if (trip.phase === 'waiting') status = 'waiting';
        else {
          const endedAt = trip.exited_at ?? trip.end_time;
          if (endedAt && Date.now() - fromMysqlUtc(endedAt).getTime() < ARRIVED_WINDOW_MS) {
            status = 'arrived';
          }
        }
      }
      children.push({ ...kid, status, trip: status === 'idle' ? null : trip });
    }
    return NextResponse.json({ children }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
