'use client';
import { useCallback, useEffect, useState } from 'react';
import AdminShell from '@/components/AdminShell';
import { useMe } from '@/components/AppShell';
import PageHead from '@/components/ui/PageHead';
import StatusChip from '@/components/ui/StatusChip';
import Icon from '@/components/ui/Icon';
import { api, errorOf } from '@/lib/client-api';
import { fmtDateTime, timeAgo } from '@/lib/format';

const CAT: Record<string, { label: string; emoji: string }> = {
  breakdown: { label: 'Breakdown', emoji: '🔧' }, accident: { label: 'Accident', emoji: '🚨' },
  delay: { label: 'Delay', emoji: '⏱️' }, other: { label: 'Other', emoji: '⚠️' },
};

function IssuesContent() {
  const { token } = useMe();
  const [status, setStatus] = useState<'open' | 'resolved' | 'all'>('open');
  const [rows, setRows] = useState<any[] | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    const r = await api(token, `/admin/issues?status=${status}`);
    if (r.ok) { setRows(r.data.issues); setError(''); } else setError(errorOf(r));
  }, [token, status]);
  useEffect(() => {
    setRows(null);
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [load]);

  async function resolve(id: number) {
    const r = await api(token, `/admin/issues/${id}`, { method: 'PATCH', body: { status: 'resolved' } });
    if (!r.ok) return setError(errorOf(r));
    setNotice('Issue resolved.');
    load();
  }

  return (
    <>
      <PageHead icon="alert" highlight="Issues" title="Vehicle" subtitle="Problems reported by drivers" />
      {error && <div className="bb-alert bb-alert-error" style={{ marginBottom: '1rem' }} role="alert">{error}</div>}
      {notice && <div className="bb-alert bb-alert-ok" style={{ marginBottom: '1rem' }}>{notice}</div>}
      <div className="bb-tabs" role="tablist" style={{ marginBottom: '1rem' }}>
        {(['open', 'resolved', 'all'] as const).map((s) => <button key={s} className="bb-tab" role="tab" aria-selected={status === s} onClick={() => setStatus(s)} style={{ textTransform: 'capitalize' }}>{s}</button>)}
      </div>
      {rows === null ? <div className="bb-skeleton" /> : rows.length === 0 ? (
        <div className="bb-card bb-empty"><span className="bb-emoji">✅</span>No {status === 'all' ? '' : status} issues.</div>
      ) : (
        <div className="bb-stack">
          {rows.map((i) => {
            const c = CAT[i.category] ?? CAT.other;
            return (
              <article key={i.id} className="bb-card">
                <div className="bb-row bb-between">
                  <b style={{ fontSize: '1.1rem' }}>{c.emoji} {c.label}</b>
                  <StatusChip status={i.status} />
                </div>
                <div className="bb-muted bb-small" style={{ marginTop: 4 }}>
                  {i.driver_name}{i.vehicle_plate ? ` · Bus ${i.vehicle_plate}` : ''}
                  {i.driver_phone && <> · <a href={`tel:${i.driver_phone}`} style={{ color: 'var(--bb-cyan)' }}>{i.driver_phone}</a></>}
                </div>
                {i.message && <p style={{ margin: '0.5rem 0 0' }}>{i.message}</p>}
                <div className="bb-row bb-between" style={{ marginTop: 10 }}>
                  <span className="bb-small bb-muted">{fmtDateTime(i.created_at)} · {timeAgo(i.created_at)}</span>
                  <div className="bb-row" style={{ gap: 8 }}>
                    {i.latitude && i.longitude && (
                      <a className="bb-btn bb-btn-sm bb-btn-ghost" target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/?mlat=${i.latitude}&mlon=${i.longitude}#map=16/${i.latitude}/${i.longitude}`}>
                        <Icon name="pin" size={14} /> Location
                      </a>
                    )}
                    {i.status === 'open' && <button className="bb-btn bb-btn-sm bb-btn-green" onClick={() => resolve(i.id)}><Icon name="check" size={14} /> Mark resolved</button>}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}

export default function AdminIssuesPage() {
  return <AdminShell><IssuesContent /></AdminShell>;
}
