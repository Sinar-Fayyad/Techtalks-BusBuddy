import React, { useCallback, useEffect, useState } from 'react';
import { View, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Screen, Title, Card, Row, T, Btn, Chip, Avatar, Field, Segmented, CardTitle, Notice, KV, Skeleton } from '../ui';
import { ChangePasswordCard, EditProfileSheet } from '../parts';
import { ReportSheet } from '../driverParts';
import { useApp } from '../ctx';
import { call, uploadNative, errOf } from '../net';

const STATUS_TEXT = {
  verified: 'You can appear to students and receive bookings.',
  pending: 'An admin is reviewing your license. You will be notified.',
  rejected: 'Your license was rejected. Upload a clearer copy in the License tab.',
};

export default function DriverProfile() {
  const { token, me, refreshMe, logout } = useApp();
  const [tab, setTab] = useState('personal');
  const [d, setD] = useState(null);
  const [counts, setCounts] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editing, setEditing] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [busy, setBusy] = useState(false);
  // vehicle form
  const [plate, setPlate] = useState('');
  const [seats, setSeats] = useState('');
  const [price, setPrice] = useState('');
  const [route, setRoute] = useState('');
  const [stops, setStops] = useState('');
  const [errors, setErrors] = useState({});

  const load = useCallback(async () => {
    const [p, t] = await Promise.all([call(token, '/driver/me'), call(token, '/driver/scheduled-trips')]);
    if (p.ok) {
      const x = p.data.driver;
      setD(x); setPlate(x.vehicle_plate || ''); setSeats(x.seats ? String(x.seats) : ''); setPrice(x.price != null ? String(x.price) : ''); setRoute(x.route || ''); setStops(x.stops || '');
    } else setError(errOf(p));
    if (t.ok) setCounts(t.data.counts);
  }, [token]);
  useEffect(() => { load(); }, [load]);

  async function saveVehicle() {
    setError('');
    const v = {};
    if (!plate.trim()) v.plate = 'Enter your vehicle plate';
    const n = Number(seats);
    if (!Number.isInteger(n) || n < 1 || n > 100) v.seats = 'Seats must be a whole number from 1 to 100';
    const p = Number(price);
    if (price === '' || !Number.isFinite(p) || p < 0) v.price = 'Enter a valid price';
    setErrors(v);
    if (Object.keys(v).length) return;
    setBusy(true);
    const r = await call(token, '/driver/me', { method: 'PATCH', body: { vehicle_plate: plate.trim(), seats: n, price: p, route: route.trim() || null, stops: stops.trim() || null } });
    setBusy(false);
    if (!r.ok) return setError(errOf(r));
    setNotice('Vehicle & route saved.'); load();
  }

  async function newLicense() {
    setError('');
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return setError('Allow photo access to upload your license.');
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (res.canceled || !res.assets || !res.assets[0]) return;
    const a = res.assets[0];
    const ext = (a.uri.split('.').pop() || 'jpg').toLowerCase() === 'png' ? 'png' : 'jpg';
    setBusy(true);
    const up = await uploadNative(token, '/driver/license', {
      uri: a.uri,
      type: ext === 'png' ? 'image/png' : 'image/jpeg',
    });
    if (!up.ok) { setBusy(false); return setError(errOf(up)); }
    const r = await call(token, '/driver/me', { method: 'PATCH', body: { license_url: up.data.path } });
    setBusy(false);
    if (!r.ok) return setError(errOf(r));
    setNotice('New license uploaded. An admin will review it.'); load();
  }

  return (
    <Screen>
      <Title highlight="Profile" sub="Your personal information and driver details" />
      {error ? <Notice kind="error">{error}</Notice> : null}
      {notice ? <Notice kind="ok">{notice}</Notice> : null}
      <Card glow>
        <Row gap={14}>
          <Avatar name={me.name} size={72} />
          <View style={{ flex: 1 }}>
            <T bold size={21}>{me.name}</T>
            <Row gap={8}><T dim>Driver</T>{d ? <Chip status={d.status} /> : null}</Row>
            <T dim small style={{ marginTop: 6 }}>📞 {me.phone || '—'}</T>
            <T dim small>✉️ {me.email}</T>
          </View>
        </Row>
      </Card>

      <Card>
        <CardTitle icon="shield-checkmark-outline">Driver status</CardTitle>
        {d ? <Notice kind={d.status === 'verified' ? 'ok' : d.status === 'rejected' ? 'error' : 'info'} style={{ marginBottom: 0 }}>{d.status === 'verified' ? 'Approved. ' : ''}{STATUS_TEXT[d.status]}</Notice> : <Skeleton />}
      </Card>

      <Segmented value={tab} onChange={setTab} items={[{ value: 'personal', label: 'Personal' }, { value: 'license', label: 'License' }, { value: 'vehicle', label: 'Vehicle' }, { value: 'settings', label: 'Settings' }]} />

      {tab === 'personal' ? (
        <Card>
          <CardTitle icon="person-outline">Personal information</CardTitle>
          <KV k="Full name" v={me.name} /><KV k="Email" v={me.email} /><KV k="Phone" v={me.phone || '—'} />
          <View style={{ marginTop: 10 }}><Btn icon="pencil" title="Edit profile" onPress={() => setEditing(true)} /></View>
        </Card>
      ) : null}

      {tab === 'license' && d ? (
        <Card>
          <CardTitle icon="card-outline">Driving license</CardTitle>
          <KV k="Status" v={d.status} /><KV k="File" v={String(d.license_url).split('/').pop()} />
          <T dim small style={{ marginVertical: 10 }}>A new license goes back to “Pending” until an admin verifies it.</T>
          <Btn icon="image-outline" title="Upload a new license photo" onPress={newLicense} busy={busy} />
        </Card>
      ) : null}

      {tab === 'vehicle' ? (
        <Card>
          <CardTitle icon="bus-outline">Vehicle & route</CardTitle>
          <Field icon="bus-outline" label="Vehicle plate" placeholder="e.g. B 123456" value={plate} onChangeText={setPlate} error={errors.plate} autoCapitalize="characters" />
          <Row gap={10} style={{ alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}><Field icon="people-outline" label="Seats" value={seats} onChangeText={setSeats} error={errors.seats} keyboardType="number-pad" /></View>
            <View style={{ flex: 1 }}><Field icon="cash-outline" label="Default price ($)" value={price} onChangeText={setPrice} error={errors.price} keyboardType="decimal-pad" /></View>
          </Row>
          <Field icon="git-branch-outline" label="Usual route (optional)" value={route} onChangeText={setRoute} />
          <Field label="Usual stops (optional, one per line)" value={stops} onChangeText={setStops} multiline />
          <T dim small style={{ marginBottom: 10 }}>Seats and price are the defaults when you add a new trip.</T>
          <Btn title="Save" onPress={saveVehicle} busy={busy} />
        </Card>
      ) : null}

      {tab === 'settings' ? (
        <>
          <ChangePasswordCard token={token} />
          <Card>
            <Btn kind="danger" icon="log-out-outline" title="Log out" onPress={() => Alert.alert('Log out', 'Do you want to log out?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Log out', style: 'destructive', onPress: logout }])} />
          </Card>
        </>
      ) : null}

      <Card>
        <CardTitle icon="alert-circle-outline">Quick actions</CardTitle>
        <Btn kind="danger" icon="alert-circle-outline" title="Report vehicle issue" onPress={() => setReporting(true)} />
      </Card>
      <Card>
        <CardTitle icon="stats-chart-outline">Driver summary</CardTitle>
        <KV k="Total trips" v={counts ? counts.total : '…'} /><KV k="Completed trips" v={counts ? counts.completed : '…'} /><KV k="Upcoming trips" v={counts ? counts.upcoming : '…'} /><KV k="Cancelled trips" v={counts ? counts.cancelled : '…'} />
      </Card>
      {editing ? <EditProfileSheet me={me} token={token} asDriver onClose={() => setEditing(false)} onSaved={() => { setEditing(false); setNotice('Profile updated.'); refreshMe(); }} /> : null}
      {reporting ? <ReportSheet token={token} onClose={() => setReporting(false)} /> : null}
    </Screen>
  );
}
