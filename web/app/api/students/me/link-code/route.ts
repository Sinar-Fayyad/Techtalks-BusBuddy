import { NextResponse } from 'next/server';
import { randomInt } from 'crypto';
import pool from '@/lib/db';
import { authenticate } from '@/lib/api-auth';

// POST /api/students/me/link-code   (API_CONTRACT entry 33)
// Student generates a fresh 6-digit code (valid 10 minutes, single use; replaces the previous code).
// A parent needs this code AND the student's email to link.
export async function POST(req: Request) {
  try {
    const a = authenticate(req, ['student']);
    if ('error' in a) return a.error;

    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    await pool.query(
      `INSERT INTO link_codes (student_id, code, expires_at)
       VALUES (?, ?, UTC_TIMESTAMP(3) + INTERVAL 10 MINUTE)
       ON DUPLICATE KEY UPDATE code = VALUES(code), expires_at = VALUES(expires_at)`,
      [a.payload.userId, code]
    );
    const [rows] = await pool.query(
      'SELECT CAST(expires_at AS CHAR) AS expires_at FROM link_codes WHERE student_id = ?',
      [a.payload.userId]
    );
    return NextResponse.json(
      { code, expires_at: (rows as any[])[0].expires_at, expires_in_seconds: 600 },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
