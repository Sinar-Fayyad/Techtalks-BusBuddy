'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import DriverShell from '@/components/DriverShell';
import { useMe } from '@/components/AppShell';
import DriverGps from '@/components/DriverGps';
import QrBox from '@/components/QrBox';
import LocationGate from '@/components/LocationGate';
import ReportIssueModal from '@/components/ReportIssueModal';
import TripFormModal from '@/components/TripFormModal';
import StatusChip from '@/components/ui/StatusChip';
import Icon from '@/components/ui/Icon';
import { api, errorOf } from '@/lib/client-api';
import { firstName, fmtDay, fmtTime, parseUtc } from '@/lib/format';

function startOfToday() { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); }

function HomeContent() {
  const { me, token } = useMe();
  const [profile, setProfile] = useState<any | null>(null);
  const [trips, setTrips] = useState<any[] | null>(null);
  const [active, setActive] = useState<any | null>(null); // running trip (entry 17)
  const [bookings, setBookings] = useState<any[]>([]);
  const [qr, setQr] = useState<{ board_code: string; exit_code: string } | null>(null);
  const [qrTab, setQrTab] = useState<'board' | 'exit'>('board');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [gate, setGate] = useState<number | null>(null); // trip id waiting for location permission
  const [reporting, setReporting] = useState(false);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    const [p, t, a] = await Promise.all([
      api(token, '/driver/me'),
      api(token, '/driver/scheduled-trips'),
      api(token, '/driver/trips/active'),
    ]);
    if (p.ok) setProfile(p.data.driver); else if (p.status !== 404) setError(errorOf(p));
    if (t.ok) setTrips(t.data.trips);
    const run = a.ok ? a.data.trip : null;
    setActive(run);

    const list: any[] = t.ok ? t.data.trips : [];
    const focus = run?.scheduled_trip_id ?? nextTrip(list)?.id ?? null;
    if (focus) {
      const b = await api(token, `/driver/bookings?tripId=${focus}`);
      if (b.ok) setBookings(b.data.bookings);
    } else setBookings([]);

    if (run) {
      const q = await api(token, '/driver/qr');
      if (q.ok) setQr(q.data);
    } else setQr(null);
    if (!p.ok && !t.ok && !a.ok) setError(errorOf(p));
  }, [token]);

  useEffect(() => {
    load();
    const id = setInterval(load, active ? 10_000 : 30_000);
    return () => clearInterval(id);
  }, [load, !!active]); // eslint-disable-line react-hooks/exhaustive-deps

  // the trip to start next: nearest "upcoming" one that is not more than 2 h overdue
  function nextTrip(list: any[]) {
    return list
      .filter((t) => t.status === 'upcoming' && (parseUtc(t.scheduled_at)?.getTime() ?? 0) > Date.now() - 2 * 3600e3)
      .sort((a, b) => (parseUtc(a.scheduled_at)?.getTime() ?? 0) - (parseUtc(b.scheduled_at)?.getTime() ?? 0))[0];
  }
  const next = trips ? nextTrip(trips) : null;
  const verified = profile?.status === 'verified';

  async function doStart(tripId: number) {
    setBusy(true);
    setError('');
    const r = await api(token, '/driver/trips/start', { method: 'POST', body: { scheduledTripId: tripId } });
    setBusy(false);
    if (!r.ok) {
      console.error('start trip failed:', r.status, r.data);
      setError(r.status === 409 ? `${errorOf(r)}. Refreshing…` : errorOf(r));
      load();
      return;
    }
    setNotice('Trip started. Students are notified.');
    load();
  }

  // ask for location permission first (only if the browser does not already allow it)
  async function startTrip(tripId: number) {
    try {
      const perm = await (navigator as any).permissions?.query({ name: 'geolocation' });
      if (perm?.state === 'granted') return doStart(tripId);
    } catch { /* older browsers: fall through to the gate */ }
    setGate(tripId);
  }

  async function stopTrip() {
    if (!window.confirm('Stop this trip? Location sharing will end for everyone.')) return;
    setBusy(true);
    const r = await api(token, '/driver/trips/stop', { method: 'POST' });
    setBusy(false);
    if (!r.ok) setError(errorOf(r)); else setNotice('Trip stopped.');
    load();
  }

  const today = (trips ?? []).filter((t) => {
    const ms = parseUtc(t.scheduled_at)?.getTime() ?? 0;
    return ms >= startOfToday() && ms < startOfToday() + 86400e3;
  });
  const sum = {
    completed: today.filter((t) => t.status === 'completed').length,
    upcoming: today.filter((t) => t.status === 'upcoming' || t.status === 'in_progress').length,
    cancelled: today.filter((t) => t.status === 'cancelled').length,
  };

  const boarded = bookings.filter((b) => b.status === 'on_board').length;
  const alerts = active ? bookings.filter((b) => b.status === 'waiting') : [];

  return (
    <>
      <div className="bb-page-head" style={{ marginTop: 4 }}>
        <span className="bb-page-icon"><Icon name="home" size={26} /></span>
        <div style={{ flex: 1 }}>
          <h1>Home</h1>
          <p>Welcome back, <span style={{ color: 'var(--bb-cyan)' }}>{firstName(me?.name)}</span></p>
        </div>
        {verified && !active && <button className="bb-btn" onClick={() => setAdding(true)}><Icon name="plus" size={18} /> Add trip</button>}
      </div>

      {error && <div className="bb-alert bb-alert-error" style={{ marginBottom: '1rem' }} role="alert">{error}</div>}
      {notice && <div className="bb-alert bb-alert-ok" style={{ marginBottom: '1rem' }}>{notice}</div>}

      {profile && profile.status === 'pending' && (
        <div className="bb-alert bb-alert-info" style={{ marginBottom: '1rem' }}>
          Your license is being reviewed by an admin. You can add trips and appear to students once you are verified.
        </div>
      )}
      {profile && profile.status === 'rejected' && (
        <div className="bb-alert bb-alert-error" style={{ marginBottom: '1rem' }}>
          Your license was rejected. <Link href="/driver/profile?tab=license" style={{ color: '#fff', fontWeight: 700 }}>Upload a new license</Link>.
        </div>
      )}
      {verified && profile && !profile.profile_complete && (
        <div className="bb-alert bb-alert-info" style={{ marginBottom: '1rem' }}>
          Complete your profile: add your {profile.missing_fields.map((f: string) => f.replace('_', ' ')).join(', ')}.{' '}
          <Link href="/driver/profile?tab=vehicle" style={{ color: 'var(--bb-cyan)', fontWeight: 700 }}>Go to Vehicle &amp; Route</Link>
        </div>
      )}

      {/* ---------- running trip ---------- */}
      {active ? (
        <section className="bb-card bb-card-glow" style={{ marginBottom: '1rem' }}>
          <div className="bb-row bb-between">
            <h2 className="bb-card-title"><Icon name="bus" /> Trip in progress</h2>
            <StatusChip status="in_progress" />
          </div>
          <div className="bb-row bb-between" style={{ marginBottom: 12 }}>
            <div>
              <b style={{ fontSize: '1.2rem' }}>{active.origin ? `${active.origin} → ${active.destination}` : 'Ad-hoc trip'}</b>
              <div className="bb-muted bb-small">Started {fmtTime(active.start_time)} · {boarded} of {bookings.length} students on board</div>
            </div>
            <div className="bb-row">
              <button className="bb-btn bb-btn-sm bb-btn-ghost" onClick={() => setReporting(true)}><Icon name="alert" size={16} /> Report issue</button>
              <button className="bb-btn bb-btn-danger" onClick={stopTrip} disabled={busy}><Icon name="x" size={17} /> Stop Trip</button>
            </div>
          </div>
          <DriverGps token={token} tripActive />
          {qr && (
            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
              <div className="bb-tabs" style={{ justifyContent: 'center', marginBottom: 12 }}>
                <button className="bb-tab" aria-selected={qrTab === 'board'} onClick={() => setQrTab('board')}>Boarding code</button>
                <button className="bb-tab" aria-selected={qrTab === 'exit'} onClick={() => setQrTab('exit')}>Exit code</button>
              </div>
              <QrBox value={qrTab === 'board' ? qr.board_code : qr.exit_code} />
              <p className="bb-muted bb-small" style={{ margin: '0.7rem 0 0' }}>
                {qrTab === 'board' ? 'Students scan this with the BusBuddy mobile app when they get on.' : 'Students scan this with the mobile app when they get off.'}
              </p>
            </div>
          )}
        </section>
      ) : (
        <section className="bb-card bb-card-glow" style={{ marginBottom: '1rem' }}>
          <div className="bb-row bb-between">
            <h2 className="bb-card-title"><Icon name="route" /> Next trip</h2>
            {next && <span className="bb-chip bb-chip-cyan"><Icon name="clock" size={13} /> {fmtDay(next.scheduled_at)}</span>}
          </div>
          {trips === null ? <div className="bb-skeleton" /> : !next ? (
            <div className="bb-empty">
              <span className="bb-emoji">🗓️</span>
              {verified ? 'No upcoming trip. Add one so students can book it.' : 'Once you are verified you can add trips here.'}
              {verified && <div style={{ marginTop: 10 }}><button className="bb-btn" onClick={() => setAdding(true)}><Icon name="plus" size={18} /> Add trip</button></div>}
            </div>
          ) : (
            <div className="bb-row bb-between">
              <div className="bb-row" style={{ gap: '1.6rem' }}>
                <div>
                  <div style={{ fontSize: '2rem', fontWeight: 800 }}>{fmtTime(next.scheduled_at)}</div>
                  <div className="bb-muted bb-small">{fmtDay(next.scheduled_at)}</div>
                </div>
                <div>
                  <b style={{ fontSize: '1.15rem' }}>{next.origin} → {next.destination}</b>
                  <div className="bb-muted bb-small"><Icon name="users" size={14} /> {next.booked_count} booked · {next.seats} seats</div>
                </div>
              </div>
              <button className="bb-btn" onClick={() => startTrip(next.id)} disabled={busy || !verified}>
                <Icon name="chevron" size={18} /> Start Trip
              </button>
            </div>
          )}
        </section>
      )}

      <div className="bb-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', alignItems: 'start' }}>
        <section className="bb-card">
          <h2 className="bb-card-title"><Icon name="calendar" /> Today’s summary</h2>
          <div className="bb-row bb-between" style={{ textAlign: 'center' }}>
            <div><div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--bb-green)' }}>{sum.completed}</div><div className="bb-small bb-muted">Completed</div></div>
            <div><div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--bb-cyan)' }}>{sum.upcoming}</div><div className="bb-small bb-muted">Upcoming</div></div>
            <div><div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--bb-pink)' }}>{sum.cancelled}</div><div className="bb-small bb-muted">Cancelled</div></div>
          </div>
        </section>

        <section className="bb-card">
          <h2 className="bb-card-title"><Icon name="bell" /> Alerts</h2>
          {alerts.length === 0 ? (
            <p className="bb-muted bb-small" style={{ margin: 0 }}>No alerts. {active ? 'Every booked student has boarded.' : 'Alerts appear while a trip is running.'}</p>
          ) : (
            <div className="bb-stack">
              {alerts.map((b) => (
                <div key={b.id} className="bb-alert bb-alert-error">
                  <b>{b.student_name} hasn’t boarded</b>
                  <div className="bb-small">Pickup: {b.pickup || '—'}{b.student_phone && <> · <a href={`tel:${b.student_phone}`} style={{ color: '#fff' }}>{b.student_phone}</a></>}</div>
                </div>
              ))}
            </div>
          )}
          {!active && verified && (
            <button className="bb-btn bb-btn-sm bb-btn-ghost" style={{ marginTop: 10 }} onClick={() => setReporting(true)}><Icon name="alert" size={15} /> Report vehicle issue</button>
          )}
        </section>
      </div>

      {gate !== null && <LocationGate onClose={() => setGate(null)} onGranted={() => { const id = gate; setGate(null); doStart(id); }} />}
      {reporting && <ReportIssueModal token={token} onClose={() => setReporting(false)} />}
      {adding && <TripFormModal token={token} defaults={{ seats: profile?.seats, price: profile?.price }} onClose={() => setAdding(false)} onSaved={(m) => { setNotice(m); load(); }} />}
    </>
  );
}

export default function DriverHomePage() {
  return <DriverShell><HomeContent /></DriverShell>;
}
