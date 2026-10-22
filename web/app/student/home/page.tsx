'use client';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StudentShell from '@/components/StudentShell';
import { useMe } from '@/components/AppShell';
import TripCard, { AvailableTrip } from '@/components/TripCard';
import BookModal from '@/components/BookModal';
import LiveBusMap from '@/components/LiveBusMap';
import StatusChip from '@/components/ui/StatusChip';
import Icon from '@/components/ui/Icon';
import { api, errorOf } from '@/lib/client-api';
import { firstName, fmtDay, fmtTime, parseUtc } from '@/lib/format';

const RECENT_MS = 3 * 60 * 60 * 1000;

function HomeContent() {
  const { me, token } = useMe();
  const router = useRouter();
  const [bookings, setBookings] = useState<any[] | null>(null);
  const [available, setAvailable] = useState<AvailableTrip[] | null>(null);
  const [status, setStatus] = useState<any | null>(null); // trip-status "trip" (entry 14)
  const [error, setError] = useState('');
  const [bookTrip, setBookTrip] = useState<AvailableTrip | null>(null);
  const [q, setQ] = useState('');

  const load = useCallback(async () => {
    if (!me) return;
    const [b, a, s] = await Promise.all([
      api(token, '/bookings/me'),
      api(token, '/scheduled-trips?sort=time'),
      api(token, `/students/${me.id}/trip-status`),
    ]);
    if (b.ok) setBookings(b.data.bookings);
    if (a.ok) setAvailable(a.data.trips);
    if (s.ok) setStatus(s.data.trip);
    if (!b.ok && !a.ok && !s.ok) setError(errorOf(b));
    else setError('');
  }, [me, token]);

  const live = !!status && (status.phase === 'waiting' || status.phase === 'onboard');

  // polling: every 10 s while a trip is live, 30 s otherwise (a new trip is detected without refreshing)
  useEffect(() => {
    load();
    const id = setInterval(load, live ? 10_000 : 30_000);
    return () => clearInterval(id);
  }, [load, live]);

  const upcoming = (bookings ?? [])
    .filter((b) => b.trip_status === 'upcoming' || b.trip_status === 'in_progress')
    .sort((a, b) => (parseUtc(a.scheduled_at)?.getTime() ?? 0) - (parseUtc(b.scheduled_at)?.getTime() ?? 0));
  const next = (live && upcoming.find((b) => b.scheduled_trip_id === status.scheduled_trip_id)) || upcoming[0] || null;

  const endedAt = status?.exited_at ?? status?.end_time ?? null;
  const justDone =
    status?.phase === 'done' && endedAt && Date.now() - (parseUtc(endedAt)?.getTime() ?? 0) < RECENT_MS;

  const bookable = (available ?? []).filter((t) => !t.booked).slice(0, 3);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    router.push(`/student/bookings${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`);
  }

  return (
    <>
      <div className="bb-page-head" style={{ marginTop: 4 }}>
        <div style={{ flex: 1 }}>
          <h1>Hi, <em>{firstName(me?.name)}</em></h1>
          <p>Ready for your next ride?</p>
        </div>
      </div>

      <form onSubmit={onSearch} style={{ marginBottom: '1rem', position: 'relative' }}>
        <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--bb-cyan)', display: 'flex' }}>
          <Icon name="search" size={20} />
        </span>
        <input className="bb-input" style={{ borderRadius: 999, paddingLeft: 46 }} placeholder="Search drivers, routes or stops…" value={q} onChange={(e) => setQ(e.target.value)} />
      </form>

      {error && (
        <div className="bb-alert bb-alert-error" style={{ marginBottom: '1rem' }} role="alert">
          {error} <button className="bb-btn bb-btn-sm" style={{ marginLeft: 8 }} onClick={load}>Retry</button>
        </div>
      )}

      <div className="bb-home-grid">
        <div className="bb-stack">
        {/* ---- next ride + live ---- */}
        <section className="bb-card bb-card-glow">
          <div className="bb-row bb-between">
            <h2 className="bb-card-title"><Icon name="bus" /> {live ? 'Your trip is live' : 'Your next ride'}</h2>
            {next && <StatusChip status={next.trip_status} />}
          </div>

          {bookings === null ? (
            <div className="bb-skeleton" />
          ) : !next ? (
            <div className="bb-empty">
              <span className="bb-emoji">🚌</span>
              No upcoming ride. <Link href="/student/bookings" style={{ color: 'var(--bb-cyan)', fontWeight: 700 }}>Find a trip</Link> and book it.
            </div>
          ) : (
            <>
              <div className="bb-row" style={{ gap: '1.6rem' }}>
                <div>
                  <div style={{ fontSize: '2rem', fontWeight: 800 }}>{fmtTime(next.scheduled_at)}</div>
                  <div className="bb-muted bb-small">{fmtDay(next.scheduled_at)}</div>
                </div>
                <div>
                  <b>{next.origin} → {next.destination}</b>
                  <div className="bb-muted bb-small">Pickup: {next.pickup || next.origin}</div>
                  <div className="bb-muted bb-small">
                    {next.driver_name}{next.vehicle_plate ? ` · Bus ${next.vehicle_plate}` : ''}
                    {next.driver_phone && <> · <a href={`tel:${next.driver_phone}`} style={{ color: 'var(--bb-cyan)' }}>Call</a></>}
                  </div>
                </div>
              </div>

              {live && (
                <div style={{ marginTop: '1rem' }}>
                  <div className="bb-alert bb-alert-info" style={{ marginBottom: 10 }}>
                    {status.phase === 'waiting'
                      ? 'The bus has started. When you get on, scan the driver’s QR code in the BusBuddy mobile app.'
                      : 'You are on board. Your parents can see the live location until you scan out.'}
                  </div>
                  <LiveBusMap
                    latitude={status.latitude !== null ? Number(status.latitude) : null}
                    longitude={status.longitude !== null ? Number(status.longitude) : null}
                    locationUpdatedAt={status.location_updated_at}
                    staleAfterMs={30_000}
                    height={300}
                  />
                </div>
              )}
            </>
          )}
        </section>

        {justDone && !live && (
          <section className="bb-card">
            <h2 className="bb-card-title"><Icon name="check" /> Ride completed</h2>
            <p className="bb-muted" style={{ margin: 0 }}>
              {status.origin ? `${status.origin} → ${status.destination}. ` : ''}
              You got off at {fmtTime(endedAt)}. Location sharing has stopped.
            </p>
          </section>
        )}

        </div>
        <div className="bb-side">
        {/* ---- quick actions ---- */}
        <Link href="/student/bookings" className="bb-card" style={{ textDecoration: 'none', color: '#fff' }}>
          <h2 className="bb-card-title"><Icon name="search" /> Find a trip</h2>
          <p className="bb-muted bb-small" style={{ margin: 0 }}>Browse trips from verified drivers and book a seat.</p>
        </Link>
        <Link href="/student/bookings?tab=mine" className="bb-card" style={{ textDecoration: 'none', color: '#fff' }}>
          <h2 className="bb-card-title"><Icon name="calendar" /> My bookings</h2>
          <p className="bb-muted bb-small" style={{ margin: 0 }}>Your upcoming and past rides.</p>
        </Link>
        <Link href="/student/profile" className="bb-card" style={{ textDecoration: 'none', color: '#fff' }}>
          <h2 className="bb-card-title"><Icon name="link" /> Link a parent</h2>
          <p className="bb-muted bb-small" style={{ margin: 0 }}>Create a code so a parent can follow your rides.</p>
        </Link>
      </div>
      </div>

      <div className="bb-row bb-between" style={{ margin: '1.6rem 0 0.6rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Trips you can book</h2>
        <Link href="/student/bookings" style={{ color: 'var(--bb-cyan)', fontWeight: 700 }}>See all</Link>
      </div>
      {available === null ? (
        <div className="bb-skeleton" />
      ) : bookable.length === 0 ? (
        <div className="bb-card bb-empty"><span className="bb-emoji">🗓️</span>No trips to book right now. Check back soon.</div>
      ) : (
        <div className="bb-stack">
          {bookable.map((t) => <TripCard key={t.id} trip={t} onBook={setBookTrip} />)}
        </div>
      )}

      {bookTrip && <BookModal trip={bookTrip} token={token} onClose={() => setBookTrip(null)} onBooked={load} />}
    </>
  );
}

export default function StudentHomePage() {
  return (
    <StudentShell>
      <HomeContent />
    </StudentShell>
  );
}
