import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticate } from '@/lib/api-auth';

// GET /api/notifications   (API_CONTRACT entry 42) — the caller's latest 50 notifications (any role)
export async function GET(req: Request) {
  try {
    const a = authenticate(req);
    if ('error' in a) return a.error;
    const [rows] = await pool.query(
      `SELECT id, type, title, body, data, CAST(created_at AS CHAR) AS created_at,
              CAST(read_at AS CHAR) AS read_at
       FROM notifications WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 50`,
      [a.payload.userId]
    );
    const [cnt] = await pool.query(
      'SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND read_at IS NULL',
      [a.payload.userId]
    );
    return NextResponse.json(
      { notifications: rows, unread_count: (cnt as any[])[0].n },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
