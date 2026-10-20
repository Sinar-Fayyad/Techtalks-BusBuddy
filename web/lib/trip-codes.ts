import jwt from 'jsonwebtoken';

// QR payloads. "board" and "exit" codes are different strings, so they can never be confused.
export type CodeKind = 'board' | 'exit';

export function signTripCode(kind: CodeKind, tripId: number): string {
  return jwt.sign({ kind, tripId }, process.env.JWT_SECRET!, { expiresIn: '24h' });
}

// Returns the tripId, or null if the code is invalid / expired / the wrong kind.
export function readTripCode(code: unknown, kind: CodeKind): number | null {
  if (typeof code !== 'string') return null;
  try {
    const p: any = jwt.verify(code, process.env.JWT_SECRET!);
    if (p.kind !== kind || !Number.isInteger(p.tripId)) return null;
    return p.tripId;
  } catch {
    return null;
  }
}
