import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticate } from '@/lib/api-auth';
import { getTripStatus } from '@/lib/trip-status';

// GET /api/students/{studentId}/trip-status   (API_CONTRACT entry 14, v13)
// Permission: student = own id only · parent = linked child only · admin = any
// Logic (phase, who sees location) lives in lib/trip-status.ts.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const a = authenticate(req);
    if ('error' in a) return a.error;
    const { userId, role } = a.payload;

    const studentId = Number((await params).studentId);
    if (!Number.isInteger(studentId) || studentId <= 0) {
      return NextResponse.json({ error: 'Invalid student id' }, { status: 400 });
    }

    const [targets] = await pool.query('SELECT id, role FROM users WHERE id = ?', [studentId]);
    const target = (targets as any[])[0];
    if (!target) return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    if (target.role !== 'student') {
      return NextResponse.json({ error: 'User is not a student' }, { status: 403 });
    }

    if (role === 'student') {
      if (userId !== studentId) {
        return NextResponse.json({ error: 'You can only view your own trip' }, { status: 403 });
      }
    } else if (role === 'parent') {
      const [links] = await pool.query(
        'SELECT student_user_id FROM parent_student WHERE parent_user_id = ? AND student_user_id = ?',
        [userId, studentId]
      );
      if ((links as any[]).length === 0) {
        return NextResponse.json({ error: 'Not linked to this student' }, { status: 403 });
      }
    } else if (role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const trip = await getTripStatus(studentId, role);
    return NextResponse.json({ studentId, trip }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
