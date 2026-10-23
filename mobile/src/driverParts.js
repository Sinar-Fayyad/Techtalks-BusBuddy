import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { Row, T, Btn, Field, Sheet, Notice, Chip, Segmented, C } from './ui';
import { call, errOf } from './net';
import { localToIso, toLocalParts } from './format';

// Shares the driver's GPS while a trip runs: max 1 ping / 10 s, never two requests at once.
// (Expo Go keeps sharing only while the app is open on screen.)
export function useGps(token, active) {
  const [state, setState] = useState({ error: '', lastSent: '' });
  useEffect(() => {
    if (!active) return undefined;
    let sub = null;
    let timer = null;
    let last = null;
    let sentAt = 0;
    let busy = false;
    let stopped = false;

    async function send() {
      if (stopped || busy || !last) return;
      busy = true;
      sentAt = Date.now();
      const r = await call(token, '/driver/trips/location', { method: 'POST', body: { latitude: last.latitude, longitude: last.longitude } });
      busy = false;
      if (stopped) return;
      if (r.ok) setState({ error: '', lastSent: new Date().toLocaleTimeString() });
      else if (r.status === 409) setState((s) => ({ ...s, error: 'Your trip has ended. Location sharing stopped.' }));
      else setState((s) => ({ ...s, error: 'Could not send location. Retrying…' }));
    }

    (async () => {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (stopped) return;
      if (!perm.granted) { setState({ error: 'Location permission is required to share your bus.', lastSent: '' }); return; }
      try {
        sub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 0 },
          (p) => {
            last = p.coords;
            if (Date.now() - sentAt >= 10000) send();
          }
        );
        timer = setInterval(() => { if (last && Date.now() - sentAt >= 10000) send(); }, 2000);
      } catch (e) {
        setState({ error: 'Could not read your position. Turn on GPS.', lastSent: '' });
      }
    })();

    return () => {
      stopped = true;
      if (sub) sub.remove();
      if (timer) clearInterval(timer);
    };
  }, [token, active]);
  return state;
}

// Add / edit a planned trip. defaults = driver's seats + price for a NEW trip.
export function TripFormSheet({ token, trip, defaults, onClose, onSaved }) {
  const editing = !!(trip && trip.id);
  const init = trip ? toLocalParts(trip.scheduled_at) : { date: toLocalParts().date, time: '' };
  const [origin, setOrigin] = useState(trip ? trip.origin : '');
  const [dest, setDest] = useState(trip ? trip.destination : '');
  const [date, setDate] = useState(init.date);
  const [time, setTime] = useState(init.time);
  const [seats, setSeats] = useState(String((trip && trip.seats) || (defaults && defaults.seats) || ''));
  const [price, setPrice] = useState(String(trip ? trip.price : (defaults && defaults.price != null ? defaults.price : '')));
  const [stops, setStops] = useState((trip && trip.stops) || '');
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function save() {
    const v = {};
    if (!origin.trim()) v.origin = 'Enter the starting point';
    if (!dest.trim()) v.dest = 'Enter the destination';
    const iso = localToIso(date.trim(), time.trim());
    if (!iso) v.when = 'Use the format 2026-10-25 and 07:30';
    else if (new Date(iso).getTime() < Date.now() - 3600000) v.when = 'This time is in the past';
    const n = Number(seats);
    if (!Number.isInteger(n) || n < 1 || n > 100) v.seats = 'Seats must be a whole number from 1 to 100';
    const p = price === '' ? 0 : Number(price);
    if (!Number.isFinite(p) || p < 0) v.price = 'Enter a valid price';
    setErrors(v);
    if (Object.keys(v).length) return;
    setBusy(true);
    const body = { origin: origin.trim(), destination: dest.trim(), scheduled_at: iso, seats: n, price: p, stops: stops.trim() || (editing ? null : undefined) };
    const r = editing
      ? await call(token, `/driver/scheduled-trips/${trip.id}`, { method: 'PATCH', body })
      : await call(token, '/driver/scheduled-trips', { method: 'POST', body });
    setBusy(false);
    if (!r.ok) return setError(errOf(r));
    onSaved(editing ? 'Trip updated.' : 'Trip created.');
    onClose();
  }

  return (
    <Sheet visible title={editing ? 'Edit trip' : 'Add a trip'} onClose={onClose}>
      <Field icon="radio-button-on-outline" label="From" placeholder="e.g. Jounieh" value={origin} onChangeText={setOrigin} error={errors.origin} autoCapitalize="words" />
      <Field icon="flag-outline" label="To" placeholder="e.g. University campus" value={dest} onChangeText={setDest} error={errors.dest} autoCapitalize="words" />
      <Row gap={10} style={{ alignItems: 'flex-start' }}>
        <View style={{ flex: 1.4 }}><Field icon="calendar-outline" label="Date (YYYY-MM-DD)" placeholder="2026-10-25" value={date} onChangeText={setDate} error={errors.when} keyboardType="numbers-and-punctuation" /></View>
        <View style={{ flex: 1 }}><Field icon="time-outline" label="Time (24h)" placeholder="07:30" value={time} onChangeText={setTime} keyboardType="numbers-and-punctuation" /></View>
      </Row>
      <Row gap={10} style={{ alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}><Field icon="people-outline" label="Seats" value={seats} onChangeText={setSeats} error={errors.seats} keyboardType="number-pad" /></View>
        <View style={{ flex: 1 }}><Field icon="cash-outline" label="Price ($)" value={price} onChangeText={setPrice} error={errors.price} keyboardType="decimal-pad" /></View>
      </Row>
      <Field label="Stops (optional, one per line)" placeholder={'Jounieh 7:30\nKaslik 7:45'} value={stops} onChangeText={setStops} multiline />
      {error ? <Notice kind="error">{error}</Notice> : null}
      <Btn title={editing ? 'Save changes' : 'Create trip'} onPress={save} busy={busy} />
    </Sheet>
  );
}

// "Report vehicle issue": notifies parents of students on board, nearby buses and admins.
export function ReportSheet({ token, onClose }) {
  const [category, setCategory] = useState('breakdown');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);

  async function send() {
    setBusy(true); setError('');
    const r = await call(token, '/driver/issues', { method: 'POST', body: { category, message: message.trim() || undefined } });
    setBusy(false);
    if (!r.ok) return setError(errOf(r));
    setDone(r.data.notified);
  }
  return (
    <Sheet visible title="Report vehicle issue" onClose={onClose}>
      {done ? (
        <>
          <Notice kind="ok">Reported. Notified: {done.parents} parent{done.parents === 1 ? '' : 's'}, {done.drivers} nearby bus{done.drivers === 1 ? '' : 'es'}, {done.admins} admin{done.admins === 1 ? '' : 's'}.</Notice>
          <Btn title="Close" onPress={onClose} />
        </>
      ) : (
        <>
          <T dim small style={{ marginBottom: 10 }}>Parents of the students on your bus, drivers of buses near you and the admins will be notified right away.</T>
          <Segmented value={category} onChange={setCategory} items={[{ value: 'breakdown', label: 'Breakdown' }, { value: 'accident', label: 'Accident' }, { value: 'delay', label: 'Delay' }, { value: 'other', label: 'Other' }]} />
          <Field label="Details (optional)" placeholder="e.g. Flat tire near Jounieh, 15 min delay" value={message} onChangeText={setMessage} maxLength={500} multiline />
          {error ? <Notice kind="error">{error}</Notice> : null}
          <Btn kind="danger" title="Send report" onPress={send} busy={busy} />
        </>
      )}
    </Sheet>
  );
}
