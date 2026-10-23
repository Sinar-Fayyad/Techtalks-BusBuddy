import React, { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, Pressable, Text, Linking } from 'react-native';
import { Screen, Title, Card, Row, T, Chip, Avatar, Field, Segmented, StatBox, Notice, Empty, Skeleton, C } from '../ui';
import { useApp } from '../ctx';
import { call, errOf } from '../net';
import { fmtDay, fmtTime } from '../format';

export default function DriverStudents({ params }) {
  const { token } = useApp();
  const [trips, setTrips] = useState(null);
  const [tripId, setTripId] = useState(null);
  const [rows, setRows] = useState(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const [t, a] = await Promise.all([call(token, '/driver/scheduled-trips'), call(token, '/driver/trips/active')]);
      if (!t.ok) return setError(errOf(t));
      const list = t.data.trips;
      setTrips(list);
      const fromParams = params && params.trip ? Number(params.trip) : 0;
      const running = a.ok && a.data.trip ? a.data.trip.scheduled_trip_id : null;
      const upcoming = [...list].filter((x) => x.status === 'upcoming').sort((x, y) => x.scheduled_at.localeCompare(y.scheduled_at))[0];
      setTripId((fromParams && (list.find((x) => x.id === fromParams) || {}).id) || running || (upcoming && upcoming.id) || (list[0] && list[0].id) || null);
    })();
  }, [token, params]);

  const loadRows = useCallback(async () => {
    if (!tripId) return setRows([]);
    const r = await call(token, `/driver/bookings?tripId=${tripId}`);
    if (r.ok) { setRows(r.data.bookings); setError(''); } else setError(errOf(r));
  }, [token, tripId]);
  const running = trips && (trips.find((t) => t.id === tripId) || {}).status === 'in_progress';
  useEffect(() => {
    loadRows();
    if (!running) return undefined;
    const id = setInterval(loadRows, 10000);
    return () => clearInterval(id);
  }, [loadRows, running]);

  const all = rows || [];
  const count = (s) => all.filter((b) => b.status === s).length;
  const shown = all.filter((b) => (status === 'all' || b.status === status) && (!q.trim() || `${b.student_name} ${b.student_phone || ''} ${b.pickup || ''}`.toLowerCase().includes(q.trim().toLowerCase())));

  return (
    <Screen refreshing={false} onRefresh={loadRows}>
      <Title highlight="Students" sub="Students booked on a trip and their status" />
      {error ? <Notice kind="error">{error}</Notice> : null}
      {trips && trips.length === 0 ? <Empty emoji="🧑‍🎓">No trips yet. Add a trip first; students can then book it.</Empty> : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            {(trips || []).map((t) => {
              const on = t.id === tripId;
              return (
                <Pressable key={t.id} onPress={() => setTripId(t.id)} style={{ marginRight: 8, padding: 10, borderRadius: 14, borderWidth: 1, borderColor: on ? C.cyan : C.line, backgroundColor: on ? 'rgba(0,229,255,0.15)' : 'rgba(255,255,255,0.05)', maxWidth: 220 }}>
                  <Text style={{ color: '#fff', fontWeight: '800' }} numberOfLines={1}>{t.origin} → {t.destination}</Text>
                  <Text style={{ color: C.dim, fontSize: 12 }}>{fmtDay(t.scheduled_at)} {fmtTime(t.scheduled_at)} · {t.booked_count} booked</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <Row wrap gap={10} style={{ marginBottom: 12 }}>
            <StatBox icon="people-outline" value={all.length} label="Total booked" onPress={() => setStatus('all')} />
            <StatBox icon="checkmark-circle-outline" value={count('on_board')} label="On board" tone="green" onPress={() => setStatus('on_board')} />
            <StatBox icon="time-outline" value={count('booked') + count('waiting')} label="Not yet picked up" tone="amber" />
            <StatBox icon="location-outline" value={count('exited')} label="Arrived" tone="violet" onPress={() => setStatus('exited')} />
          </Row>
          <Field icon="search-outline" placeholder="Search by name, phone or stop…" value={q} onChangeText={setQ} />
          <Segmented value={status} onChange={setStatus} items={[{ value: 'all', label: 'All' }, { value: 'booked', label: 'Booked' }, { value: 'waiting', label: 'Waiting' }, { value: 'on_board', label: 'On board' }, { value: 'exited', label: 'Arrived' }, { value: 'no_show', label: 'No show' }]} />
          {rows === null ? <Skeleton /> : shown.length === 0 ? <Empty emoji="🧑‍🎓">{all.length === 0 ? 'Nobody booked this trip yet.' : 'No students match your filters.'}</Empty> : shown.map((b) => (
            <Card key={b.id}>
              <Row between>
                <Row gap={12} style={{ flex: 1 }}><Avatar name={b.student_name} size={44} /><View style={{ flex: 1 }}><T bold size={16}>{b.student_name}</T><T dim small>{b.student_university || 'Student'}</T></View></Row>
                <Chip status={b.status} />
              </Row>
              <T dim small style={{ marginTop: 6 }}>Pickup: {b.pickup || '—'}</T>
              {b.student_phone ? <Pressable onPress={() => Linking.openURL(`tel:${b.student_phone}`)}><Text style={{ color: C.cyan, marginTop: 2 }}>📞 {b.student_phone}</Text></Pressable> : null}
            </Card>
          ))}
        </>
      )}
    </Screen>
  );
}
