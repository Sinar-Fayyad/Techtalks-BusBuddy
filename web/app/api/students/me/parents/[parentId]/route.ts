import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticate } from '@/lib/api-auth';

// DELETE /api/students/me/parents/{parentId}   (API_CONTRACT entry 35) — student removes a linked parent
export async function DELETE(req: Request, { params }: { params: Promise<{ parentId: string }> }) {
  try {
    const a = authenticate(req, ['student']);
    if ('error' in a) return a.error;
    const parentId = Number((await params).parentId);
    if (!Number.isInteger(parentId) || parentId <= 0) {
      return NextResponse.json({ error: 'Invalid parent id' }, { status: 400 });
    }
    const [result]: any = await pool.query(
      'DELETE FROM parent_student WHERE parent_user_id = ? AND student_user_id = ?',
      [parentId, a.payload.userId]
    );
    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Parent not linked' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Parent removed' }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
