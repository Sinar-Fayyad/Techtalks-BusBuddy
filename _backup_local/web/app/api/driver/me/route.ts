import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db';

export async function GET(req: Request) {
  try {
    // 1. Read the token from the Authorization header
    const auth = req.headers.get('authorization') ?? '';
    if (!auth.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing token' }, { status: 401 });
    }
    const token = auth.split(' ')[1];

    // 2. Verify it — same secret the login route signed with
    let payload: any;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET!);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // 3. Drivers only — mirrors the admin-only check in /admin/drivers
    if (payload.role !== 'driver') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 4. THE PRIVACY RULE: filter by the userId from the token.
    //    No ID ever comes from the URL, so a driver can only get their own row.
    const [rows] = await pool.query(
      `SELECT u.name, u.email, d.status, d.license_url, d.created_at
       FROM drivers d JOIN users u ON u.id = d.user_id
       WHERE d.user_id = ?`,
      [payload.userId]
    );

    const driver = (rows as any[])[0];
    if (!driver) {
      // A driver account exists but never completed registration (no profile row)
      return NextResponse.json({ error: 'No driver profile yet' }, { status: 404 });
    }

    return NextResponse.json({ driver });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}