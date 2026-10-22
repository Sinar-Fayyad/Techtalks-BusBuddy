'use client';
import { useCallback, useEffect, useState } from 'react';
import DriverShell from '@/components/DriverShell';
import { useMe } from '@/components/AppShell';
import PageHead from '@/components/ui/PageHead';
import StatCard from '@/components/ui/StatCard';
import StatusChip from '@/components/ui/StatusChip';
import Avatar from '@/components/ui/Avatar';
import Icon from '@/components/ui/Icon';
import { api, errorOf } from '@/lib/client-api';
import { fmtDay, fmtTime } from '@/lib/format';

function StudentsContent() {
  const { token } = useMe();
  const [trips, setTrips] = useState<any[] | null>(null);
  const [tripId, setTripId] = useState<number | null>(null);
  const [rows, setRows] = useState<any[] | null>(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [error, setError] = useState('');

  // 1) trips with at least one booking (or the one in the URL / running now)
  useEffect(() => {
    (async () => {
      const [t, a] = await Promise.all([api(token, '/driver/scheduled-trips'), api(token, '/driver/trips/active')]);
      if (!t.ok) return setError(errorOf(t));
      const list: any[] = t.data.trips;
      setTrips(list);
      const fromUrl = Number(new URLSearchParams(window.location.search).get('trip'));
      const running = a.ok ? a.data.trip?.scheduled_trip_id : null;
      const upcoming = [...list].filter((x) => x.status === 'upcoming').sort((x, y) => x.scheduled_at.localeCompare(y.scheduled_at))[0];
      const pick = (fromUrl && list.find((x) => x.id === fromUrl)?.id) || running || upcoming?.id || list[0]?.id || null;
      setTripId(pick);
    })();
  }, [token]);

  // 2) its students (refreshes every 10 s while the trip is running)
  const loadRows = useCallback(async () => {
    if (!tripId) return setRows([]);
    const r = await api(token, `/driver/bookings?tripId=${tripId}`);
    if (r.ok) { setRows(r.data.bookings); setError(''); } else setError(errorOf(r));
  }, [token, tripId]);
  const running = trips?.find((t) => t.id === tripId)?.status === 'in_progress';
  useEffect(() => {
    loadRows();
    if (!running) return;
    const id = setInterval(loadRows, 10_000);
    return () => clearInterval(id);
  }, [loadRows, running]);

  const all = rows ?? [];
  const count = (s: string) => all.filter((b) => b.status === s).length;
  const shown = all.filter((b) => {
    if (status !== 'all' && b.status !== status) return false;
    const s = q.trim().toLowerCase();
    return !s || `${b.student_name} ${b.student_phone ?? ''} ${b.pickup ?? ''}`.toLowerCase().includes(s);
  });

  return (
    <>
      <PageHead icon="users" highlight="Students" subtitle="Students booked on a trip and their status" />
      {error && <div className="bb-alert bb-alert-error" style={{ marginBottom: '1rem' }} role="alert">{error}</div>}

      {trips && trips.length === 0 ? (
        <div className="bb-card bb-empty"><span className="bb-emoji">🧑‍🎓</span>No trips yet. Add a trip first; students can then book it.</div>
      ) : (
        <>
          <div className="bb-row" style={{ marginBottom: '1rem' }}>
            <label className="bb-label" htmlFor="trip-select" style={{ margin: 0 }}>Trip</label>
            <select id="trip-select" className="bb-select" style={{ width: 'auto', minWidth: 260, borderRadius: 999 }} value={tripId ?? ''} onChange={(e) => setTripId(Number(e.target.value))}>
              {(trips ?? []).map((t) => (
                <option key={t.id} value={t.id}>{fmtDay(t.scheduled_at)} {fmtTime(t.scheduled_at)} · {t.origin} → {t.destination} ({t.booked_count})</option>
              ))}
            </select>
          </div>

          <div className="bb-stats">
            <StatCard icon="users" value={all.length} label="Total booked" onClick={() => setStatus('all')} />
            <StatCard icon="check" value={count('on_board')} label="On board" tone="green" onClick={() => setStatus('on_board')} />
            <StatCard icon="clock" value={count('booked') + count('waiting')} label="Not yet picked up" tone="amber" onClick={() => setStatus('all')} />
            <StatCard icon="pin" value={count('exited')} label="Arrived" tone="violet" onClick={() => setStatus('exited')} />
            <StatCard icon="x" value={count('no_show')} label="No show" tone="pink" onClick={() => setStatus('no_show')} />
          </div>

          <div className="bb-row" style={{ marginBottom: '1rem' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
              <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--bb-cyan)', display: 'flex' }}><Icon name="search" size={19} /></span>
              <input className="bb-input" style={{ borderRadius: 999, paddingLeft: 44 }} placeholder="Search by name, phone or stop…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <select className="bb-select" style={{ width: 'auto', borderRadius: 999 }} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
              <option value="all">All statuses</option>
              <option value="booked">Booked</option>
              <option value="waiting">Waiting</option>
              <option value="on_board">On board</option>
              <option value="exited">Arrived</option>
              <option value="no_show">No show</option>
            </select>
          </div>

          {rows === null ? <div className="bb-skeleton" /> : shown.length === 0 ? (
            <div className="bb-card bb-empty"><span className="bb-emoji">🧑‍🎓</span>{all.length === 0 ? 'Nobody booked this trip yet.' : 'No students match your filters.'}</div>
          ) : (
            <div className="bb-table-wrap">
              <table className="bb-table">
                <thead><tr><th>Student</th><th>Phone</th><th>Pickup stop</th><th>Status</th><th>Booked</th></tr></thead>
                <tbody>
                  {shown.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <div className="bb-row" style={{ gap: 10, flexWrap: 'nowrap' }}>
                          <Avatar name={b.student_name} size={38} />
                          <div><b>{b.student_name}</b><div className="bb-small bb-muted">{b.student_university ?? ''}</div></div>
                        </div>
                      </td>
                      <td>{b.student_phone ? <a href={`tel:${b.student_phone}`} style={{ color: 'var(--bb-cyan)' }}>{b.student_phone}</a> : '—'}</td>
                      <td>{b.pickup || '—'}</td>
                      <td><StatusChip status={b.status} /></td>
                      <td className="bb-muted bb-small">{fmtDay(b.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  );
}

export default function DriverStudentsPage() {
  return <DriverShell><StudentsContent /></DriverShell>;
}
