import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticate } from '@/lib/api-auth';
import { notify } from '@/lib/notify';

const MAX_FAILED_ATTEMPTS = 5; // per parent, per 15 minutes

// POST /api/parents/me/children   (API_CONTRACT entry 12, v13 — SECURE linking)
// Body: { email, code } — the student's email + the 6-digit code from the student's profile.
// studentId / email-only linking is REMOVED (anyone could watch any student).
export async function POST(req: Request) {
  try {
    const a = authenticate(req, ['parent']);
    if ('error' in a) return a.error;
    const parentId = a.payload.userId;

    const body = await req.json().catch(() => null);
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const code = typeof body?.code === 'string' ? body.code.trim() : '';
    if (!email || !/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: 'Enter the student email and the 6-digit code' }, { status: 400 });
    }

    // brute-force guard
    const [att] = await pool.query(
      `SELECT COUNT(*) AS n FROM link_attempts
       WHERE parent_id = ? AND attempted_at > UTC_TIMESTAMP(3) - INTERVAL 15 MINUTE`,
      [parentId]
    );
    if ((att as any[])[0].n >= MAX_FAILED_ATTEMPTS) {
      return NextResponse.json({ error: 'Too many attempts. Try again in 15 minutes.' }, { status: 429 });
    }

    const [found] = await pool.query(
      `SELECT u.id, u.name, u.email
       FROM users u JOIN link_codes lc ON lc.student_id = u.id
       WHERE u.email = ? AND u.role = 'student' AND lc.code = ? AND lc.expires_at > UTC_TIMESTAMP(3)`,
      [email, code]
    );
    const student = (found as any[])[0];
    if (!student) {
      await pool.query('INSERT INTO link_attempts (parent_id, attempted_at) VALUES (?, UTC_TIMESTAMP(3))', [parentId]);
      // same message for unknown email / wrong code / expired code (no account enumeration)
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 404 });
    }

    const [existing] = await pool.query(
      'SELECT parent_user_id FROM parent_student WHERE parent_user_id = ? AND student_user_id = ?',
      [parentId, student.id]
    );
    if ((existing as any[]).length > 0) {
      return NextResponse.json({ error: 'Link already exists' }, { status: 409 });
    }

    try {
      await pool.query('INSERT INTO parent_student (parent_user_id, student_user_id) VALUES (?, ?)', [
        parentId,
        student.id,
      ]);
    } catch (err: any) {
      if (err.code === 'ER_DUP_ENTRY') {
        return NextResponse.json({ error: 'Link already exists' }, { status: 409 });
      }
      throw err;
    }
    // single use + clean the failed attempts
    await pool.query('DELETE FROM link_codes WHERE student_id = ?', [student.id]);
    await pool.query('DELETE FROM link_attempts WHERE parent_id = ?', [parentId]);

    const [pn] = await pool.query('SELECT name FROM users WHERE id = ?', [parentId]);
    await notify([student.id], 'linked', 'A parent was linked',
      `${(pn as any[])[0]?.name ?? 'A parent'} can now see your location while you are on a trip. You can remove them from your profile.`,
      { parentId });

    return NextResponse.json(
      { message: 'Child linked', child: { id: student.id, name: student.name, email: student.email } },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET /api/parents/me/children   (API_CONTRACT entry 15, v13: + phone, university)
export async function GET(req: Request) {
  try {
    const a = authenticate(req, ['parent']);
    if ('error' in a) return a.error;
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone, u.university
       FROM parent_student ps
       JOIN users u ON u.id = ps.student_user_id
       WHERE ps.parent_user_id = ? AND u.role = 'student'
       ORDER BY u.name ASC`,
      [a.payload.userId]
    );
    return NextResponse.json({ children: rows }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
