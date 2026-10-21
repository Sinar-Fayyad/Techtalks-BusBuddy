import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticate } from '@/lib/api-auth';
import { notify, parentIdsOf } from '@/lib/notify';

// DELETE /api/bookings/{id}   (API_CONTRACT entry 32) — student cancels own booking before the trip starts
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const a = authenticate(req, ['student']);
    if ('error' in a) return a.error;

    const bookingId = Number((await params).id);
    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      return NextResponse.json({ error: 'Invalid booking id' }, { status: 400 });
    }
    const [rows] = await pool.query(
      `SELECT b.id, b.scheduled_trip_id,
              (SELECT COUNT(*) FROM trips t WHERE t.scheduled_trip_id = b.scheduled_trip_id) AS runs
       FROM bookings b WHERE b.id = ? AND b.student_id = ?`,
      [bookingId, a.payload.userId]
    );
    const booking = (rows as any[])[0];
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    if (booking.runs > 0) {
      return NextResponse.json({ error: 'Trip already started' }, { status: 409 });
    }
    await pool.query('DELETE FROM bookings WHERE id = ?', [bookingId]);
    const [info] = await pool.query(
      `SELECT d.user_id AS driver_user_id, st.origin, st.destination, u.name AS student_name
       FROM scheduled_trips st JOIN drivers d ON d.id = st.driver_id JOIN users u ON u.id = ?
       WHERE st.id = ?`,
      [a.payload.userId, booking.scheduled_trip_id]
    );
    const i = (info as any[])[0];
    if (i) {
      await notify([i.driver_user_id], 'booking', 'Booking cancelled',
        `${i.student_name} cancelled ${i.origin} → ${i.destination}.`, { scheduledTripId: booking.scheduled_trip_id });
    }
    return NextResponse.json({ message: 'Booking cancelled' }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
