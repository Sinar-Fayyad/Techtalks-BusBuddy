import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen, Card, Row, T, Btn, Chip, Avatar, Notice, Empty, Skeleton, C, GRAD } from '../ui';
import { useLiveChildren } from '../live';
import { useApp } from '../ctx';
import { firstName, fmtTime } from '../format';

export default function ParentHome({ nav }) {
  const { token, me } = useApp();
  const { children, error, reload } = useLiveChildren(token);
  const [refreshing, setRefreshing] = useState(false);
  const onBus = (children || []).filter((c) => c.status === 'on_board');
  const h = new Date().getHours();
  async function refresh() { setRefreshing(true); await reload(); setRefreshing(false); }

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <T dim>{h < 12 ? 'Good Morning,' : h < 18 ? 'Good Afternoon,' : 'Good Evening,'}</T>
      <Text style={{ color: '#fff', fontSize: 30, fontWeight: '800' }}>{firstName(me.name)} 👋</Text>
      <T dim style={{ marginBottom: 12 }}>Your children are safe with us.</T>
      {error ? <Notice kind="error">{error}</Notice> : null}

      <Card onPress={() => nav.go('map')} glow style={{ padding: 0, overflow: 'hidden' }}>
        <LinearGradient colors={onBus.length ? ['rgba(0,229,255,0.6)', 'rgba(122,44,255,0.6)', 'rgba(255,43,214,0.5)'] : ['transparent', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ padding: 16 }}>
          <Row gap={14}>
            <Ionicons name="shield-checkmark" size={40} color="#fff" />
            <View style={{ flex: 1 }}>
              <T bold size={20}>{onBus.length ? 'Tracking Active' : 'No child is travelling'}</T>
              <T dim>{onBus.length ? `${onBus.length} ${onBus.length === 1 ? 'child' : 'children'} on the bus` : 'Live tracking appears when a ride starts.'}</T>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#fff" />
          </Row>
        </LinearGradient>
      </Card>

      <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800', marginVertical: 8 }}>My Children</Text>
      {children === null ? <Skeleton /> : children.length === 0 ? (
        <Empty emoji="🔗">No child is linked yet. Ask your child to create a link code in their BusBuddy profile.</Empty>
      ) : children.map((c) => (
        <Card key={c.id} onPress={() => nav.go('map', { child: c.id })}>
          <Row between>
            <Row gap={12} style={{ flex: 1 }}>
              <Avatar name={c.name} size={50} />
              <View style={{ flex: 1 }}><T bold size={16}>{c.name}</T><T dim small>{c.university || 'Student'}</T></View>
            </Row>
            <Chip status={c.status} />
          </Row>
          <Row gap={6} style={{ marginTop: 8 }}>
            <Ionicons name="location-outline" size={15} color={C.dim} />
            <T dim small>{c.status === 'idle' || !c.trip ? 'Not travelling' : c.status === 'arrived' ? `Arrived at ${fmtTime(c.trip.exited_at || c.trip.end_time)}` : `${c.trip.origin || 'Trip'} → ${c.trip.destination || ''}`}</T>
          </Row>
        </Card>
      ))}

      <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800', marginVertical: 8 }}>Quick Actions</Text>
      <Row gap={10}>
        {[['link-outline', 'Link Student', () => nav.push('link')], ['location-outline', 'View Map', () => nav.go('map')], ['people-outline', 'Children', () => nav.go('children')]].map(([icon, label, fn]) => (
          <Card key={label} onPress={fn} style={{ flex: 1, alignItems: 'center', padding: 12, marginBottom: 0 }}>
            <Ionicons name={icon} size={26} color={C.cyan} /><T small bold style={{ marginTop: 4, textAlign: 'center' }}>{label}</T>
          </Card>
        ))}
      </Row>
    </Screen>
  );
}
