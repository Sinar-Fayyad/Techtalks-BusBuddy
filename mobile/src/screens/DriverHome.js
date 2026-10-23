import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { Screen, Card, Row, T, Btn, Chip, CardTitle, Notice, Segmented, Skeleton, Empty, C } from '../ui';
import { TripFormSheet, ReportSheet, useGps } from '../driverParts';
import { useApp } from '../ctx';
import { call, errOf } from '../net';
import { firstName, fmtDay, fmtTime, parseUtc } from '../format';

function todayStart() { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); }
function nextTrip(list) {
  return list
    .filter((t) => t.status === 'upcoming' && (parseUtc(t.scheduled_at)?.getTime() || 0) > Date.now() - 2 * 3600e3)
    .sort((a, b) => (parseUtc(a.scheduled_at)?.getTime() || 0) - (parseUtc(b.scheduled_at)?.getTime() || 0))[0];
}

export default function DriverHome({ nav }) {
  const { token, me } = useApp();
  const [profile, setProfile] = useState(null);
  const [trips, setTrips] = useState(null);
  const [active, setActive] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [qr, setQr] = useState(null);
  const [qrTab, setQrTab] = useState('board');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [adding, setAdding] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [p, t, a] = await Promise.all([call(token, '/driver/me'), call(token, '/driver/scheduled-trips'), call(token, '/driver/trips/active')]);
    if (p.ok) setProfile(p.data.driver);
    if (t.ok) setTrips(t.data.trips);
    const run = a.ok ? a.data.trip : null;
    setActive(run);
    const list = t.ok ? t.data.trips : [];
    const focus = (run && run.scheduled_trip_id) || (nextTrip(list) || {}).id || null;
    if (focus) { const b = await call(token, `/driver/bookings?tripId=${focus}`); if (b.ok) setBookings(b.data.bookings); } else setBookings([]);
    if (run) { const q = await call(token, '/driver/qr'); if (q.ok) setQr(q.data); } else setQr(null);
    if (!p.ok && !t.ok && !a.ok) setError(errOf(p)); else setError('');
  }, [token]);

  const isActive = !!active;
  useEffect(() => {
    load();
    const id = setInterval(load, isActive ? 10000 : 30000);
    return () => clearInterval(id);
  }, [load, isActive]);

  const gps = useGps(token, isActive);
  const next = trips ? nextTrip(trips) : null;
  const verified = profile && profile.status === 'verified';

  async function start(tripId) {
    setBusy(true); setError('');
    const r = await call(token, '/driver/trips/start', { method: 'POST', body: { scheduledTripId: tripId } });
    setBusy(false);
    if (!r.ok) setError(errOf(r)); else setNotice('Trip started. Students are notified.');
    load();
  }
  function stop() {
    Alert.alert('Stop trip', 'Location sharing will end for everyone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Stop trip', style: 'destructive', onPress: async () => {
        setBusy(true);
        const r = await call(token, '/driver/trips/stop', { method: 'POST' });
        setBusy(false);
        if (!r.ok) setError(errOf(r)); else setNotice('Trip stopped.');
        load();
      } },
    ]);
  }
  async function refresh() { setRefreshing(true); await load(); setRefreshing(false); }

  const today = (trips || []).filter((t) => { const ms = parseUtc(t.scheduled_at)?.getTime() || 0; return ms >= todayStart() && ms < todayStart() + 86400e3; });
  const sum = { c: today.filter((t) => t.status === 'completed').length, u: today.filter((t) => t.status === 'upcoming' || t.status === 'in_progress').length, x: today.filter((t) => t.status === 'cancelled').length };
  const boarded = bookings.filter((b) => b.status === 'on_board').length;
  const alerts = active ? bookings.filter((b) => b.status === 'waiting') : [];

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <Row between style={{ marginBottom: 10 }}>
        <View><Text style={{ color: '#fff', fontSize: 28, fontWeight: '800' }}>Home</Text><T dim>Welcome back, <Text style={{ color: C.cyan }}>{firstName(me.name)}</Text></T></View>
        {verified && !active ? <Btn small icon="add" title="Add trip" onPress={() => setAdding(true)} /> : null}
      </Row>
      {error ? <Notice kind="error">{error}</Notice> : null}
      {notice ? <Notice kind="ok">{notice}</Notice> : null}
      {profile && profile.status === 'pending' ? <Notice>Your license is being reviewed by an admin. You can add trips once you are verified.</Notice> : null}
      {profile && profile.status === 'rejected' ? <Notice kind="error">Your license was rejected. Upload a new one in Profile → License.</Notice> : null}
      {verified && profile && !profile.profile_complete ? <Notice>Complete your profile: add your {profile.missing_fields.map((f) => f.replace('_', ' ')).join(', ')} in Profile → Vehicle & Route.</Notice> : null}

      {active ? (
        <Card glow>
          <CardTitle icon="bus-outline" right={<Chip status="in_progress" />}>Trip in progress</CardTitle>
          <T bold size={19}>{active.origin ? `${active.origin} → ${active.destination}` : 'Ad-hoc trip'}</T>
          <T dim small style={{ marginBottom: 10 }}>Started {fmtTime(active.start_time)} · {boarded} of {bookings.length} students on board</T>
          <Notice kind={gps.error ? 'error' : 'info'}>{gps.error || (gps.lastSent ? `Sharing your location · last sent ${gps.lastSent}` : 'Getting your position…')}</Notice>
          {qr ? (
            <View style={{ alignItems: 'center', marginBottom: 10 }}>
              <Segmented value={qrTab} onChange={setQrTab} items={[{ value: 'board', label: 'Boarding code' }, { value: 'exit', label: 'Exit code' }]} />
              <View style={{ backgroundColor: '#fff', padding: 14, borderRadius: 18 }}><QRCode value={qrTab === 'board' ? qr.board_code : qr.exit_code} size={210} /></View>
              <T dim small style={{ marginTop: 8, textAlign: 'center' }}>{qrTab === 'board' ? 'Students scan this in the BusBuddy app when they get on.' : 'Students scan this when they get off.'}</T>
            </View>
          ) : null}
          <Row gap={10}>
            <View style={{ flex: 1 }}><Btn kind="ghost" small icon="alert-circle-outline" title="Report issue" onPress={() => setReporting(true)} style={{ alignSelf: 'stretch' }} /></View>
            <View style={{ flex: 1 }}><Btn kind="danger" small icon="stop-circle-outline" title="Stop Trip" onPress={stop} busy={busy} style={{ alignSelf: 'stretch' }} /></View>
          </Row>
        </Card>
      ) : (
        <Card glow>
          <CardTitle icon="navigate-outline" right={next ? <Chip label={fmtDay(next.scheduled_at)} /> : null}>Next trip</CardTitle>
          {trips === null ? <Skeleton /> : !next ? (
            <T dim>{verified ? 'No upcoming trip. Add one so students can book it.' : 'Once you are verified you can add trips here.'}</T>
          ) : (
            <>
              <Row gap={16}>
                <View><T bold size={28}>{fmtTime(next.scheduled_at)}</T><T dim small>{fmtDay(next.scheduled_at)}</T></View>
                <View style={{ flex: 1 }}><T bold size={17}>{next.origin} → {next.destination}</T><T dim small>{next.booked_count} booked · {next.seats} seats</T></View>
              </Row>
              <View style={{ marginTop: 12 }}><Btn icon="play" title="Start Trip" onPress={() => start(next.id)} busy={busy} disabled={!verified} /></View>
            </>
          )}
        </Card>
      )}

      <Card>
        <CardTitle icon="calendar-outline">Today’s summary</CardTitle>
        <Row between>
          {[[sum.c, 'Completed', C.green], [sum.u, 'Upcoming', C.cyan], [sum.x, 'Cancelled', C.pink]].map(([n, l, col]) => (
            <View key={l} style={{ alignItems: 'center', flex: 1 }}><Text style={{ color: col, fontSize: 28, fontWeight: '800' }}>{n}</Text><T dim small>{l}</T></View>
          ))}
        </Row>
      </Card>

      <Card>
        <CardTitle icon="notifications-outline">Alerts</CardTitle>
        {alerts.length === 0 ? <T dim small>No alerts. {active ? 'Every booked student has boarded.' : 'Alerts appear while a trip is running.'}</T> : alerts.map((b) => (
          <Notice key={b.id} kind="error">{b.student_name} hasn’t boarded · Pickup: {b.pickup || '—'}{b.student_phone ? ` · ${b.student_phone}` : ''}</Notice>
        ))}
        {!active && verified ? <Btn small kind="ghost" icon="alert-circle-outline" title="Report vehicle issue" onPress={() => setReporting(true)} /> : null}
      </Card>

      {reporting ? <ReportSheet token={token} onClose={() => setReporting(false)} /> : null}
      {adding ? <TripFormSheet token={token} defaults={{ seats: profile && profile.seats, price: profile && profile.price }} onClose={() => setAdding(false)} onSaved={(m) => { setNotice(m); load(); }} /> : null}
    </Screen>
  );
}
