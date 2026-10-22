'use client';
import Link from 'next/link';
import ParentShell from '@/components/ParentShell';
import { useMe } from '@/components/AppShell';
import { useLiveChildren, CHILD_STATUS_LABEL } from '@/components/useLiveChildren';
import Avatar from '@/components/ui/Avatar';
import StatusChip from '@/components/ui/StatusChip';
import Icon from '@/components/ui/Icon';
import { firstName, fmtTime } from '@/lib/format';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good Morning' : h < 18 ? 'Good Afternoon' : 'Good Evening';
}

function HomeContent() {
  const { me, token } = useMe();
  const { children, error, reload } = useLiveChildren(token);
  const onBus = (children ?? []).filter((c) => c.status === 'on_board');

  return (
    <>
      <div className="bb-page-head" style={{ marginTop: 4 }}>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0 }}>{greeting()},</p>
          <h1>{firstName(me?.name)} 👋</h1>
          <p>Your children are safe with us.</p>
        </div>
      </div>

      {error && (
        <div className="bb-alert bb-alert-error" style={{ marginBottom: '1rem' }} role="alert">
          {error} <button className="bb-btn bb-btn-sm" style={{ marginLeft: 8 }} onClick={reload}>Retry</button>
        </div>
      )}

      <section
        className="bb-card bb-row bb-between"
        style={{ marginBottom: '1.2rem', background: onBus.length ? 'linear-gradient(135deg, rgba(0,229,255,0.55), rgba(122,44,255,0.55), rgba(255,43,214,0.45))' : undefined, borderColor: 'rgba(0,229,255,0.6)' }}
      >
        <div className="bb-row" style={{ gap: '1rem' }}>
          <Icon name="shield" size={42} />
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{onBus.length ? 'Tracking Active' : 'No child is travelling'}</h2>
            <div className="bb-muted">
              {onBus.length
                ? `${onBus.length} ${onBus.length === 1 ? 'child' : 'children'} on the bus`
                : 'You will see live tracking here as soon as a ride starts.'}
            </div>
          </div>
        </div>
        <Link href="/parent/map" className="bb-btn bb-btn-ghost" style={{ background: 'rgba(5,11,70,0.5)' }}>
          <Icon name="pin" size={17} /> View Live Map
        </Link>
      </section>

      <h2 style={{ fontSize: '1.3rem', margin: '0 0 0.6rem' }}>My Children</h2>
      {children === null ? (
        <div className="bb-skeleton" />
      ) : children.length === 0 ? (
        <div className="bb-card bb-empty">
          <span className="bb-emoji">🔗</span>
          No child is linked yet. Ask your child to create a link code in their BusBuddy profile.
          <div style={{ marginTop: 12 }}><Link href="/parent/link" className="bb-btn"><Icon name="link" size={17} /> Link a student</Link></div>
        </div>
      ) : (
        <div className="bb-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))' }}>
          {children.map((c) => (
            <Link key={c.id} href={`/parent/map?child=${c.id}`} className="bb-card" style={{ textDecoration: 'none', color: '#fff' }}>
              <div className="bb-row bb-between" style={{ flexWrap: 'nowrap' }}>
                <div className="bb-row" style={{ gap: 12, flexWrap: 'nowrap' }}>
                  <Avatar name={c.name} size={54} />
                  <div>
                    <b style={{ fontSize: '1.05rem' }}>{c.name}</b>
                    <div className="bb-small bb-muted">{c.university ?? 'Student'}</div>
                  </div>
                </div>
                <StatusChip status={c.status} />
              </div>
              <div className="bb-small bb-muted" style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="pin" size={15} />
                {c.status === 'idle' || !c.trip
                  ? CHILD_STATUS_LABEL.idle
                  : c.status === 'arrived'
                  ? `Arrived at ${fmtTime(c.trip.exited_at ?? c.trip.end_time)}`
                  : `${c.trip.origin ?? 'Trip'} → ${c.trip.destination ?? ''}`}
              </div>
            </Link>
          ))}
        </div>
      )}

      <h2 style={{ fontSize: '1.3rem', margin: '1.6rem 0 0.6rem' }}>Quick Actions</h2>
      <div className="bb-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <Link href="/parent/link" className="bb-card bb-row" style={{ textDecoration: 'none', color: '#fff', gap: 12 }}><Icon name="link" size={26} /><b>Link Student</b></Link>
        <Link href="/parent/map" className="bb-card bb-row" style={{ textDecoration: 'none', color: '#fff', gap: 12 }}><Icon name="pin" size={26} /><b>View Map</b></Link>
        <Link href="/parent/children" className="bb-card bb-row" style={{ textDecoration: 'none', color: '#fff', gap: 12 }}><Icon name="users" size={26} /><b>Children</b></Link>
      </div>
    </>
  );
}

export default function ParentHomePage() {
  return <ParentShell><HomeContent /></ParentShell>;
}
