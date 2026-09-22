import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db';

export async function POST(req: Request) {
  try {
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
    if (payload.role !== 'parent') {
      return NextResponse.json({ error: 'Not a parent' }, { status: 403 });
    }
    const body = await req.json().catch(() => null);
    const studentId = Number(body?.studentId);
    if (!Number.isInteger(studentId) || studentId <= 0) {
      return NextResponse.json({ error: 'Missing or invalid studentId' }, { status: 400 });
    }
    const [targets] = await pool.query('SELECT id, role FROM users WHERE id = ?', [studentId]);
    const target = (targets as any[])[0];
    if (!target) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    if (target.role !== 'student') {
      return NextResponse.json({ error: 'User is not a student' }, { status: 403 });
    }
    const [existing] = await pool.query(
      'SELECT parent_user_id FROM parent_student WHERE parent_user_id = ? AND student_user_id = ?',
      [payload.userId, studentId]
    );
    if ((existing as any[]).length > 0) {
      return NextResponse.json({ error: 'Link already exists' }, { status: 409 });
    }
    try {
      await pool.query(
        'INSERT INTO parent_student (parent_user_id, student_user_id) VALUES (?, ?)',
        [payload.userId, studentId]
      );
    } catch (err: any) {
      if (err.code === 'ER_DUP_ENTRY') {
        return NextResponse.json({ error: 'Link already exists' }, { status: 409 });
      }
      throw err;
    }
    return NextResponse.json({ message: 'Child linked' }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
