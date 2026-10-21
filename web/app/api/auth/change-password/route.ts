import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';
import { authenticate } from '@/lib/api-auth';

// POST /api/auth/change-password   (API_CONTRACT entry 40) — any logged-in role
export async function POST(req: Request) {
  try {
    const a = authenticate(req);
    if ('error' in a) return a.error;

    const body = await req.json().catch(() => null);
    const current = typeof body?.currentPassword === 'string' ? body.currentPassword : '';
    const next = typeof body?.newPassword === 'string' ? body.newPassword : '';
    if (!current || !next) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    if (next.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const [rows] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [a.payload.userId]);
    const user = (rows as any[])[0];
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (!(await bcrypt.compare(current, user.password_hash))) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    const hash = await bcrypt.hash(next, 10);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, a.payload.userId]);
    return NextResponse.json({ message: 'Password changed' }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
