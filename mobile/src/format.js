// Date / text helpers. The API sends UTC strings without a timezone ("2026-10-20 07:55:10.377").
export function parseUtc(v) {
  if (!v) return null;
  let s = String(v).trim().replace(' ', 'T');
  if (!/(Z|[+-]\d{2}:?\d{2})$/.test(s)) s += 'Z';
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}
const p2 = (n) => String(n).padStart(2, '0');
export function fmtTime(v) {
  const d = parseUtc(v);
  if (!d) return '—';
  const h = d.getHours();
  return `${h % 12 === 0 ? 12 : h % 12}:${p2(d.getMinutes())} ${h < 12 ? 'AM' : 'PM'}`;
}
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export function fmtDate(v) {
  const d = parseUtc(v);
  return d ? `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}` : '—';
}
export function fmtDay(v) {
  const d = parseUtc(v);
  if (!d) return '—';
  const start = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((start(d) - start(new Date())) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return fmtDate(v);
}
export function timeAgo(v) {
  const d = parseUtc(v);
  if (!d) return '';
  const s = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return fmtDate(v);
}
export function initials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}
export const firstName = (name) => String(name || '').trim().split(/\s+/)[0] || 'there';
export function money(v) {
  const n = Number(v);
  return Number.isFinite(n) ? `$${n.toFixed(2).replace(/\.00$/, '')}` : '—';
}
export function parseStops(stops) {
  return String(stops || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const m = line.match(/^(.*?)\s+(\d{1,2}[:.]\d{2}\s?(?:AM|PM|am|pm)?)$/);
      return m ? { name: m[1], time: m[2] } : { name: line, time: '' };
    });
}
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_HINT = '+961 71 234 567';
export const phoneOk = (v) => /^\+?\d{7,15}$/.test(String(v).replace(/[\s\-().]/g, ''));
// local "YYYY-MM-DD" + "HH:MM" -> UTC ISO string (null when invalid)
export function localToIso(date, time) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{1,2}:\d{2}$/.test(time)) return null;
  const [h, m] = time.split(':').map(Number);
  if (h > 23 || m > 59) return null;
  const d = new Date(`${date}T${p2(h)}:${p2(m)}:00`);
  return isNaN(d.getTime()) ? null : d.toISOString();
}
export function toLocalParts(v) {
  const d = parseUtc(v) || new Date();
  return { date: `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`, time: `${p2(d.getHours())}:${p2(d.getMinutes())}` };
}
