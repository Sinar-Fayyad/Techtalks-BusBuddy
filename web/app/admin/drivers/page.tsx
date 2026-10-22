'use client';
import { useCallback, useEffect, useState } from 'react';
import AdminShell from '@/components/AdminShell';
import { useMe } from '@/components/AppShell';
import PageHead from '@/components/ui/PageHead';
import StatusChip from '@/components/ui/StatusChip';
import Avatar from '@/components/ui/Avatar';
import Icon from '@/components/ui/Icon';
import { api, errorOf } from '@/lib/client-api';
import { fmtDate } from '@/lib/format';
import { viewLicense } from '@/lib/view-license';

const TABS = ['pending', 'verified', 'rejected', 'all'] as const;

function DriversContent() {
  const { token } = useMe();
  const [tab, setTab] = useState<(typeof TABS)[number]>('pending');
  const [rows, setRows] = useState<any[] | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get('status');
    if (s && (TABS as readonly string[]).includes(s)) setTab(s as any);
  }, []);

  const load = useCallback(async () => {
    setRows(null);
    const r = await api(token, `/admin/drivers?status=${tab}`);
    if (r.ok) { setRows(r.data.drivers); setError(''); } else setError(errorOf(r));
  }, [token, tab]);
  useEffect(() => { load(); }, [load]);

  async function review(id: number, action: 'verify' | 'reject') {
    const r = await api(token, `/admin/drivers/${id}`, { method: 'PATCH', body: { action } });
    if (!r.ok) return setError(errorOf(r));
    setNotice(action === 'verify' ? 'Driver verified.' : 'Driver rejected.');
    load();
  }
  async function openLicense(url: string) {
    try { await viewLicense(token, url.split('/').pop() ?? ''); } catch (e: any) { setError(e?.message ?? 'Could not open the license.'); }
  }

  return (
    <>
      <PageHead icon="bus" highlight="Drivers" subtitle="Review licenses and manage drivers" />
      {error && <div className="bb-alert bb-alert-error" style={{ marginBottom: '1rem' }} role="alert">{error}</div>}
      {notice && <div className="bb-alert bb-alert-ok" style={{ marginBottom: '1rem' }}>{notice}</div>}
      <div className="bb-tabs" role="tablist" style={{ marginBottom: '1rem' }}>
        {TABS.map((t) => <button key={t} className="bb-tab" role="tab" aria-selected={tab === t} onClick={() => setTab(t)} style={{ textTransform: 'capitalize' }}>{t}</button>)}
      </div>
      {rows === null ? <div className="bb-skeleton" /> : rows.length === 0 ? (
        <div className="bb-card bb-empty"><span className="bb-emoji">🚌</span>No {tab === 'all' ? '' : tab} drivers.</div>
      ) : (
        <div className="bb-table-wrap">
          <table className="bb-table">
            <thead><tr><th>Driver</th><th>Phone</th><th>Vehicle</th><th>Status</th><th>Joined</th><th>License</th><th>Actions</th></tr></thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.id}>
                  <td><div className="bb-row" style={{ gap: 10, flexWrap: 'nowrap' }}><Avatar name={d.name} size={38} /><div><b>{d.name}</b><div className="bb-small bb-muted">{d.email}</div></div></div></td>
                  <td>{d.phone ?? '—'}</td>
                  <td>{d.vehicle_plate ? `${d.vehicle_plate}${d.seats ? ` · ${d.seats} seats` : ''}` : '—'}</td>
                  <td><StatusChip status={d.status} /></td>
                  <td className="bb-small bb-muted">{fmtDate(d.created_at)}</td>
                  <td><button className="bb-btn bb-btn-sm bb-btn-ghost" onClick={() => openLicense(d.license_url)}><Icon name="eye" size={14} /> View</button></td>
                  <td>
                    <div className="bb-row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                      {d.status !== 'verified' && <button className="bb-btn bb-btn-sm bb-btn-green" onClick={() => review(d.id, 'verify')}><Icon name="check" size={14} /> Verify</button>}
                      {d.status !== 'rejected' && <button className="bb-btn bb-btn-sm bb-btn-danger" onClick={() => review(d.id, 'reject')}><Icon name="x" size={14} /> Reject</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default function AdminDriversPage() {
  return <AdminShell><DriversContent /></AdminShell>;
}
