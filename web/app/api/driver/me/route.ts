import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticate } from '@/lib/api-auth';
import { normalizePhone } from '@/lib/validation';

async function readProfile(userId: number) {
  const [rows] = await pool.query(
    `SELECT u.name, u.email, u.phone, d.status, d.license_url, d.created_at,
            d.vehicle_plate, d.seats, d.route, d.stops, d.price
     FROM drivers d JOIN users u ON u.id = d.user_id
     WHERE d.user_id = ?`,
    [userId]
  );
  const driver: any = (rows as any[])[0];
  if (!driver) return null;
  // "Complete your profile" banner: these three are needed before offering trips.
  const missing: string[] = [];
  if (!driver.vehicle_plate) missing.push('vehicle_plate');
  if (!driver.seats) missing.push('seats');
  if (driver.price === null) missing.push('price');
  driver.missing_fields = missing;
  driver.profile_complete = missing.length === 0;
  return driver;
}

// GET /api/driver/me   (entry 6, v13)
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

// PATCH /api/driver/me   (API_CONTRACT entry 23, v13)
// Any of: name, phone (account) · vehicle_plate, seats, route, stops, price (driver) · license_url
export async function PATCH(req: Request) {
  try {
    const a = authenticate(req, ['driver']);
    if ('error' in a) return a.error;
    const userId = a.payload.userId;

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const userSets: string[] = [];
    const userVals: any[] = [];
    const drvSets: string[] = [];
    const drvVals: any[] = [];

    // --- account fields (users table) ---
    if (body.name !== undefined) {
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      if (name.length < 2 || name.length > 100) {
        return NextResponse.json({ error: 'Name must be 2-100 characters' }, { status: 400 });
      }
      userSets.push('name = ?');
      userVals.push(name);
    }
    if (body.phone !== undefined) {
      const phone = normalizePhone(body.phone);
      if (!phone) return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
      const [dup] = await pool.query('SELECT id FROM users WHERE phone = ? AND id <> ?', [phone, userId]);
      if ((dup as any[]).length > 0) {
        return NextResponse.json({ error: 'Phone number already registered' }, { status: 409 });
      }
      userSets.push('phone = ?');
      userVals.push(phone);
    }

    // --- text fields (drivers table) ---
    for (const [key, max] of [['vehicle_plate', 30], ['route', 255], ['stops', 2000]] as const) {
      if (body[key] === undefined) continue;
      if (body[key] !== null && typeof body[key] !== 'string') {
        return NextResponse.json({ error: `Invalid ${key}` }, { status: 400 });
      }
      const v = body[key] === null ? null : body[key].trim();
      if (v && v.length > max) {
        return NextResponse.json({ error: `${key} too long (max ${max})` }, { status: 400 });
      }
      drvSets.push(`${key} = ?`);
      drvVals.push(v || null);
    }

    // --- seats ---
    if (body.seats !== undefined) {
      if (body.seats === null) {
        drvSets.push('seats = ?');
        drvVals.push(null);
      } else {
        const n = Number(body.seats);
        if (!Number.isInteger(n) || n < 1 || n > 100) {
          return NextResponse.json({ error: 'seats must be a whole number 1-100' }, { status: 400 });
        }
        drvSets.push('seats = ?');
        drvVals.push(n);
      }
    }

    // --- price ---
    if (body.price !== undefined) {
      if (body.price === null) {
        drvSets.push('price = ?');
        drvVals.push(null);
      } else {
        const p = Number(body.price);
        if (
          !['number', 'string'].includes(typeof body.price) ||
          body.price === '' || !Number.isFinite(p) || p < 0 || p > 999999.99
        ) {
          return NextResponse.json({ error: 'Invalid price' }, { status: 400 });
        }
        drvSets.push('price = ?');
        drvVals.push(p);
      }
    }

    // --- new license file: goes back to pending until an admin verifies it ---
    if (body.license_url !== undefined) {
      if (
        typeof body.license_url !== 'string' ||
        !body.license_url.startsWith('/uploads/') ||
        body.license_url.includes('..') ||
        body.license_url.length > 255
      ) {
        return NextResponse.json({ error: 'Invalid license_url' }, { status: 400 });
      }
      drvSets.push('license_url = ?', "status = 'pending'");
      drvVals.push(body.license_url);
    }

    if (userSets.length === 0 && drvSets.length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }
    if (!(await readProfile(userId))) {
      return NextResponse.json({ error: 'No driver profile' }, { status: 404 });
    }

    try {
      if (userSets.length > 0) {
        await pool.query(`UPDATE users SET ${userSets.join(', ')} WHERE id = ?`, [...userVals, userId]);
      }
      if (drvSets.length > 0) {
        await pool.query(`UPDATE drivers SET ${drvSets.join(', ')} WHERE user_id = ?`, [...drvVals, userId]);
      }
    } catch (err: any) {
      if (err.code === 'ER_DUP_ENTRY') {
        return NextResponse.json({ error: 'Phone number already registered' }, { status: 409 });
      }
      throw err;
    }
    return NextResponse.json(
      { message: 'Profile updated', driver: await readProfile(userId) },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
