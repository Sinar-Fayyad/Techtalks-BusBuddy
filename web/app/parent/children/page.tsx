'use client';
import { useState } from 'react';
import Link from 'next/link';
import ParentShell from '@/components/ParentShell';
import { useMe } from '@/components/AppShell';
import { useLiveChildren, LiveChild } from '@/components/useLiveChildren';
import PageHead from '@/components/ui/PageHead';
import StatCard from '@/components/ui/StatCard';
import StatusChip from '@/components/ui/StatusChip';
import Avatar from '@/components/ui/Avatar';
import Icon from '@/components/ui/Icon';
import { api, errorOf } from '@/lib/client-api';
import { fmtDay, fmtTime } from '@/lib/format';

function ChildrenContent() {
  const { token } = useMe();
  const { children, error, reload } = useLiveChildren(token);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [selected, setSelected] = useState<number | null>(null);
  const [err2, setErr2] = useState('');
  const [notice, setNotice] = useState('');

  const all = children ?? [];
  const shown = all.filter((c) => (status === 'all' || c.status === status) && (!q.trim() || `${c.name} ${c.university ?? ''}`.toLowerCase().includes(q.trim().toLowerCase())));
  const sel: LiveChild | undefined = all.find((c) => c.id === selected) ?? all[0];

  async function unlink(c: LiveChild) {
    if (!window.confirm(`Unlink ${c.name}? You will stop seeing their rides.`)) return;
    const r = await api(token, `/parents/me/children/${c.id}`, { method: 'DELETE' });
    if (!r.ok) return setErr2(errorOf(r));
    setNotice(`${c.name} was unlinked.`);
    setSelected(null);
    reload();
  }

  return (
    <>
      <PageHead
        icon="users" highlight="Children" subtitle="Manage your children and track their rides"
        action={<Link href="/parent/link" className="bb-btn"><Icon name="plus" size={18} /> Add Child</Link>}
      />
      {(error || err2) && <div className="bb-alert bb-alert-error" style={{ marginBottom: '1rem' }} role="alert">{error || err2}</div>}
      {notice && <div className="bb-alert bb-alert-ok" style={{ marginBottom: '1rem' }}>{notice}</div>}

      <div className="bb-stats">
        <StatCard icon="users" value={all.length} label="Total children" />
        <StatCard icon="bus" value={all.filter((c) => c.status === 'on_board').length} label="On the bus" tone="green" onClick={() => setStatus('on_board')} />
        <StatCard icon="clock" value={all.filter((c) => c.status === 'waiting').length} label="Waiting for the bus" tone="amber" onClick={() => setStatus('waiting')} />
        <StatCard icon="check" value={all.filter((c) => c.status === 'idle' || c.status === 'arrived').length} label="Not travelling" tone="violet" onClick={() => setStatus('all')} />
      </div>

      {children === null ? <div className="bb-skeleton" /> : all.length === 0 ? (
        <div className="bb-card bb-empty"><span className="bb-emoji">🔗</span>No child is linked yet. <Link href="/parent/link" style={{ color: 'var(--bb-cyan)', fontWeight: 700 }}>Link a student</Link>.</div>
      ) : (
        <div className="bb-grid" style={{ gridTemplateColumns: 'minmax(0, 2fr) minmax(260px, 1fr)', alignItems: 'start' }}>
          <div>
            <div className="bb-row" style={{ marginBottom: '1rem' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--bb-cyan)', display: 'flex' }}><Icon name="search" size={19} /></span>
                <input className="bb-input" style={{ borderRadius: 999, paddingLeft: 44 }} placeholder="Search by name or university…" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
              <select className="bb-select" style={{ width: 'auto', borderRadius: 999 }} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
                <option value="all">All statuses</option>
                <option value="on_board">On the bus</option>
                <option value="waiting">Waiting for the bus</option>
                <option value="arrived">Arrived</option>
                <option value="idle">Not travelling</option>
              </select>
            </div>
            {shown.length === 0 ? <div className="bb-card bb-empty">No children match your filters.</div> : (
              <div className="bb-table-wrap">
                <table className="bb-table">
                  <thead><tr><th>Child</th><th>University</th><th>Status</th><th>Trip</th><th>Actions</th></tr></thead>
                  <tbody>
                    {shown.map((c) => (
                      <tr key={c.id} className={sel?.id === c.id ? 'bb-selected' : ''} style={{ cursor: 'pointer' }} onClick={() => setSelected(c.id)}>
                        <td><div className="bb-row" style={{ gap: 10, flexWrap: 'nowrap' }}><Avatar name={c.name} size={38} /><b>{c.name}</b></div></td>
                        <td>{c.university ?? '—'}</td>
                        <td><StatusChip status={c.status} /></td>
                        <td className="bb-small">{c.trip?.origin ? `${c.trip.origin} → ${c.trip.destination}` : '—'}</td>
                        <td>
                          <div className="bb-row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                            <Link href={`/parent/map?child=${c.id}`} className="bb-btn bb-btn-sm bb-btn-ghost" onClick={(e) => e.stopPropagation()}><Icon name="pin" size={14} /></Link>
                            <button className="bb-btn bb-btn-sm bb-btn-danger" onClick={(e) => { e.stopPropagation(); unlink(c); }} aria-label={`Unlink ${c.name}`}><Icon name="trash" size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {sel && (
            <aside className="bb-card bb-card-glow">
              <div style={{ textAlign: 'center' }}>
                <Avatar name={sel.name} size={84} />
                <h2 style={{ margin: '0.6rem 0 0.2rem' }}>{sel.name}</h2>
                <div className="bb-muted bb-small">{sel.university ?? 'Student'}</div>
                <div style={{ margin: '0.6rem 0' }}><StatusChip status={sel.status} /></div>
              </div>
              <div className="bb-kv"><span>Route</span><span>{sel.trip?.origin ? `${sel.trip.origin} → ${sel.trip.destination}` : '—'}</span></div>
              <div className="bb-kv"><span>Driver</span><span>{sel.trip?.driver_name ?? '—'}</span></div>
              <div className="bb-kv"><span>Bus</span><span>{sel.trip?.vehicle_plate ?? '—'}</span></div>
              <div className="bb-kv"><span>Boarded</span><span>{sel.trip?.boarded_at ? `${fmtDay(sel.trip.boarded_at)} ${fmtTime(sel.trip.boarded_at)}` : '—'}</span></div>
              <Link href={`/parent/map?child=${sel.id}`} className="bb-btn bb-btn-block" style={{ marginTop: 12 }}><Icon name="pin" size={17} /> View on Map</Link>
            </aside>
          )}
        </div>
      )}
    </>
  );
}

export default function ParentChildrenPage() {
  return <ParentShell><ChildrenContent /></ParentShell>;
}
