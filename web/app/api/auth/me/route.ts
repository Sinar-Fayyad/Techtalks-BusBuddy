import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticate } from '@/lib/api-auth';
import { normalizePhone } from '@/lib/validation';

async function readUser(userId: number) {
  const [rows] = await pool.query(
    'SELECT id, name, email, phone, university, role, CAST(created_at AS CHAR) AS created_at FROM users WHERE id = ?',
    [userId]
  );
  return (rows as any[])[0] ?? null;
}

// GET /api/auth/me   (API_CONTRACT entry 38) — the caller's own account (any role)
export async function GET(req: Request) {
  try {
    const a = authenticate(req);
    if ('error' in a) return a.error;
    const user = await readUser(a.payload.userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json({ user }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/auth/me   (API_CONTRACT entry 39) — edit name / phone / university (students)
export async function PATCH(req: Request) {
  try {
    const a = authenticate(req);
    if ('error' in a) return a.error;

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const sets: string[] = [];
    const vals: any[] = [];

    if (body.name !== undefined) {
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      if (name.length < 2 || name.length > 100) {
        return NextResponse.json({ error: 'Name must be 2-100 characters' }, { status: 400 });
      }
      sets.push('name = ?');
      vals.push(name);
    }
    if (body.phone !== undefined) {
      const phone = normalizePhone(body.phone);
      if (!phone) return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
      const [dup] = await pool.query('SELECT id FROM users WHERE phone = ? AND id <> ?', [
        phone,
        a.payload.userId,
      ]);
      if ((dup as any[]).length > 0) {
        return NextResponse.json({ error: 'Phone number already registered' }, { status: 409 });
      }
      sets.push('phone = ?');
      vals.push(phone);
    }
    if (body.university !== undefined) {
      if (a.payload.role !== 'student') {
        return NextResponse.json({ error: 'Only students have a university' }, { status: 400 });
      }
      const uni = typeof body.university === 'string' ? body.university.trim() : '';
      if (!uni || uni.length > 150) {
        return NextResponse.json({ error: 'Invalid university name' }, { status: 400 });
      }
      sets.push('university = ?');
      vals.push(uni);
    }
    if (sets.length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    try {
      await pool.query(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, [...vals, a.payload.userId]);
    } catch (err: any) {
      if (err.code === 'ER_DUP_ENTRY') {
        return NextResponse.json({ error: 'Phone number already registered' }, { status: 409 });
      }
      throw err;
    }
    return NextResponse.json(
      { message: 'Account updated', user: await readUser(a.payload.userId) },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
