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

    // Contract v11: send exactly one of studentId or email
    const hasStudentId = body?.studentId !== undefined;
    const hasEmail = body?.email !== undefined;
    if (hasStudentId === hasEmail) {
      return NextResponse.json({ error: 'Send either studentId or email' }, { status: 400 });
    }

    let studentId: number;
    let target: any;

    if (hasStudentId) {
      // studentId mode: same behavior as before
      studentId = Number(body.studentId);
      if (!Number.isInteger(studentId) || studentId <= 0) {
        return NextResponse.json({ error: 'Missing or invalid studentId' }, { status: 400 });
      }
      const [targets] = await pool.query('SELECT id, role FROM users WHERE id = ?', [studentId]);
      target = (targets as any[])[0];
      if (!target) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      }
    } else {
      // email mode: find the child by email, then use their id
      const email = typeof body.email === 'string' ? body.email.trim() : '';
      if (!email) {
        return NextResponse.json({ error: 'Missing or invalid email' }, { status: 400 });
      }
      const [targets] = await pool.query('SELECT id, role FROM users WHERE email = ?', [email]);
      target = (targets as any[])[0];
      if (!target) {
        return NextResponse.json({ error: 'No account found with that email' }, { status: 404 });
      }
      studentId = target.id;
    }

    // Same check for both modes
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

// GET /api/parents/me/children   (API_CONTRACT entry 15)
// The logged-in parent's linked children (students only).
export async function GET(req: Request) {
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
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email
       FROM parent_student ps
       JOIN users u ON u.id = ps.student_user_id
       WHERE ps.parent_user_id = ? AND u.role = 'student'
       ORDER BY u.name ASC`,
      [payload.userId]
    );
    return NextResponse.json({ children: rows }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}