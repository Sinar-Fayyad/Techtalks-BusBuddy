import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticate } from '@/lib/api-auth';

// GET /api/admin/drivers   (API_CONTRACT entry 3, v13)
// ?status=pending (default, as before) | verified | rejected | all
export async function GET(req: Request) {
  try {
    const a = authenticate(req, ['admin']);
    if ('error' in a) return a.error;

    const status = new URL(req.url).searchParams.get('status') ?? 'pending';
    if (!['pending', 'verified', 'rejected', 'all'].includes(status)) {
      return NextResponse.json({ error: 'status must be pending, verified, rejected or all' }, { status: 400 });
    }
    const where = status === 'all' ? '' : 'WHERE d.status = ?';
    const [rows] = await pool.query(
      `SELECT d.id, u.name, u.email, u.phone, d.license_url, d.status, d.vehicle_plate, d.seats, d.created_at
       FROM drivers d JOIN users u ON d.user_id = u.id
       ${where} ORDER BY d.created_at DESC, d.id DESC`,
      status === 'all' ? [] : [status]
    );
    return NextResponse.json({ drivers: rows });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
