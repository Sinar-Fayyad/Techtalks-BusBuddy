'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import StudentShell from '@/components/StudentShell';
import { useMe } from '@/components/AppShell';
import TripCard, { AvailableTrip } from '@/components/TripCard';
import BookModal from '@/components/BookModal';
import StatusChip from '@/components/ui/StatusChip';
import Icon from '@/components/ui/Icon';
import { api, errorOf } from '@/lib/client-api';
import { fmtDay, fmtTime, money, parseUtc } from '@/lib/format';

type Tab = 'book' | 'mine';

function BookingsContent() {
  const { token } = useMe();
  const [tab, setTab] = useState<Tab>('book');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<'time' | 'price'>('time');
  const [trips, setTrips] = useState<AvailableTrip[] | null>(null);
  const [bookings, setBookings] = useState<any[] | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [bookTrip, setBookTrip] = useState<AvailableTrip | null>(null);

  // initial tab / search from the URL (?tab=mine  ?q=hamra)
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get('tab') === 'mine') setTab('mine');
    if (p.get('q')) setQ(p.get('q') as string);
  }, []);

  const loadTrips = useCallback(async () => {
    const r = await api(token, `/scheduled-trips?sort=${sort}${q.trim() ? `&q=${encodeURIComponent(q.trim())}` : ''}`);
    if (r.ok) { setTrips(r.data.trips); setError(''); } else setError(errorOf(r));
  }, [token, q, sort]);

  const loadBookings = useCallback(async () => {
    const r = await api(token, '/bookings/me');
    if (r.ok) { setBookings(r.data.bookings); setError(''); } else setError(errorOf(r));
  }, [token]);

  // search box is debounced so we do not call the API on every key
  useEffect(() => {
    const id = setTimeout(loadTrips, 300);
    return () => clearTimeout(id);
  }, [loadTrips]);
  useEffect(() => { loadBookings(); }, [loadBookings]);

  async function cancel(b: any) {
    if (!window.confirm(`Cancel your booking for ${b.origin} → ${b.destination}?`)) return;
    const r = await api(token, `/bookings/${b.id}`, { method: 'DELETE' });
    if (!r.ok) { setError(errorOf(r)); return; }
    setNotice('Booking cancelled.');
    loadBookings();
    loadTrips();
  }

  const active = (bookings ?? [])
    .filter((b) => b.trip_status === 'upcoming' || b.trip_status === 'in_progress')
    .sort((a, b) => (parseUtc(a.scheduled_at)?.getTime() ?? 0) - (parseUtc(b.scheduled_at)?.getTime() ?? 0));
  const past = (bookings ?? [])
    .filter((b) => b.trip_status === 'completed' || b.trip_status === 'cancelled')
    .sort((a, b) => (parseUtc(b.scheduled_at)?.getTime() ?? 0) - (parseUtc(a.scheduled_at)?.getTime() ?? 0));

  const BookingRow = ({ b }: { b: any }) => {
    const rideStatus = b.exited_at ? 'exited' : b.boarded_at ? 'on_board' : b.trip_status;
    return (
      <article className="bb-card">
        <div className="bb-row bb-between">
          <b style={{ fontSize: '1.05rem' }}>{b.origin} → {b.destination}</b>
          <StatusChip status={rideStatus} />
        </div>
        <div className="bb-muted bb-small" style={{ marginTop: 4 }}>
          {fmtDay(b.scheduled_at)} · {fmtTime(b.scheduled_at)} · {money(b.price)} · Pickup: {b.pickup || b.origin}
        </div>
        <div className="bb-muted bb-small">
          Driver: {b.driver_name}{b.vehicle_plate ? ` · Bus ${b.vehicle_plate}` : ''}
          {b.driver_phone && <> · <a href={`tel:${b.driver_phone}`} style={{ color: 'var(--bb-cyan)' }}>{b.driver_phone}</a></>}
        </div>
        {b.trip_status === 'upcoming' && (
          <div style={{ marginTop: 10 }}>
            <button className="bb-btn bb-btn-sm bb-btn-danger" onClick={() => cancel(b)}><Icon name="x" size={15} /> Cancel booking</button>
          </div>
        )}
      </article>
    );
  };

  return (
    <>
      <div className="bb-page-head">
        <span className="bb-page-icon"><Icon name="bus" size={26} /></span>
        <div>
          <h1>{tab === 'book' ? <>Book a <em>Ride</em></> : <>My <em>Bookings</em></>}</h1>
          <p>{tab === 'book' ? 'Find trips from verified drivers' : 'Your upcoming and past rides'}</p>
        </div>
      </div>

      <div className="bb-tabs" role="tablist" style={{ marginBottom: '1rem' }}>
        <button className="bb-tab" role="tab" aria-selected={tab === 'book'} onClick={() => setTab('book')}>Book a ride</button>
        <button className="bb-tab" role="tab" aria-selected={tab === 'mine'} onClick={() => setTab('mine')}>
          My bookings{active.length > 0 ? ` (${active.length})` : ''}
        </button>
      </div>

      {error && <div className="bb-alert bb-alert-error" style={{ marginBottom: '1rem' }} role="alert">{error}</div>}
      {notice && <div className="bb-alert bb-alert-ok" style={{ marginBottom: '1rem' }}>{notice}</div>}

      {tab === 'book' && (
        <>
          <div className="bb-row" style={{ marginBottom: '1rem' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
              <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--bb-cyan)', display: 'flex' }}><Icon name="search" size={20} /></span>
              <input className="bb-input" style={{ borderRadius: 999, paddingLeft: 46 }} placeholder="Search by driver, route or stop…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <div className="bb-tabs">
              <button className="bb-tab" aria-selected={sort === 'time'} onClick={() => setSort('time')}>Soonest</button>
              <button className="bb-tab" aria-selected={sort === 'price'} onClick={() => setSort('price')}>Cheapest</button>
            </div>
          </div>
          {trips === null ? (
            <div className="bb-skeleton" />
          ) : trips.length === 0 ? (
            <div className="bb-card bb-empty"><span className="bb-emoji">🔎</span>{q ? 'No trips match your search.' : 'No trips available right now.'}</div>
          ) : (
            <div className="bb-stack">
              {trips.map((t) => <TripCard key={t.id} trip={t} onBook={setBookTrip} />)}
            </div>
          )}
        </>
      )}

      {tab === 'mine' && (
        <>
          <div className="bb-alert bb-alert-info" style={{ marginBottom: '1rem' }}>
            <Icon name="qr" size={16} /> Boarding and exit are done in the BusBuddy <b>mobile app</b>: scan the driver’s QR code when you get on and when you get off.
          </div>
          {bookings === null ? (
            <div className="bb-skeleton" />
          ) : bookings.length === 0 ? (
            <div className="bb-card bb-empty"><span className="bb-emoji">🎟️</span>No bookings yet. <button className="bb-btn bb-btn-sm" style={{ marginLeft: 8 }} onClick={() => setTab('book')}>Find a trip</button></div>
          ) : (
            <>
              {active.length > 0 && (
                <>
                  <h2 style={{ fontSize: '1.1rem', margin: '0 0 0.6rem' }}>Upcoming</h2>
                  <div className="bb-stack" style={{ marginBottom: '1.4rem' }}>{active.map((b) => <BookingRow key={b.id} b={b} />)}</div>
                </>
              )}
              {past.length > 0 && (
                <>
                  <h2 style={{ fontSize: '1.1rem', margin: '0 0 0.6rem' }}>Past</h2>
                  <div className="bb-stack">{past.map((b) => <BookingRow key={b.id} b={b} />)}</div>
                </>
              )}
            </>
          )}
        </>
      )}

      {bookTrip && (
        <BookModal
          trip={bookTrip}
          token={token}
          onClose={() => setBookTrip(null)}
          onBooked={() => { setNotice('Booked! You will find it in My bookings.'); loadTrips(); loadBookings(); }}
        />
      )}
      <p className="bb-small bb-muted" style={{ marginTop: '1.4rem' }}>
        Need to see where the bus is? Open <Link href="/student/home" style={{ color: 'var(--bb-cyan)' }}>Home</Link> once the trip starts.
      </p>
    </>
  );
}

export default function StudentBookingsPage() {
  return (
    <StudentShell>
      <BookingsContent />
    </StudentShell>
  );
}
