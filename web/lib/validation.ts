// Small shared validators (used by auth + driver + trips routes).

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// "+961 70 123 456" / "70-123-456" -> "+96170123456" / "70123456". null if invalid.
export function normalizePhone(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const s = v.replace(/[\s\-().]/g, '');
  return /^\+?\d{7,15}$/.test(s) ? s : null;
}

// ISO date string (any timezone) -> MySQL DATETIME(3) string in UTC. null if invalid.
export function toMysqlUtc(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const d = new Date(v);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().replace('T', ' ').replace('Z', '');
}

// MySQL UTC string ("2026-10-20 07:55:10.377") -> Date
export function fromMysqlUtc(v: string): Date {
  return new Date(v.replace(' ', 'T') + 'Z');
}
