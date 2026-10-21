import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticate } from '@/lib/api-auth';

// PATCH /api/admin/issues/{id}   (API_CONTRACT entry 48) — body { status: "resolved" }
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const a = authenticate(req, ['admin']);
    if ('error' in a) return a.error;
    const id = Number((await params).id);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: 'Invalid issue id' }, { status: 400 });
    }
    const body = await req.json().catch(() => null);
    if (body?.status !== 'resolved') {
      return NextResponse.json({ error: 'status must be "resolved"' }, { status: 400 });
    }
    const [r]: any = await pool.query(
      "UPDATE vehicle_issues SET status = 'resolved', resolved_at = UTC_TIMESTAMP(3) WHERE id = ? AND status = 'open'",
      [id]
    );
    if (r.affectedRows === 0) {
      const [ex] = await pool.query('SELECT id FROM vehicle_issues WHERE id = ?', [id]);
      if ((ex as any[]).length === 0) {
        return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Issue already resolved' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Issue resolved' }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
