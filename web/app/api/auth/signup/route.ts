import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';

// Only these roles can be self-created. admin is NEVER allowed via signup
// (admins exist only through database/seed.sql).
const ALLOWED_ROLES = ['driver', 'student', 'parent'];

export async function POST(req: Request) {
  try {
    const { name, email, password, role } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    if (role === 'admin') {
      return NextResponse.json({ error: 'Admin accounts cannot be created via signup' }, { status: 403 });
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if ((existing as any[]).length > 0) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 10);
    // Unknown/omitted role falls back to driver (v4 behavior preserved).
    const finalRole = ALLOWED_ROLES.includes(role) ? role : 'driver';
    const [result]: any = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, hash, finalRole]
    );

    return NextResponse.json({ message: 'User created', userId: result.insertId }, { status: 201 });
  } catch (err) {
    console.error('SIGNUP ERROR:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
