import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Shared auth check (same logic as the old inline pattern).
// Usage:
//   const a = authenticate(req, ['student']);
//   if ('error' in a) return a.error;
//   const { userId } = a.payload;
type Ok = { payload: { userId: number; role: string } };
type Fail = { error: NextResponse };

export function authenticate(req: Request, roles?: string[]): Ok | Fail {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) {
    return { error: NextResponse.json({ error: 'No token' }, { status: 401 }) };
  }
  let payload: any;
  try {
    payload = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET!);
  } catch {
    return { error: NextResponse.json({ error: 'Invalid token' }, { status: 401 }) };
  }
  if (roles && !roles.includes(payload.role)) {
    return { error: NextResponse.json({ error: 'Not allowed for your role' }, { status: 403 }) };
  }
  return { payload };
}
