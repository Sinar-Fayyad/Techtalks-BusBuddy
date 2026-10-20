import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticate } from '@/lib/api-auth';

async function readProfile(userId: number) {
  const [rows] = await pool.query(
    `SELECT u.name, u.email, d.status, d.license_url, d.created_at,
            d.phone, d.route, d.stops, d.price
     FROM drivers d JOIN users u ON u.id = d.user_id
     WHERE d.user_id = ?`,
    [userId]
  );
  return (rows as any[])[0] ?? null;
}

// GET /api/driver/me   (entry 6, v12: + phone, route, stops, price)
export async function GET(req: Request) {
  try {
    const a = authenticate(req, ['driver']);
    if ('error' in a) return a.error;
    const driver = await readProfile(a.payload.userId);
    if (!driver) return NextResponse.json({ error: 'No driver profile' }, { status: 404 });
    return NextResponse.json({ driver }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/driver/me   (API_CONTRACT entry 23) — edit phone / route / stops / price
export async function PATCH(req: Request) {
  try {
    const a = authenticate(req, ['driver']);
    if ('error' in a) return a.error;

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const sets: string[] = [];
    const vals: any[] = [];

    for (const [key, max] of [['phone', 30], ['route', 255], ['stops', 2000]] as const) {
      if (body[key] === undefined) continue;
      if (body[key] !== null && typeof body[key] !== 'string') {
        return NextResponse.json({ error: `Invalid ${key}` }, { status: 400 });
      }
      const v = body[key] === null ? null : body[key].trim();
      if (v && v.length > max) {
        return NextResponse.json({ error: `${key} too long (max ${max})` }, { status: 400 });
      }
      sets.push(`${key} = ?`);
      vals.push(v || null);
    }

    if (body.price !== undefined) {
      if (body.price === null) {
        sets.push('price = ?');
        vals.push(null);
      } else {
        const p = Number(body.price);
        if (
          !['number', 'string'].includes(typeof body.price) ||
          body.price === '' || !Number.isFinite(p) || p < 0 || p > 999999.99
        ) {
          return NextResponse.json({ error: 'Invalid price' }, { status: 400 });
        }
        sets.push('price = ?');
        vals.push(p);
      }
    }

    if (sets.length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    if (!(await readProfile(a.payload.userId))) {
      return NextResponse.json({ error: 'No driver profile' }, { status: 404 });
    }
    await pool.query(`UPDATE drivers SET ${sets.join(', ')} WHERE user_id = ?`, [
      ...vals,
      a.payload.userId,
    ]);
    return NextResponse.json(
      { message: 'Profile updated', driver: await readProfile(a.payload.userId) },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
