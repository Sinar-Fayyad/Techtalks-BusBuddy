import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticate } from '@/lib/api-auth';

// GET /api/students/me/parents   (API_CONTRACT entry 34) — parents linked to the logged-in student
export async function GET(req: Request) {
  try {
    const a = authenticate(req, ['student']);
    if ('error' in a) return a.error;
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone
       FROM parent_student ps JOIN users u ON u.id = ps.parent_user_id
       WHERE ps.student_user_id = ? ORDER BY u.name ASC`,
      [a.payload.userId]
    );
    return NextResponse.json({ parents: rows }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
