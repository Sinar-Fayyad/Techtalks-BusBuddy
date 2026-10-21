import pool from '@/lib/db';

// Shared by entry 14 (GET /students/{id}/trip-status) and entry 37 (parent live list).
//
// phase:
//   waiting = a trip the student booked is running, student has NOT scanned in
//   onboard = scanned the boarding code, has not scanned out, trip still running
//   done    = scanned out, or the trip ended
// Live location is only returned when allowed:
//   student: waiting + onboard · parent: onboard ONLY · admin: always
const TRIP_COLUMNS = `
  t.id, t.driver_id, t.scheduled_trip_id,
  du.name AS driver_name, du.phone AS driver_phone, d.vehicle_plate,
  st.origin, st.destination,
  CAST(st.scheduled_at AS CHAR) AS scheduled_at,
  CAST(t.start_time AS CHAR) AS start_time,
  CAST(t.end_time AS CHAR) AS end_time,
  t.latitude, t.longitude,
  CAST(t.location_updated_at AS CHAR) AS location_updated_at,
  CAST(ts.boarded_at AS CHAR) AS boarded_at,
  CAST(ts.exited_at AS CHAR) AS exited_at
`;

export async function getTripStatus(studentId: number, viewerRole: string): Promise<any | null> {
  // 1) a RUNNING trip the student booked (or is already on)
  const [active] = await pool.query(
    `SELECT ${TRIP_COLUMNS}
     FROM trips t
     JOIN drivers d ON d.id = t.driver_id
     JOIN users du ON du.id = d.user_id
     LEFT JOIN scheduled_trips st ON st.id = t.scheduled_trip_id
     LEFT JOIN bookings b ON b.scheduled_trip_id = t.scheduled_trip_id AND b.student_id = ?
     LEFT JOIN trip_students ts ON ts.trip_id = t.id AND ts.student_id = ?
     WHERE t.end_time IS NULL AND (b.id IS NOT NULL OR ts.trip_id IS NOT NULL)
     ORDER BY t.start_time DESC, t.id DESC LIMIT 1`,
    [studentId, studentId]
  );
  let trip: any = (active as any[])[0] ?? null;

  // 2) otherwise the most recent trip the student actually rode
  if (!trip) {
    const [ended] = await pool.query(
      `SELECT ${TRIP_COLUMNS}
       FROM trips t
       JOIN drivers d ON d.id = t.driver_id
       JOIN users du ON du.id = d.user_id
       LEFT JOIN scheduled_trips st ON st.id = t.scheduled_trip_id
       JOIN trip_students ts ON ts.trip_id = t.id AND ts.student_id = ?
       WHERE t.end_time IS NOT NULL AND ts.boarded_at IS NOT NULL
       ORDER BY t.start_time DESC, t.id DESC LIMIT 1`,
      [studentId]
    );
    trip = (ended as any[])[0] ?? null;
  }
  if (!trip) return null;

  const phase =
    trip.end_time !== null || trip.exited_at !== null
      ? 'done'
      : trip.boarded_at !== null
      ? 'onboard'
      : 'waiting';
  const showLocation =
    viewerRole === 'admin' || phase === 'onboard' || (phase === 'waiting' && viewerRole === 'student');
  if (!showLocation) {
    trip.latitude = null;
    trip.longitude = null;
    trip.location_updated_at = null;
  }
  trip.phase = phase;
  return trip;
}
