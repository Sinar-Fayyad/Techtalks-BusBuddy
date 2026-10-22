// Date/time helpers. The API returns UTC strings WITHOUT a timezone ("2026-10-20 07:55:10.377").
export function parseUtc(v: string | null | undefined): Date | null {
  if (!v) return null;
  let s = v.trim().replace(' ', 'T');
  if (!/(Z|[+-]\d{2}:?\d{2})$/.test(s)) s += 'Z';
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export function fmtTime(v: string | null | undefined): string {
  const d = parseUtc(v);
  return d ? d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '—';
}

export function fmtDate(v: string | null | undefined): string {
  const d = parseUtc(v);
  return d ? d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) : '—';
}

// "Today" / "Tomorrow" / "Yesterday" / "Tue, Oct 21"
export function fmtDay(v: string | null | undefined): string {
  const d = parseUtc(v);
  if (!d) return '—';
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((start(d) - start(new Date())) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return fmtDate(v);
}

export function fmtDateTime(v: string | null | undefined): string {
  return `${fmtDay(v)}, ${fmtTime(v)}`;
}

export function timeAgo(v: string | null | undefined): string {
  const d = parseUtc(v);
  if (!d) return '';
  const s = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return fmtDate(v);
}

export function initials(name: string | null | undefined): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

export function firstName(name: string | null | undefined): string {
  return (name ?? '').trim().split(/\s+/)[0] || 'there';
}

export function money(v: string | number | null | undefined): string {
  const n = Number(v);
  return Number.isFinite(n) ? `$${n.toFixed(2).replace(/\.00$/, '')}` : '—';
}

// <input type="datetime-local"> value ("2026-10-21T07:45", LOCAL time) -> UTC ISO string
export function localInputToIso(v: string): string {
  return new Date(v).toISOString();
}

// UTC API string -> value for <input type="datetime-local"> (local time)
export function toLocalInput(v: string | null | undefined): string {
  const d = parseUtc(v);
  if (!d) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

// "Hamra 7:15\nAUB Main Gate 7:30" -> [{name:'Hamra', time:'7:15'}, ...]
export function parseStops(stops: string | null | undefined): { name: string; time: string }[] {
  return (stops ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const m = line.match(/^(.*?)\s+(\d{1,2}[:.]\d{2}\s?(?:AM|PM|am|pm)?)$/);
      return m ? { name: m[1], time: m[2] } : { name: line, time: '' };
    });
}

export const PHONE_HINT = '+961 71 234 567';
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function phoneOk(v: string): boolean {
  return /^\+?\d{7,15}$/.test(v.replace(/[\s\-().]/g, ''));
}
