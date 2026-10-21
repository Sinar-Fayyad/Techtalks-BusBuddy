import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticate } from '@/lib/api-auth';

// DELETE /api/parents/me/children/{studentId}   (API_CONTRACT entry 36) — parent unlinks a child
export async function DELETE(req: Request, { params }: { params: Promise<{ studentId: string }> }) {
  try {
    const a = authenticate(req, ['parent']);
    if ('error' in a) return a.error;
    const studentId = Number((await params).studentId);
    if (!Number.isInteger(studentId) || studentId <= 0) {
      return NextResponse.json({ error: 'Invalid student id' }, { status: 400 });
    }
    const [result]: any = await pool.query(
      'DELETE FROM parent_student WHERE parent_user_id = ? AND student_user_id = ?',
      [a.payload.userId, studentId]
    );
    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Child not linked' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Child unlinked' }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
