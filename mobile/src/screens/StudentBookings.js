import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Card, Row, T, Btn, Chip, Field, Segmented, Notice, Empty, Skeleton, Title, C } from '../ui';
import { TripCard, BookSheet } from '../parts';
import { useApp } from '../ctx';
import { call, errOf } from '../net';
import { fmtDay, fmtTime, money, parseUtc } from '../format';

export default function StudentBookings({ params }) {
  const { token } = useApp();
  const [tab, setTab] = useState(params && params.tab === 'mine' ? 'mine' : 'book');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('time');
  const [trips, setTrips] = useState(null);
  const [bookings, setBookings] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [bookTrip, setBookTrip] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadTrips = useCallback(async () => {
    const r = await call(token, `/scheduled-trips?sort=${sort}${q.trim() ? `&q=${encodeURIComponent(q.trim())}` : ''}`);
    if (r.ok) { setTrips(r.data.trips); setError(''); } else setError(errOf(r));
  }, [token, q, sort]);
  const loadBookings = useCallback(async () => {
    const r = await call(token, '/bookings/me');
    if (r.ok) { setBookings(r.data.bookings); setError(''); } else setError(errOf(r));
  }, [token]);

  useEffect(() => { const id = setTimeout(loadTrips, 300); return () => clearTimeout(id); }, [loadTrips]);
  useEffect(() => { loadBookings(); }, [loadBookings]);

  function cancel(b) {
    Alert.alert('Cancel booking', `Cancel your booking for ${b.origin} → ${b.destination}?`, [
      { text: 'Keep it', style: 'cancel' },
      { text: 'Cancel booking', style: 'destructive', onPress: async () => {
        const r = await call(token, `/bookings/${b.id}`, { method: 'DELETE' });
        if (!r.ok) return setError(errOf(r));
        setNotice('Booking cancelled.');
        loadBookings(); loadTrips();
      } },
    ]);
  }
  async function refresh() { setRefreshing(true); await Promise.all([loadTrips(), loadBookings()]); setRefreshing(false); }

  const ms = (b) => parseUtc(b.scheduled_at)?.getTime() || 0;
  const active = (bookings || []).filter((b) => b.trip_status === 'upcoming' || b.trip_status === 'in_progress').sort((a, b) => ms(a) - ms(b));
  const past = (bookings || []).filter((b) => b.trip_status === 'completed' || b.trip_status === 'cancelled').sort((a, b) => ms(b) - ms(a));

  const Booking = ({ b }) => (
    <Card>
      <Row between><T bold size={16} style={{ flex: 1 }}>{b.origin} → {b.destination}</T><Chip status={b.exited_at ? 'exited' : b.boarded_at ? 'on_board' : b.trip_status} /></Row>
      <T dim small style={{ marginTop: 4 }}>{fmtDay(b.scheduled_at)} · {fmtTime(b.scheduled_at)} · {money(b.price)} · Pickup: {b.pickup || b.origin}</T>
      <T dim small>Driver: {b.driver_name}{b.vehicle_plate ? ` · Bus ${b.vehicle_plate}` : ''}{b.driver_phone ? ` · ${b.driver_phone}` : ''}</T>
      {b.trip_status === 'upcoming' ? <View style={{ marginTop: 10 }}><Btn small kind="danger" icon="close" title="Cancel booking" onPress={() => cancel(b)} /></View> : null}
    </Card>
  );

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <Title title={tab === 'book' ? 'Book a' : 'My'} highlight={tab === 'book' ? 'Ride' : 'Bookings'} sub={tab === 'book' ? 'Find trips from verified drivers' : 'Your upcoming and past rides'} />
      <Segmented value={tab} onChange={setTab} items={[{ value: 'book', label: 'Book a ride' }, { value: 'mine', label: `My bookings${active.length ? ` (${active.length})` : ''}` }]} />
      {error ? <Notice kind="error">{error}</Notice> : null}
      {notice ? <Notice kind="ok">{notice}</Notice> : null}

      {tab === 'book' ? (
        <>
          <Field icon="search-outline" placeholder="Search by driver, route or stop…" value={q} onChangeText={setQ} />
          <Segmented value={sort} onChange={setSort} items={[{ value: 'time', label: 'Soonest' }, { value: 'price', label: 'Cheapest' }]} />
          {trips === null ? <Skeleton /> : trips.length === 0 ? <Empty emoji="🔎">{q ? 'No trips match your search.' : 'No trips available right now.'}</Empty> : trips.map((t) => <TripCard key={t.id} trip={t} onBook={setBookTrip} />)}
        </>
      ) : (
        <>
          <Notice>Boarding and exit: open the <Text style={{ fontWeight: '800' }}>Scan</Text> tab and scan the driver’s QR code when you get on and when you get off.</Notice>
          {bookings === null ? <Skeleton /> : bookings.length === 0 ? <Empty emoji="🎟️">No bookings yet. Open “Book a ride” to find a trip.</Empty> : (
            <>
              {active.length > 0 ? <><T bold size={17} style={{ marginBottom: 6 }}>Upcoming</T>{active.map((b) => <Booking key={b.id} b={b} />)}</> : null}
              {past.length > 0 ? <><T bold size={17} style={{ marginVertical: 6 }}>Past</T>{past.map((b) => <Booking key={b.id} b={b} />)}</> : null}
            </>
          )}
        </>
      )}
      {bookTrip ? <BookSheet trip={bookTrip} token={token} onClose={() => setBookTrip(null)} onBooked={() => { setNotice('Booked! You will find it in My bookings.'); loadTrips(); loadBookings(); }} /> : null}
    </Screen>
  );
}
