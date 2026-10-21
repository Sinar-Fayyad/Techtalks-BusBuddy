import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticate } from '@/lib/api-auth';

// GET /api/admin/users?role=student|parent&q=   (API_CONTRACT entry 45)
// Students come with their linked-parent count; parents with their children count.
export async function GET(req: Request) {
  try {
    const a = authenticate(req, ['admin']);
    if ('error' in a) return a.error;

    const url = new URL(req.url);
    const role = url.searchParams.get('role') ?? 'student';
    if (!['student', 'parent'].includes(role)) {
      return NextResponse.json({ error: 'role must be student or parent' }, { status: 400 });
    }
    const q = (url.searchParams.get('q') ?? '').trim().slice(0, 100);
    const params: any[] = [role];
    let search = '';
    if (q) {
      const like = `%${q}%`;
      search = ' AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ? OR u.university LIKE ?)';
      params.push(like, like, like, like);
    }
    const linkCount =
      role === 'student'
        ? '(SELECT COUNT(*) FROM parent_student ps WHERE ps.student_user_id = u.id)'
        : '(SELECT COUNT(*) FROM parent_student ps WHERE ps.parent_user_id = u.id)';
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone, u.university, CAST(u.created_at AS CHAR) AS created_at,
              ${linkCount} AS links,
              ${role === 'student' ? '(SELECT COUNT(*) FROM bookings b WHERE b.student_id = u.id)' : '0'} AS bookings
       FROM users u WHERE u.role = ?${search}
       ORDER BY u.created_at DESC, u.id DESC LIMIT 500`,
      params
    );
    return NextResponse.json({ users: rows }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
