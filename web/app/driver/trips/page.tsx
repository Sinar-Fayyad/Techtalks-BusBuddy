'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DriverShell from '@/components/DriverShell';
import { useMe } from '@/components/AppShell';
import TripFormModal, { TripDraft } from '@/components/TripFormModal';
import PageHead from '@/components/ui/PageHead';
import StatCard from '@/components/ui/StatCard';
import StatusChip from '@/components/ui/StatusChip';
import Icon from '@/components/ui/Icon';
import { api, errorOf } from '@/lib/client-api';
import { fmtDay, fmtTime, money } from '@/lib/format';

function TripsContent() {
  const { token } = useMe();
  const router = useRouter();
  const [trips, setTrips] = useState<any[] | null>(null);
  const [counts, setCounts] = useState({ total: 0, upcoming: 0, completed: 0, cancelled: 0 });
  const [profile, setProfile] = useState<any | null>(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState<{ trip?: TripDraft } | null>(null);

  const load = useCallback(async () => {
    const [t, p] = await Promise.all([api(token, '/driver/scheduled-trips'), api(token, '/driver/me')]);
    if (t.ok) { setTrips(t.data.trips); setCounts(t.data.counts); setError(''); } else setError(errorOf(t));
    if (p.ok) setProfile(p.data.driver);
  }, [token]);
  useEffect(() => { load(); }, [load]);

  async function cancelTrip(t: any) {
    const warn = t.booked_count > 0 ? ` ${t.booked_count} student(s) booked it and will be notified.` : '';
    if (!window.confirm(`Cancel ${t.origin} → ${t.destination}?${warn}`)) return;
    const r = await api(token, `/driver/scheduled-trips/${t.id}`, { method: 'PATCH', body: { cancelled: true } });
    if (!r.ok) return setError(errorOf(r));
    setNotice('Trip cancelled.');
    load();
  }
  async function deleteTrip(t: any) {
    if (!window.confirm(`Delete ${t.origin} → ${t.destination}? This cannot be undone.`)) return;
    const r = await api(token, `/driver/scheduled-trips/${t.id}`, { method: 'DELETE' });
    if (!r.ok) return setError(errorOf(r));
    setNotice('Trip deleted.');
    load();
  }

  const verified = profile?.status === 'verified';
  const shown = (trips ?? []).filter((t) => {
    if (status !== 'all' && t.status !== status) return false;
    const s = q.trim().toLowerCase();
    return !s || `${t.origin} ${t.destination}`.toLowerCase().includes(s);
  });

  return (
    <>
      <PageHead
        icon="bus" highlight="Trips" subtitle="Manage your routes and trip history"
        action={verified ? <button className="bb-btn" onClick={() => setForm({})}><Icon name="plus" size={18} /> Add trip</button> : undefined}
      />
      {error && <div className="bb-alert bb-alert-error" style={{ marginBottom: '1rem' }} role="alert">{error}</div>}
      {notice && <div className="bb-alert bb-alert-ok" style={{ marginBottom: '1rem' }}>{notice}</div>}
      {profile && !verified && <div className="bb-alert bb-alert-info" style={{ marginBottom: '1rem' }}>You can add trips after an admin verifies your license.</div>}

      <div className="bb-stats">
        <StatCard icon="bus" value={counts.total} label="Total trips" />
        <StatCard icon="check" value={counts.completed} label="Completed" tone="green" onClick={() => setStatus('completed')} />
        <StatCard icon="clock" value={counts.upcoming} label="Upcoming" tone="cyan" onClick={() => setStatus('upcoming')} />
        <StatCard icon="x" value={counts.cancelled} label="Cancelled" tone="pink" onClick={() => setStatus('cancelled')} />
      </div>

      <div className="bb-row" style={{ marginBottom: '1rem' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--bb-cyan)', display: 'flex' }}><Icon name="search" size={19} /></span>
          <input className="bb-input" style={{ borderRadius: 999, paddingLeft: 44 }} placeholder="Search trips…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="bb-select" style={{ width: 'auto', borderRadius: 999 }} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          <option value="all">All statuses</option>
          <option value="upcoming">Upcoming</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {trips === null ? <div className="bb-skeleton" /> : shown.length === 0 ? (
        <div className="bb-card bb-empty"><span className="bb-emoji">🗓️</span>{trips.length === 0 ? 'No trips yet.' : 'No trips match your filters.'}</div>
      ) : (
        <div className="bb-table-wrap">
          <table className="bb-table">
            <thead><tr><th>Route</th><th>Date &amp; time</th><th>Students</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {shown.map((t) => (
                <tr key={t.id}>
                  <td><b>{t.origin}</b> → {t.destination}</td>
                  <td>{fmtDay(t.scheduled_at)}<div className="bb-small bb-muted">{fmtTime(t.scheduled_at)}</div></td>
                  <td>{t.booked_count} / {t.seats}</td>
                  <td>{money(t.price)}</td>
                  <td><StatusChip status={t.status} /></td>
                  <td>
                    <div className="bb-row" style={{ gap: 6 }}>
                      <button className="bb-btn bb-btn-sm bb-btn-ghost" onClick={() => router.push(`/driver/students?trip=${t.id}`)}><Icon name="users" size={14} /> Students</button>
                      {t.status === 'upcoming' && (
                        <>
                          <button className="bb-btn bb-btn-sm bb-btn-ghost" onClick={() => setForm({ trip: t })}><Icon name="pencil" size={14} /> Edit</button>
                          {t.booked_count === 0 ? (
                            <button className="bb-btn bb-btn-sm bb-btn-danger" onClick={() => deleteTrip(t)}><Icon name="trash" size={14} /> Delete</button>
                          ) : (
                            <button className="bb-btn bb-btn-sm bb-btn-danger" onClick={() => cancelTrip(t)}><Icon name="x" size={14} /> Cancel</button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {form && (
        <TripFormModal
          token={token}
          trip={form.trip}
          defaults={{ seats: profile?.seats, price: profile?.price }}
          onClose={() => setForm(null)}
          onSaved={(m) => { setNotice(m); load(); }}
        />
      )}
    </>
  );
}

export default function DriverTripsPage() {
  return <DriverShell><TripsContent /></DriverShell>;
}
