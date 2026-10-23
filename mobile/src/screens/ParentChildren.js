import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import { Screen, Title, Card, Row, T, Btn, Chip, Avatar, Field, Segmented, StatBox, Notice, Empty, Skeleton } from '../ui';
import { useLiveChildren } from '../live';
import { useApp } from '../ctx';
import { call, errOf } from '../net';

export default function ParentChildren({ nav }) {
  const { token } = useApp();
  const { children, error, reload } = useLiveChildren(token);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [err2, setErr2] = useState('');
  const [notice, setNotice] = useState('');
  const all = children || [];
  const shown = all.filter((c) => (status === 'all' || c.status === status) && (!q.trim() || `${c.name} ${c.university || ''}`.toLowerCase().includes(q.trim().toLowerCase())));

  function unlink(c) {
    Alert.alert('Unlink', `Unlink ${c.name}? You will stop seeing their rides.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Unlink', style: 'destructive', onPress: async () => {
        const r = await call(token, `/parents/me/children/${c.id}`, { method: 'DELETE' });
        if (!r.ok) return setErr2(errOf(r));
        setNotice(`${c.name} was unlinked.`); reload();
      } },
    ]);
  }
  return (
    <Screen refreshing={false} onRefresh={reload}>
      <Title highlight="Children" title="My" sub="Manage your children and track their rides" />
      {error || err2 ? <Notice kind="error">{error || err2}</Notice> : null}
      {notice ? <Notice kind="ok">{notice}</Notice> : null}
      <Row wrap gap={10} style={{ marginBottom: 12 }}>
        <StatBox icon="people-outline" value={all.length} label="Total" />
        <StatBox icon="bus-outline" value={all.filter((c) => c.status === 'on_board').length} label="On the bus" tone="green" onPress={() => setStatus('on_board')} />
        <StatBox icon="time-outline" value={all.filter((c) => c.status === 'waiting').length} label="Waiting" tone="amber" onPress={() => setStatus('waiting')} />
        <StatBox icon="checkmark-circle-outline" value={all.filter((c) => c.status === 'idle' || c.status === 'arrived').length} label="Not travelling" tone="violet" onPress={() => setStatus('all')} />
      </Row>
      <Field icon="search-outline" placeholder="Search by name or university…" value={q} onChangeText={setQ} />
      <Segmented value={status} onChange={setStatus} items={[{ value: 'all', label: 'All' }, { value: 'on_board', label: 'On the bus' }, { value: 'waiting', label: 'Waiting' }, { value: 'arrived', label: 'Arrived' }, { value: 'idle', label: 'Idle' }]} />
      {children === null ? <Skeleton /> : all.length === 0 ? <Empty emoji="🔗">No child is linked yet.</Empty> : shown.length === 0 ? <Empty emoji="🔎">No children match.</Empty> : shown.map((c) => (
        <Card key={c.id}>
          <Row between>
            <Row gap={12} style={{ flex: 1 }}><Avatar name={c.name} size={46} /><View style={{ flex: 1 }}><T bold size={16}>{c.name}</T><T dim small>{c.university || 'Student'}</T></View></Row>
            <Chip status={c.status} />
          </Row>
          {c.trip ? <T dim small style={{ marginTop: 6 }}>{c.trip.origin ? `${c.trip.origin} → ${c.trip.destination}` : 'Trip'} · Driver {c.trip.driver_name}</T> : null}
          <Row gap={8} style={{ marginTop: 10 }}>
            <Btn small icon="location-outline" title="View on map" onPress={() => nav.go('map', { child: c.id })} />
            <Btn small kind="danger" icon="trash-outline" title="Unlink" onPress={() => unlink(c)} />
          </Row>
        </Card>
      ))}
      <Btn kind="ghost" icon="add" title="Link Another Child" onPress={() => nav.push('link')} />
    </Screen>
  );
}
