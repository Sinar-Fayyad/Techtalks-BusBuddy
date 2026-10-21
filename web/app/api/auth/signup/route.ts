import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';
import { EMAIL_RE, normalizePhone } from '@/lib/validation';

// POST /api/auth/signup   (API_CONTRACT entry 1, v13)
// Self-signable roles only. admin is NEVER allowed via signup (admins exist only via seed.sql).
const ALLOWED_ROLES = ['driver', 'student', 'parent'];

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const { role } = body;

    if (role === 'admin') {
      return NextResponse.json({ error: 'Admin accounts cannot be created via signup' }, { status: 403 });
    }

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    if (name.length < 2 || name.length > 100) {
      return NextResponse.json({ error: 'Name must be 2-100 characters' }, { status: 400 });
    }
    if (!EMAIL_RE.test(email) || email.length > 150) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }
    const phone = normalizePhone(body.phone);
    if (!phone) {
      return NextResponse.json({ error: 'A valid phone number is required' }, { status: 400 });
    }

    // Unknown/omitted role falls back to driver (v4 behavior preserved).
    const finalRole = ALLOWED_ROLES.includes(role) ? role : 'driver';

    let university: string | null = null;
    if (finalRole === 'student') {
      university = typeof body.university === 'string' ? body.university.trim() : '';
      if (!university) {
        return NextResponse.json({ error: 'University name is required' }, { status: 400 });
      }
      if (university.length > 150) {
        return NextResponse.json({ error: 'University name too long' }, { status: 400 });
      }
    }

    const [dupEmail] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if ((dupEmail as any[]).length > 0) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }
    const [dupPhone] = await pool.query('SELECT id FROM users WHERE phone = ?', [phone]);
    if ((dupPhone as any[]).length > 0) {
      return NextResponse.json({ error: 'Phone number already registered' }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 10);
    try {
      const [result]: any = await pool.query(
        'INSERT INTO users (name, email, phone, university, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)',
        [name, email, phone, university, hash, finalRole]
      );
      return NextResponse.json({ message: 'User created', userId: result.insertId }, { status: 201 });
    } catch (err: any) {
      if (err.code === 'ER_DUP_ENTRY') {
        return NextResponse.json({ error: 'Email or phone already registered' }, { status: 409 });
      }
      throw err;
    }
  } catch (err) {
    console.error('SIGNUP ERROR:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
