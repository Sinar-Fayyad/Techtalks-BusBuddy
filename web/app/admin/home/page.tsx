'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminShell from '@/components/AdminShell';
import { useMe } from '@/components/AppShell';
import PageHead from '@/components/ui/PageHead';
import StatCard from '@/components/ui/StatCard';
import StatusChip from '@/components/ui/StatusChip';
import Icon from '@/components/ui/Icon';
import { api, errorOf } from '@/lib/client-api';
import { fmtDateTime, timeAgo } from '@/lib/format';

const CAT: Record<string, string> = { breakdown: 'Breakdown', accident: 'Accident', delay: 'Delay', other: 'Issue' };

function HomeContent() {
  const { token } = useMe();
  const router = useRouter();
  const [stats, setStats] = useState<any | null>(null);
  const [pending, setPending] = useState<any[] | null>(null);
  const [issues, setIssues] = useState<any[] | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    const [s, p, i] = await Promise.all([api(token, '/admin/stats'), api(token, '/admin/drivers?status=pending'), api(token, '/admin/issues?status=open')]);
    if (s.ok) setStats(s.data); else setError(errorOf(s));
    if (p.ok) setPending(p.data.drivers);
    if (i.ok) setIssues(i.data.issues);
  }, [token]);
  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [load]);

  async function review(id: number, action: 'verify' | 'reject') {
    const r = await api(token, `/admin/drivers/${id}`, { method: 'PATCH', body: { action } });
    if (!r.ok) return setError(errorOf(r));
    setNotice(action === 'verify' ? 'Driver verified.' : 'Driver rejected.');
    load();
  }
  async function resolve(id: number) {
    const r = await api(token, `/admin/issues/${id}`, { method: 'PATCH', body: { status: 'resolved' } });
    if (!r.ok) return setError(errorOf(r));
    setNotice('Issue resolved.');
    load();
  }

  return (
    <>
      <PageHead icon="home" highlight="Dashboard" title="Admin" subtitle="What is happening on BusBuddy right now" />
      {error && <div className="bb-alert bb-alert-error" style={{ marginBottom: '1rem' }} role="alert">{error}</div>}
      {notice && <div className="bb-alert bb-alert-ok" style={{ marginBottom: '1rem' }}>{notice}</div>}

      <div className="bb-stats">
        <StatCard icon="clock" value={stats?.drivers.pending ?? '…'} label="Drivers to review" tone="amber" onClick={() => router.push('/admin/drivers')} />
        <StatCard icon="bus" value={stats?.drivers.verified ?? '…'} label="Verified drivers" tone="green" onClick={() => router.push('/admin/drivers?status=verified')} />
        <StatCard icon="user" value={stats?.users.students ?? '…'} label="Students" onClick={() => router.push('/admin/users')} />
        <StatCard icon="users" value={stats?.users.parents ?? '…'} label="Parents" tone="violet" onClick={() => router.push('/admin/users?role=parent')} />
        <StatCard icon="route" value={stats?.trips.running ?? '…'} label="Trips running now" tone="green" onClick={() => router.push('/admin/trips?status=in_progress')} />
        <StatCard icon="alert" value={stats?.open_issues ?? '…'} label="Open issues" tone="pink" onClick={() => router.push('/admin/issues')} />
      </div>

      <div className="bb-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', alignItems: 'start' }}>
        <section className="bb-card">
          <div className="bb-row bb-between">
            <h2 className="bb-card-title"><Icon name="clock" /> Drivers waiting for review</h2>
            <Link href="/admin/drivers" style={{ color: 'var(--bb-cyan)', fontWeight: 700 }}>See all</Link>
          </div>
          {pending === null ? <div className="bb-skeleton" /> : pending.length === 0 ? (
            <p className="bb-muted bb-small" style={{ margin: 0 }}>Nobody is waiting. 🎉</p>
          ) : (
            <div className="bb-stack">
              {pending.slice(0, 5).map((d) => (
                <div key={d.id} className="bb-row bb-between">
                  <div><b>{d.name}</b><div className="bb-small bb-muted">{d.email}</div></div>
                  <div className="bb-row" style={{ gap: 6 }}>
                    <button className="bb-btn bb-btn-sm bb-btn-green" onClick={() => review(d.id, 'verify')}><Icon name="check" size={14} /> Verify</button>
                    <button className="bb-btn bb-btn-sm bb-btn-danger" onClick={() => review(d.id, 'reject')}><Icon name="x" size={14} /> Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bb-card">
          <div className="bb-row bb-between">
            <h2 className="bb-card-title"><Icon name="alert" /> Open vehicle issues</h2>
            <Link href="/admin/issues" style={{ color: 'var(--bb-cyan)', fontWeight: 700 }}>See all</Link>
          </div>
          {issues === null ? <div className="bb-skeleton" /> : issues.length === 0 ? (
            <p className="bb-muted bb-small" style={{ margin: 0 }}>No open issues.</p>
          ) : (
            <div className="bb-stack">
              {issues.slice(0, 5).map((i) => (
                <div key={i.id} className="bb-alert bb-alert-error">
                  <div className="bb-row bb-between">
                    <b>{CAT[i.category]} · {i.driver_name}{i.vehicle_plate ? ` (${i.vehicle_plate})` : ''}</b>
                    <button className="bb-btn bb-btn-sm bb-btn-ghost" onClick={() => resolve(i.id)}>Resolve</button>
                  </div>
                  {i.message && <div className="bb-small">{i.message}</div>}
                  <div className="bb-small" style={{ opacity: 0.8 }}>{timeAgo(i.created_at)}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {stats && (
        <p className="bb-small bb-muted" style={{ marginTop: '1rem' }}>
          {stats.trips.upcoming} upcoming · {stats.trips.completed} completed · {stats.trips.cancelled} cancelled trips · {stats.bookings} bookings in total.
        </p>
      )}
    </>
  );
}

export default function AdminHomePage() {
  return <AdminShell><HomeContent /></AdminShell>;
}
