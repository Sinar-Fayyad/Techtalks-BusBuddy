import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticate } from '@/lib/api-auth';

// POST /api/notifications/read   (API_CONTRACT entry 43)
// Body: { id } marks one as read · {} or { all: true } marks every unread one as read.
export async function POST(req: Request) {
  try {
    const a = authenticate(req);
    if ('error' in a) return a.error;
    const body = await req.json().catch(() => ({}));

    if (body && body.id !== undefined) {
      const id = Number(body.id);
      if (!Number.isInteger(id) || id <= 0) {
        return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
      }
      const [r]: any = await pool.query(
        'UPDATE notifications SET read_at = UTC_TIMESTAMP(3) WHERE id = ? AND user_id = ? AND read_at IS NULL',
        [id, a.payload.userId]
      );
      return NextResponse.json({ message: 'Marked as read', updated: r.affectedRows }, { status: 200 });
    }
    const [r]: any = await pool.query(
      'UPDATE notifications SET read_at = UTC_TIMESTAMP(3) WHERE user_id = ? AND read_at IS NULL',
      [a.payload.userId]
    );
    return NextResponse.json({ message: 'All marked as read', updated: r.affectedRows }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
