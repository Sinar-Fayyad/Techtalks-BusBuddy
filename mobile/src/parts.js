// Pieces used by several screens: trip card, booking sheet, change password, profile edit.
import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Row, T, Btn, Chip, Avatar, Field, Sheet, Notice, C } from './ui';
import { call, errOf } from './net';
import { fmtDay, fmtTime, money, parseStops, phoneOk, PHONE_HINT } from './format';

export function TripCard({ trip, onBook }) {
  const stops = parseStops(trip.stops);
  const full = trip.seats_left <= 0;
  return (
    <Card>
      <Row gap={12}>
        <Avatar name={trip.driver_name} size={48} />
        <View style={{ flex: 1 }}>
          <T bold>{trip.driver_name}</T>
          {trip.vehicle_plate ? <T dim small>Bus {trip.vehicle_plate}</T> : null}
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <T bold size={20}>{money(trip.price)}</T>
          <T dim small>per ride</T>
        </View>
      </Row>
      <Row gap={6} style={{ marginTop: 10 }}>
        <Ionicons name="time-outline" size={15} color={C.cyan} />
        <T small color={C.cyan} bold>{fmtDay(trip.scheduled_at)} · {fmtTime(trip.scheduled_at)}</T>
      </Row>
      <T bold size={17} style={{ marginTop: 2 }}>{trip.origin} → {trip.destination}</T>
      {stops.length > 0 ? (
        <View style={{ marginTop: 6 }}>
          {stops.slice(0, 4).map((x, i) => (
            <Row key={i} gap={8} style={{ marginBottom: 2 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.cyan }} />
              <T small dim>{x.name}{x.time ? ` · ${x.time}` : ''}</T>
            </Row>
          ))}
        </View>
      ) : null}
      <Row between style={{ marginTop: 12 }}>
        <Row gap={6}><Ionicons name="people-outline" size={16} color={C.dim} /><T small dim>{full ? 'Full' : `${trip.seats_left} seat${trip.seats_left === 1 ? '' : 's'} left`}</T></Row>
        {trip.booked ? <Chip label="Booked ✓" tone="green" /> : <Btn small title={full ? 'Full' : 'Book Ride'} disabled={full} onPress={() => onBook(trip)} />}
      </Row>
    </Card>
  );
}

export function BookSheet({ trip, token, onClose, onBooked }) {
  const [pickup, setPickup] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!trip) return null;
  const stops = parseStops(trip.stops);

  async function confirm() {
    setBusy(true);
    setError('');
    const r = await call(token, '/bookings', { method: 'POST', body: { scheduledTripId: trip.id, pickup: pickup.trim() || undefined } });
    setBusy(false);
    if (!r.ok) {
      setError(errOf(r));
      if (r.status === 409) setTimeout(onBooked, 1200);
      return;
    }
    onBooked();
    onClose();
  }
  return (
    <Sheet visible title="Book this ride" onClose={onClose}>
      <T bold size={18}>{trip.origin} → {trip.destination}</T>
      <T dim small>{fmtDay(trip.scheduled_at)} · {fmtTime(trip.scheduled_at)} · {money(trip.price)} per ride</T>
      <T dim small style={{ marginBottom: 12 }}>Driver: {trip.driver_name}{trip.vehicle_plate ? ` · Bus ${trip.vehicle_plate}` : ''}</T>
      <Field icon="location-outline" label="Pickup stop (optional)" placeholder="Where should the driver pick you up?" value={pickup} onChangeText={setPickup} maxLength={255} />
      {stops.length > 0 ? (
        <Row wrap gap={6} style={{ marginBottom: 12 }}>
          {stops.map((x, i) => <Chip key={i} label={x.name} onPress={() => setPickup(x.name)} />)}
        </Row>
      ) : null}
      {error ? <Notice kind="error">{error}</Notice> : null}
      <Btn title="Confirm booking" onPress={confirm} busy={busy} />
    </Sheet>
  );
}

export function ChangePasswordCard({ token }) {
  const [cur, setCur] = useState('');
  const [nw, setNw] = useState('');
  const [conf, setConf] = useState('');
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setMsg(null);
    const v = {};
    if (!cur) v.cur = 'Enter your current password';
    if (nw.length < 8) v.nw = 'New password must be at least 8 characters';
    if (conf !== nw) v.conf = 'Passwords do not match';
    setErrors(v);
    if (Object.keys(v).length) return;
    setBusy(true);
    const r = await call(token, '/auth/change-password', { method: 'POST', body: { currentPassword: cur, newPassword: nw } });
    setBusy(false);
    if (!r.ok) return setMsg({ kind: 'error', text: errOf(r) });
    setMsg({ kind: 'ok', text: 'Password changed.' });
    setCur(''); setNw(''); setConf('');
  }
  return (
    <Card>
      <Row gap={8} style={{ marginBottom: 10 }}><Ionicons name="lock-closed-outline" size={19} color={C.cyan} /><T bold size={16}>Change password</T></Row>
      <Field icon="lock-closed-outline" secure placeholder="Current password" value={cur} onChangeText={setCur} error={errors.cur} />
      <Field icon="lock-closed-outline" secure placeholder="New password (min 8 characters)" value={nw} onChangeText={setNw} error={errors.nw} />
      <Field icon="lock-closed-outline" secure placeholder="Confirm new password" value={conf} onChangeText={setConf} error={errors.conf} />
      {msg ? <Notice kind={msg.kind}>{msg.text}</Notice> : null}
      <Btn title="Update password" onPress={submit} busy={busy} />
    </Card>
  );
}

// edit name / phone (+ university for students) through PATCH /auth/me
export function EditProfileSheet({ me, token, onClose, onSaved, asDriver }) {
  const [name, setName] = useState(me.name || '');
  const [phone, setPhone] = useState(me.phone || '');
  const [uni, setUni] = useState(me.university || '');
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function save() {
    const v = {};
    if (name.trim().length < 2) v.name = 'Enter your full name';
    if (!phoneOk(phone)) v.phone = `Enter a valid phone number, e.g. ${PHONE_HINT}`;
    if (me.role === 'student' && !uni.trim()) v.uni = 'Enter your university';
    setErrors(v);
    if (Object.keys(v).length) return;
    setBusy(true);
    const body = { name: name.trim(), phone: phone.trim(), ...(me.role === 'student' ? { university: uni.trim() } : {}) };
    const r = await call(token, asDriver ? '/driver/me' : '/auth/me', { method: 'PATCH', body: asDriver ? { name: body.name, phone: body.phone } : body });
    setBusy(false);
    if (!r.ok) return setError(errOf(r));
    onSaved();
  }
  return (
    <Sheet visible title="Edit profile" onClose={onClose}>
      <Field icon="person-outline" label="Full name" value={name} onChangeText={setName} error={errors.name} autoCapitalize="words" />
      <Field icon="call-outline" label="Phone" value={phone} onChangeText={setPhone} error={errors.phone} keyboardType="phone-pad" />
      {me.role === 'student' ? <Field icon="school-outline" label="University" value={uni} onChangeText={setUni} error={errors.uni} autoCapitalize="words" /> : null}
      {error ? <Notice kind="error">{error}</Notice> : null}
      <Btn title="Save" onPress={save} busy={busy} />
    </Sheet>
  );
}
