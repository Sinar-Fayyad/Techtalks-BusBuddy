import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db';

// GET /api/students/{studentId}/trip-status   (API_CONTRACT entry 14)
// Permission: student = own id only · parent = linked child only · admin = any
export async function GET(
  req: Request,
  { params }: { params: Promise<{ studentId: string }> }
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

    // --- 2. VALIDATE the URL parameter ---
    const { studentId: rawId } = await params;
    const studentId = Number(rawId);
    if (!Number.isInteger(studentId) || studentId <= 0) {
      return NextResponse.json({ error: 'Invalid student id' }, { status: 400 });
    }

    // --- 3. TARGET must exist and be a student ---
    const [targets] = await pool.query('SELECT id, role FROM users WHERE id = ?', [studentId]);
    const target = (targets as any[])[0];
    if (!target) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    if (target.role !== 'student') {
      return NextResponse.json({ error: 'User is not a student' }, { status: 403 });
    }

    // --- 4. PERMISSION: who is asking? ---
    const role = payload.role;
    if (role === 'student') {
      if (payload.userId !== studentId) {
        return NextResponse.json({ error: 'You can only view your own trip' }, { status: 403 });
      }
    } else if (role === 'parent') {
      const [links] = await pool.query(
        'SELECT student_user_id FROM parent_student WHERE parent_user_id = ? AND student_user_id = ?',
        [payload.userId, studentId]
      );
      if ((links as any[]).length === 0) {
        return NextResponse.json({ error: 'Not linked to this student' }, { status: 403 });
      }
    } else if (role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // --- 5. FIND the trip: active first, then the most recent ended one ---
     const base = `
      SELECT t.id, t.driver_id,
             CAST(t.start_time AS CHAR) AS start_time,
             CAST(t.end_time AS CHAR) AS end_time,
             t.latitude, t.longitude,
             CAST(t.location_updated_at AS CHAR) AS location_updated_at
      FROM trips t
      JOIN trip_students ts ON ts.trip_id = t.id
    `;

    const [active] = await pool.query(
      `${base} WHERE ts.student_id = ? AND t.end_time IS NULL ORDER BY t.start_time DESC LIMIT 1`,
      [studentId]
    );
    let trip = (active as any[])[0] ?? null;

    if (!trip) {
      const [ended] = await pool.query(
        `${base} WHERE ts.student_id = ? AND t.end_time IS NOT NULL ORDER BY t.start_time DESC LIMIT 1`,
        [studentId]
      );
      trip = (ended as any[])[0] ?? null;
    }

    return NextResponse.json({ studentId, trip }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
