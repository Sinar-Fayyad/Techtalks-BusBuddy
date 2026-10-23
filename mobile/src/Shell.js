import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, BackHandler, SafeAreaView, Platform, StatusBar as RNStatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppCtx } from './ctx';
import { call } from './net';
import Bell from './Bell';
import { Avatar, C, GRAD, Row } from './ui';

import StudentHome from './screens/StudentHome';
import StudentBookings from './screens/StudentBookings';
import StudentScan from './screens/StudentScan';
import StudentProfile from './screens/StudentProfile';
import SettingsScreen from './screens/SettingsScreen';
import ParentHome from './screens/ParentHome';
import ParentChildren from './screens/ParentChildren';
import ParentMap from './screens/ParentMap';
import ParentLink from './screens/ParentLink';
import ParentProfile from './screens/ParentProfile';
import DriverHome from './screens/DriverHome';
import DriverTrips from './screens/DriverTrips';
import DriverStudents from './screens/DriverStudents';
import DriverProfile from './screens/DriverProfile';

const TABS = {
  student: [
    { k: 'home', l: 'Home', i: 'home', S: StudentHome },
    { k: 'bookings', l: 'Bookings', i: 'calendar', S: StudentBookings },
    { k: 'scan', l: 'Scan', i: 'qr-code', S: StudentScan, center: true },
    { k: 'settings', l: 'Settings', i: 'settings', S: SettingsScreen },
    { k: 'profile', l: 'Profile', i: 'person', S: StudentProfile },
  ],
  parent: [
    { k: 'home', l: 'Home', i: 'home', S: ParentHome },
    { k: 'children', l: 'Children', i: 'people', S: ParentChildren },
    { k: 'map', l: 'Live Map', i: 'location', S: ParentMap },
    { k: 'profile', l: 'Profile', i: 'person', S: ParentProfile },
  ],
  driver: [
    { k: 'home', l: 'Home', i: 'home', S: DriverHome },
    { k: 'trips', l: 'Trips', i: 'bus', S: DriverTrips },
    { k: 'students', l: 'Students', i: 'people', S: DriverStudents },
    { k: 'profile', l: 'Profile', i: 'person', S: DriverProfile },
  ],
};
const EXTRA = { link: ParentLink };

export default function Shell({ token, role, onLogout }) {
  const tabs = TABS[role] || TABS.student;
  const [tab, setTab] = useState('home');
  const [params, setParams] = useState({});
  const [extra, setExtra] = useState(null); // { name, params }
  const [me, setMe] = useState(null);
  const top = Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) : 0;

  const refreshMe = useCallback(async () => {
    const r = await call(token, '/auth/me');
    if (r.ok) setMe(r.data.user);
    else if (r.status === 401) onLogout();
  }, [token, onLogout]);
  useEffect(() => { refreshMe(); }, [refreshMe]);

  const nav = {
    go: (k, p) => { setExtra(null); setParams(p || {}); setTab(k); },
    push: (name, p) => setExtra({ name, params: p || {} }),
    back: () => setExtra(null),
  };

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (extra) { setExtra(null); return true; }
      if (tab !== 'home') { setTab('home'); setParams({}); return true; }
      return false;
    });
    return () => sub.remove();
  }, [extra, tab]);

  if (!me) {
    return <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator size="large" color={C.cyan} /></View>;
  }

  const current = tabs.find((t) => t.k === tab) || tabs[0];
  const Body = extra ? EXTRA[extra.name] : current.S;
  const bodyParams = extra ? extra.params : params;

  return (
    <AppCtx.Provider value={{ token, role, me, refreshMe, logout: onLogout }}>
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <LinearGradient colors={['#050b3a', '#0a1a8a']} style={{ paddingTop: top + 6, paddingBottom: 8, paddingHorizontal: 16 }}>
          <SafeAreaView>
            <Row between>
              <Row gap={8}>
                {extra ? (
                  <Pressable onPress={() => setExtra(null)} hitSlop={10}><Ionicons name="chevron-back" size={26} color="#fff" /></Pressable>
                ) : null}
                <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800' }}>
                  {extra ? 'Link Student' : current.l === 'Home' ? <Text>Bus<Text style={{ color: C.cyan }}>Buddy</Text></Text> : current.l}
                </Text>
              </Row>
              <Row gap={10}>
                <Bell token={token} />
                <Avatar name={me.name} size={40} />
              </Row>
            </Row>
          </SafeAreaView>
        </LinearGradient>

        <View style={{ flex: 1 }}>
          <Body key={`${extra ? extra.name : current.k}`} nav={nav} params={bodyParams} />
        </View>

        <View style={{ flexDirection: 'row', backgroundColor: '#080f55', borderTopWidth: 1, borderTopColor: C.line, paddingBottom: Platform.OS === 'ios' ? 18 : 6, paddingTop: 6 }}>
          {tabs.map((t) => {
            const on = !extra && t.k === current.k;
            if (t.center) {
              return (
                <Pressable key={t.k} onPress={() => nav.go(t.k)} style={{ flex: 1, alignItems: 'center' }}>
                  <LinearGradient colors={GRAD} style={{ width: 58, height: 58, borderRadius: 29, marginTop: -26, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#080f55' }}>
                    <Ionicons name={t.i} size={28} color="#fff" />
                  </LinearGradient>
                  <Text style={{ color: on ? C.cyan : C.dim, fontSize: 11, fontWeight: '700', marginTop: 2 }}>{t.l}</Text>
                </Pressable>
              );
            }
            return (
              <Pressable key={t.k} onPress={() => nav.go(t.k)} style={{ flex: 1, alignItems: 'center', paddingVertical: 2 }}>
                <Ionicons name={on ? t.i : `${t.i}-outline`} size={23} color={on ? C.cyan : C.dim} />
                <Text style={{ color: on ? C.cyan : C.dim, fontSize: 11, fontWeight: '700', marginTop: 2 }}>{t.l}</Text>
                {on ? <View style={{ height: 3, width: 22, borderRadius: 2, backgroundColor: C.cyan, marginTop: 2 }} /> : null}
              </Pressable>
            );
          })}
        </View>
      </View>
    </AppCtx.Provider>
  );
}
