import React, { useCallback, useEffect, useState } from 'react';
import { View, Alert } from 'react-native';
import { Screen, Title, Card, Row, T, Btn, Chip, Field, Segmented, StatBox, Notice, Empty, Skeleton } from '../ui';
import { TripFormSheet } from '../driverParts';
import { useApp } from '../ctx';
import { call, errOf } from '../net';
import { fmtDay, fmtTime, money } from '../format';

export default function DriverTrips({ nav }) {
  const { token } = useApp();
  const [trips, setTrips] = useState(null);
  const [counts, setCounts] = useState({ total: 0, upcoming: 0, completed: 0, cancelled: 0 });
  const [profile, setProfile] = useState(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState(null); // { trip? }
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [t, p] = await Promise.all([call(token, '/driver/scheduled-trips'), call(token, '/driver/me')]);
    if (t.ok) { setTrips(t.data.trips); setCounts(t.data.counts); setError(''); } else setError(errOf(t));
    if (p.ok) setProfile(p.data.driver);
  }, [token]);
  useEffect(() => { load(); }, [load]);

  function cancelTrip(t) {
    const warn = t.booked_count > 0 ? ` ${t.booked_count} student(s) booked it and will be notified.` : '';
    Alert.alert('Cancel trip', `Cancel ${t.origin} → ${t.destination}?${warn}`, [
      { text: 'Keep it', style: 'cancel' },
      { text: 'Cancel trip', style: 'destructive', onPress: async () => {
        const r = await call(token, `/driver/scheduled-trips/${t.id}`, { method: 'PATCH', body: { cancelled: true } });
        if (!r.ok) return setError(errOf(r));
        setNotice('Trip cancelled.'); load();
      } },
    ]);
  }
  function deleteTrip(t) {
    Alert.alert('Delete trip', `Delete ${t.origin} → ${t.destination}? This cannot be undone.`, [
      { text: 'Keep it', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const r = await call(token, `/driver/scheduled-trips/${t.id}`, { method: 'DELETE' });
        if (!r.ok) return setError(errOf(r));
        setNotice('Trip deleted.'); load();
      } },
    ]);
  }
  async function refresh() { setRefreshing(true); await load(); setRefreshing(false); }

  const verified = profile && profile.status === 'verified';
  const shown = (trips || []).filter((t) => (status === 'all' || t.status === status) && (!q.trim() || `${t.origin} ${t.destination}`.toLowerCase().includes(q.trim().toLowerCase())));

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <Row between style={{ marginBottom: 4 }}>
        <Title highlight="Trips" sub="Manage your routes and trip history" />
        {verified ? <Btn small icon="add" title="Add" onPress={() => setForm({})} /> : null}
      </Row>
      {error ? <Notice kind="error">{error}</Notice> : null}
      {notice ? <Notice kind="ok">{notice}</Notice> : null}
      {profile && !verified ? <Notice>You can add trips after an admin verifies your license.</Notice> : null}
      <Row wrap gap={10} style={{ marginBottom: 12 }}>
        <StatBox icon="bus-outline" value={counts.total} label="Total trips" />
        <StatBox icon="checkmark-circle-outline" value={counts.completed} label="Completed" tone="green" onPress={() => setStatus('completed')} />
        <StatBox icon="time-outline" value={counts.upcoming} label="Upcoming" onPress={() => setStatus('upcoming')} />
        <StatBox icon="close-circle-outline" value={counts.cancelled} label="Cancelled" tone="pink" onPress={() => setStatus('cancelled')} />
      </Row>
      <Field icon="search-outline" placeholder="Search trips…" value={q} onChangeText={setQ} />
      <Segmented value={status} onChange={setStatus} items={[{ value: 'all', label: 'All' }, { value: 'upcoming', label: 'Upcoming' }, { value: 'in_progress', label: 'Running' }, { value: 'completed', label: 'Completed' }, { value: 'cancelled', label: 'Cancelled' }]} />
      {trips === null ? <Skeleton /> : shown.length === 0 ? <Empty emoji="🗓️">{trips.length === 0 ? 'No trips yet.' : 'No trips match your filters.'}</Empty> : shown.map((t) => (
        <Card key={t.id}>
          <Row between><T bold size={16} style={{ flex: 1 }}>{t.origin} → {t.destination}</T><Chip status={t.status} /></Row>
          <T dim small style={{ marginTop: 4 }}>{fmtDay(t.scheduled_at)} · {fmtTime(t.scheduled_at)} · {money(t.price)} · {t.booked_count}/{t.seats} students</T>
          <Row wrap gap={8} style={{ marginTop: 10 }}>
            <Btn small kind="ghost" icon="people-outline" title="Students" onPress={() => nav.go('students', { trip: t.id })} />
            {t.status === 'upcoming' ? (
              <>
                <Btn small kind="ghost" icon="pencil" title="Edit" onPress={() => setForm({ trip: t })} />
                {t.booked_count === 0 ? <Btn small kind="danger" icon="trash-outline" title="Delete" onPress={() => deleteTrip(t)} /> : <Btn small kind="danger" icon="close" title="Cancel" onPress={() => cancelTrip(t)} />}
              </>
            ) : null}
          </Row>
        </Card>
      ))}
      {form ? <TripFormSheet token={token} trip={form.trip} defaults={{ seats: profile && profile.seats, price: profile && profile.price }} onClose={() => setForm(null)} onSaved={(m) => { setNotice(m); load(); }} /> : null}
    </Screen>
  );
}
