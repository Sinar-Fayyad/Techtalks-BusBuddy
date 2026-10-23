import React, { useCallback, useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Card, Row, T, Btn, Chip, CardTitle, Notice, Empty, Skeleton, C } from '../ui';
import { TripCard, BookSheet } from '../parts';
import MapView from '../MapView';
import { useApp } from '../ctx';
import { call, errOf } from '../net';
import { firstName, fmtDay, fmtTime, parseUtc } from '../format';

const RECENT_MS = 3 * 60 * 60 * 1000;

export default function StudentHome({ nav }) {
  const { token, me } = useApp();
  const [bookings, setBookings] = useState(null);
  const [available, setAvailable] = useState(null);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [bookTrip, setBookTrip] = useState(null);

  const load = useCallback(async () => {
    const [b, a, s] = await Promise.all([
      call(token, '/bookings/me'),
      call(token, '/scheduled-trips?sort=time'),
      call(token, `/students/${me.id}/trip-status`),
    ]);
    if (b.ok) setBookings(b.data.bookings);
    if (a.ok) setAvailable(a.data.trips);
    if (s.ok) setStatus(s.data.trip);
    setError(!b.ok && !a.ok && !s.ok ? errOf(b) : '');
  }, [token, me.id]);

  const live = !!status && (status.phase === 'waiting' || status.phase === 'onboard');
  useEffect(() => {
    load();
    const id = setInterval(load, live ? 10000 : 30000); // faster while the trip is live
    return () => clearInterval(id);
  }, [load, live]);

  const upcoming = (bookings || [])
    .filter((b) => b.trip_status === 'upcoming' || b.trip_status === 'in_progress')
    .sort((x, y) => (parseUtc(x.scheduled_at)?.getTime() || 0) - (parseUtc(y.scheduled_at)?.getTime() || 0));
  const next = (live && upcoming.find((b) => b.scheduled_trip_id === status.scheduled_trip_id)) || upcoming[0] || null;
  const endedAt = status ? status.exited_at || status.end_time : null;
  const justDone = status && status.phase === 'done' && endedAt && Date.now() - (parseUtc(endedAt)?.getTime() || 0) < RECENT_MS;
  const bookable = (available || []).filter((t) => !t.booked).slice(0, 3);
  const marker = live && status.latitude && status.longitude
    ? [{ id: 1, name: 'Bus', lat: Number(status.latitude), lng: Number(status.longitude) }] : [];

  async function refresh() { setRefreshing(true); await load(); setRefreshing(false); }

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <Text style={{ color: '#fff', fontSize: 28, fontWeight: '800' }}>Hi, <Text style={{ color: C.cyan }}>{firstName(me.name)}</Text></Text>
      <T dim style={{ marginBottom: 12 }}>Ready for your next ride?</T>
      {error ? <Notice kind="error">{error}</Notice> : null}

      <Card glow>
        <CardTitle icon="bus-outline" right={next ? <Chip status={next.trip_status} /> : null}>{live ? 'Your trip is live' : 'Your next ride'}</CardTitle>
        {bookings === null ? <Skeleton /> : !next ? (
          <T dim>No upcoming ride. Open Bookings to find a trip and book it.</T>
        ) : (
          <>
            <Row gap={16}>
              <View><T bold size={28}>{fmtTime(next.scheduled_at)}</T><T dim small>{fmtDay(next.scheduled_at)}</T></View>
              <View style={{ flex: 1 }}>
                <T bold>{next.origin} → {next.destination}</T>
                <T dim small>Pickup: {next.pickup || next.origin}</T>
                <T dim small>{next.driver_name}{next.vehicle_plate ? ` · Bus ${next.vehicle_plate}` : ''}</T>
              </View>
            </Row>
            {live ? (
              <View style={{ marginTop: 12 }}>
                <Notice>{status.phase === 'waiting' ? 'The bus has started. When you get on, open Scan and scan the driver’s QR code.' : 'You are on board. Your parents can see the live location until you scan out.'}</Notice>
                <MapView markers={marker} selectedId={1} height={240} />
                {marker.length === 0 ? <T dim small>Location unavailable — the driver hasn’t shared a position yet.</T> : null}
                {status.phase === 'waiting' ? <Btn icon="qr-code-outline" title="Scan to board" onPress={() => nav.go('scan')} /> : <Btn icon="qr-code-outline" title="Scan to exit" kind="ghost" onPress={() => nav.go('scan', { mode: 'exit' })} />}
              </View>
            ) : null}
          </>
        )}
      </Card>

      {justDone && !live ? (
        <Card><CardTitle icon="checkmark-circle-outline">Ride completed</CardTitle><T dim>{status.origin ? `${status.origin} → ${status.destination}. ` : ''}You got off at {fmtTime(endedAt)}. Location sharing has stopped.</T></Card>
      ) : null}

      <Row gap={10} style={{ marginBottom: 12 }}>
        {[['search-outline', 'Find a trip', () => nav.go('bookings')], ['calendar-outline', 'My bookings', () => nav.go('bookings', { tab: 'mine' })], ['link-outline', 'Link parent', () => nav.go('profile')]].map(([icon, label, fn]) => (
          <Card key={label} onPress={fn} style={{ flex: 1, alignItems: 'center', padding: 10, marginBottom: 0 }}>
            <Ionicons name={icon} size={24} color={C.cyan} />
            <T small bold style={{ marginTop: 4, textAlign: 'center' }}>{label}</T>
          </Card>
        ))}
      </Row>

      <Text style={{ color: '#fff', fontSize: 19, fontWeight: '800', marginBottom: 8 }}>Trips you can book</Text>
      {available === null ? <Skeleton /> : bookable.length === 0 ? <Empty emoji="🗓️">No trips to book right now. Check back soon.</Empty> : bookable.map((t) => <TripCard key={t.id} trip={t} onBook={setBookTrip} />)}
      {bookTrip ? <BookSheet trip={bookTrip} token={token} onClose={() => setBookTrip(null)} onBooked={load} /> : null}
    </Screen>
  );
}
