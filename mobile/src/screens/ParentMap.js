import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Screen, Title, Card, Row, T, Btn, Chip, Avatar, Segmented, Notice, KV, CardTitle, Skeleton } from '../ui';
import MapView from '../MapView';
import { useLiveChildren } from '../live';
import { useApp } from '../ctx';
import { fmtTime, timeAgo } from '../format';
import { Linking } from 'react-native';

export default function ParentMap({ params }) {
  const { token } = useApp();
  const { children, error } = useLiveChildren(token);
  const [selected, setSelected] = useState(params && params.child ? Number(params.child) : null);
  const all = children || [];
  const markers = useMemo(
    () => all.filter((c) => c.status === 'on_board' && c.trip && c.trip.latitude && c.trip.longitude).map((c) => ({ id: c.id, name: c.name, lat: Number(c.trip.latitude), lng: Number(c.trip.longitude) })),
    [children] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const sel = all.find((c) => c.id === selected) || all.find((c) => c.status === 'on_board') || all[0];
  const label = (c) => `${c.name.split(' ')[0]} · ${c.status === 'on_board' ? 'on the bus' : c.status === 'waiting' ? 'waiting' : c.status === 'arrived' ? 'arrived' : 'idle'}`;

  return (
    <Screen>
      <Title title="Live" highlight="Map" sub="Track your child’s bus in real time" />
      {error ? <Notice kind="error">{error}</Notice> : null}
      {children === null ? <Skeleton /> : all.length === 0 ? <Notice>Link a student first to see their rides on the map.</Notice> : (
        <>
          <Segmented value={sel ? sel.id : null} onChange={setSelected} items={all.map((c) => ({ value: c.id, label: label(c) }))} />
          <MapView markers={markers} selectedId={sel ? sel.id : null} onSelect={setSelected} height={320} />
          {markers.length === 0 ? <Notice>No child is on a bus right now. The map shows a child only while they are on board.</Notice> : null}
          {sel ? (
            <>
              <Card glow>
                <Row gap={12}><Avatar name={sel.name} size={54} /><View style={{ flex: 1 }}><T bold size={19}>{sel.name}</T><T dim small>{sel.university || 'Student'}</T></View><Chip status={sel.status} /></Row>
              </Card>
              {sel.status === 'on_board' && sel.trip ? (
                <>
                  <Card>
                    <CardTitle icon="navigate-outline">Trip details</CardTitle>
                    <KV k="Route" v={sel.trip.origin ? `${sel.trip.origin} → ${sel.trip.destination}` : '—'} />
                    <KV k="Boarded" v={fmtTime(sel.trip.boarded_at)} />
                    <KV k="Last update" v={sel.trip.location_updated_at ? timeAgo(sel.trip.location_updated_at) : 'Waiting for GPS'} />
                  </Card>
                  <Card>
                    <CardTitle icon="bus-outline">Driver</CardTitle>
                    <Row between><View><T bold>{sel.trip.driver_name}</T>{sel.trip.vehicle_plate ? <T dim small>Bus {sel.trip.vehicle_plate}</T> : null}</View>
                      {sel.trip.driver_phone ? <Btn small icon="call" title="Call" onPress={() => Linking.openURL(`tel:${sel.trip.driver_phone}`)} /> : null}</Row>
                  </Card>
                </>
              ) : null}
              {sel.status === 'waiting' ? <Notice>The trip has started, but {sel.name.split(' ')[0]} has not boarded yet. You will see the bus as soon as they scan in.</Notice> : null}
              {sel.status === 'arrived' && sel.trip ? <Notice kind="ok">Arrived at {fmtTime(sel.trip.exited_at || sel.trip.end_time)}. Location sharing has stopped.</Notice> : null}
              {sel.status === 'idle' ? <Notice>{sel.name.split(' ')[0]} is not on a trip right now.</Notice> : null}
              <Notice>Your child’s location is shared with you for this trip only.</Notice>
            </>
          ) : null}
        </>
      )}
    </Screen>
  );
}
