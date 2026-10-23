'use client';
import { useEffect, useState } from 'react';
import AdminShell from '@/components/AdminShell';
import { useMe } from '@/components/AppShell';
import PageHead from '@/components/ui/PageHead';
import StatusChip from '@/components/ui/StatusChip';
import { api, errorOf } from '@/lib/client-api';
import { fmtDay, fmtTime, money } from '@/lib/format';

const FILTERS = ['all', 'upcoming', 'in_progress', 'completed', 'cancelled'] as const;
const LABEL: Record<string, string> = { all: 'All', upcoming: 'Upcoming', in_progress: 'In progress', completed: 'Completed', cancelled: 'Cancelled' };

function TripsContent() {
  const { token } = useMe();
  const [status, setStatus] = useState<(typeof FILTERS)[number]>('all');
  const [rows, setRows] = useState<any[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get('status');
    if (s && (FILTERS as readonly string[]).includes(s)) setStatus(s as any);
  }, []);
  useEffect(() => {
    setRows(null);
    (async () => {
      const r = await api(token, `/admin/trips?status=${status}`);
      if (r.ok) { setRows(r.data.trips); setError(''); } else setError(errorOf(r));
    })();
  }, [token, status]);

  return (
    <>
      <PageHead icon="calendar" highlight="Trips" subtitle="Every trip planned by drivers" />
      {error && <div className="bb-alert bb-alert-error" style={{ marginBottom: '1rem' }} role="alert">{error}</div>}
      <div className="bb-tabs" role="tablist" style={{ marginBottom: '1rem' }}>
        {FILTERS.map((f) => <button key={f} className="bb-tab" role="tab" aria-selected={status === f} onClick={() => setStatus(f)}>{LABEL[f]}</button>)}
      </div>
      {rows === null ? <div className="bb-skeleton" /> : rows.length === 0 ? (
        <div className="bb-card bb-empty"><span className="bb-emoji">🗓️</span>No trips.</div>
      ) : (
        <div className="bb-table-wrap">
          <table className="bb-table">
            <thead><tr><th>Route</th><th>Driver</th><th>Date &amp; time</th><th>Students</th><th>Price</th><th>Status</th></tr></thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id}>
                  <td><b>{t.origin}</b> → {t.destination}</td>
                  <td>{t.driver_name}{t.vehicle_plate && <div className="bb-small bb-muted">Bus {t.vehicle_plate}</div>}</td>
                  <td>{fmtDay(t.scheduled_at)}<div className="bb-small bb-muted">{fmtTime(t.scheduled_at)}</div></td>
                  <td>{t.booked_count} / {t.seats}</td>
                  <td>{money(t.price)}</td>
                  <td><StatusChip status={t.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default function AdminTripsPage() {
  return <AdminShell><TripsContent /></AdminShell>;
}
