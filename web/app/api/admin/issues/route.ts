import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticate } from '@/lib/api-auth';

// GET /api/admin/issues?status=open|resolved|all   (API_CONTRACT entry 47) — reported vehicle issues
export async function GET(req: Request) {
  try {
    const a = authenticate(req, ['admin']);
    if ('error' in a) return a.error;

    const status = new URL(req.url).searchParams.get('status') ?? 'open';
    if (!['open', 'resolved', 'all'].includes(status)) {
      return NextResponse.json({ error: 'status must be open, resolved or all' }, { status: 400 });
    }
    const [rows] = await pool.query(
      `SELECT i.id, i.category, i.message, i.status, i.trip_id, i.latitude, i.longitude,
              CAST(i.created_at AS CHAR) AS created_at, CAST(i.resolved_at AS CHAR) AS resolved_at,
              du.name AS driver_name, du.phone AS driver_phone, d.vehicle_plate
       FROM vehicle_issues i
       JOIN drivers d ON d.id = i.driver_id
       JOIN users du ON du.id = d.user_id
       ${status === 'all' ? '' : 'WHERE i.status = ?'}
       ORDER BY i.created_at DESC, i.id DESC LIMIT 200`,
      status === 'all' ? [] : [status]
    );
    return NextResponse.json({ issues: rows }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
