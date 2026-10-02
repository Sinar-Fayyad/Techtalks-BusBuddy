import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db';

// POST /api/trips/{tripId}/students   (API_CONTRACT entry 13)
// 🔒 admin — assigns a student to a trip (trip_students row)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    // --- 1. AUTH: same first block as every protected route here ---
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
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Not an admin' }, { status: 403 });
    }

    // --- 2. VALIDATE both ids BEFORE touching the DB (entry 11 precedent:
    //        non-numeric path id = 400 · entry 12 precedent: bad body id = 400)
    const { tripId: rawTripId } = await params;
    const tripId = Number(rawTripId);
    if (!Number.isInteger(tripId) || tripId <= 0) {
      return NextResponse.json({ error: 'Invalid trip id' }, { status: 400 });
    }
    const body = await req.json().catch(() => null);
    const studentId = Number(body?.studentId);
    if (!Number.isInteger(studentId) || studentId <= 0) {
      return NextResponse.json({ error: 'Missing or invalid studentId' }, { status: 400 });
    }

    // --- 3. TRIP must exist ---
    const [trips] = await pool.query('SELECT id FROM trips WHERE id = ?', [tripId]);
    if ((trips as any[]).length === 0) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // --- 4. TARGET must exist and be a student (same shape as entry 12) ---
    const [targets] = await pool.query('SELECT id, role FROM users WHERE id = ?', [studentId]);
    const target = (targets as any[])[0];
    if (!target) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    if (target.role !== 'student') {
      return NextResponse.json({ error: 'User is not a student' }, { status: 403 });
    }

    // --- 5. DUPLICATE: pre-check + race-safe catch (exact entry-12 pattern;
    //        composite PK trip_id+student_id → dup insert = ER_DUP_ENTRY / 1062) ---
    const [existing] = await pool.query(
      'SELECT trip_id FROM trip_students WHERE trip_id = ? AND student_id = ?',
      [tripId, studentId]
    );
    if ((existing as any[]).length > 0) {
      return NextResponse.json({ error: 'Student already assigned to this trip' }, { status: 409 });
    }
    try {
      await pool.query(
        'INSERT INTO trip_students (trip_id, student_id) VALUES (?, ?)',
        [tripId, studentId]
      );
    } catch (err: any) {
      if (err.code === 'ER_DUP_ENTRY') {
        return NextResponse.json({ error: 'Student already assigned to this trip' }, { status: 409 });
      }
      throw err;
    }

    return NextResponse.json({ message: 'Student assigned to trip' }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
