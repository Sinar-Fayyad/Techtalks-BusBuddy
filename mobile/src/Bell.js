import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Sheet, C, Card, Row } from './ui';
import { call } from './net';
import { timeAgo } from './format';

const EMOJI = { boarded: '🚌', exited: '🏁', trip_started: '🟢', booking: '🎟️', cancelled: '⚠️', issue: '🚨', linked: '🔗', driver_status: '🪪' };

// Notification bell for the top bar (polls every 30 s).
export default function Bell({ token }) {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    const r = await call(token, '/notifications');
    if (r.ok) { setItems(r.data.notifications || []); setUnread(r.data.unread_count || 0); }
  }, [token]);
  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [load]);

  const markAll = async () => { await call(token, '/notifications/read', { method: 'POST', body: {} }); load(); };
  const markOne = async (n) => { if (!n.read_at) { await call(token, '/notifications/read', { method: 'POST', body: { id: n.id } }); load(); } };

  return (
    <>
      <Pressable onPress={() => { setOpen(true); load(); }} hitSlop={8}>
        <View style={{ width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: C.line, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="notifications-outline" size={22} color="#fff" />
          {unread > 0 ? (
            <View style={{ position: 'absolute', top: -3, right: -3, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: C.pink, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>{unread > 9 ? '9+' : unread}</Text>
            </View>
          ) : null}
        </View>
      </Pressable>
      <Sheet visible={open} title="Notifications" onClose={() => setOpen(false)}>
        {unread > 0 ? <Pressable onPress={markAll}><Text style={{ color: C.cyan, fontWeight: '800', marginBottom: 8 }}>Mark all read</Text></Pressable> : null}
        {items.length === 0 ? <Text style={{ color: C.dim, textAlign: 'center', marginVertical: 24 }}>No notifications yet.</Text> : items.map((n) => (
          <Pressable key={n.id} onPress={() => markOne(n)}>
            <Card style={{ padding: 10, opacity: n.read_at ? 0.7 : 1, borderColor: n.read_at ? 'transparent' : 'rgba(0,229,255,0.5)' }}>
              <Row gap={10} style={{ alignItems: 'flex-start' }}>
                <Text style={{ fontSize: 22 }}>{EMOJI[n.type] || '🔔'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#fff', fontWeight: '800' }}>{n.title}</Text>
                  <Text style={{ color: C.dim, fontSize: 13, marginTop: 2 }}>{n.body}</Text>
                  <Text style={{ color: C.faint, fontSize: 11, marginTop: 3 }}>{timeAgo(n.created_at)}</Text>
                </View>
              </Row>
            </Card>
          </Pressable>
        ))}
      </Sheet>
    </>
  );
}
