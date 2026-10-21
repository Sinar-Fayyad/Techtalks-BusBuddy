import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db';
import { normalizePhone } from '@/lib/validation';

// POST /api/auth/login   (API_CONTRACT entry 2, v13)
// Body: { identifier, password }  — identifier = email OR phone number.
// Legacy { email, password } still works.
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const raw = String(body?.identifier ?? body?.email ?? '').trim();
    const password = typeof body?.password === 'string' ? body.password : '';
    if (!raw || !password) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    let rows: any;
    if (raw.includes('@')) {
      [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [raw.toLowerCase()]);
    } else {
      const phone = normalizePhone(raw);
      if (!phone) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }
      [rows] = await pool.query('SELECT * FROM users WHERE phone = ?', [phone]);
    }
    const user = (rows as any[])[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    return NextResponse.json({ message: 'Login OK', token, role: user.role, name: user.name });
  } catch (err: any) {
    console.error('LOGIN ERROR:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
