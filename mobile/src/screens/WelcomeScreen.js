// mobile/src/screens/WelcomeScreen.js
//
// Welcome / onboarding screen matching the BusBuddy design.
// Uses only Expo-bundled deps: expo-linear-gradient, expo-status-bar, @expo/vector-icons.

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  SafeAreaView,
  StatusBar as RNStatusBar,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const ROLES = [
  { icon: 'speedometer-outline', label: 'Drivers', sub: 'get organized' },
  { icon: 'people-outline', label: 'Students', sub: 'travel safely' },
  { icon: 'shield-checkmark-outline', label: 'Parents', sub: 'track in real time' },
];

export default function WelcomeScreen({ onGetStarted = () => {}, onLogin = () => {} }) {
  return (
    <LinearGradient
      colors={['#2af0e6', '#18bdf2', '#5566f0', '#9438ec', '#c72fe6', '#4a0d6b', '#2b0736']}
      locations={[0, 0.13, 0.29, 0.45, 0.6, 0.82, 1]}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.6, y: 1 }}
      style={s.flex}
    >
      <StatusBar style="dark" />

      <SafeAreaView style={s.flex}>
        <ScrollView
          contentContainerStyle={[
            s.scroll,
            { paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) + 12 : 20 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Pin logo ─────────────────────────────────────────────── */}
          <View style={s.pinWrap}>
            <View style={s.pinBody}>
              <Ionicons name="bus" size={38} color="#5312c8" />
            </View>
            <View style={s.pinTip} />
          </View>

          {/* ── Wordmark ─────────────────────────────────────────────── */}
          <Text style={s.wordmark}>
            <Text style={s.wordBus}>Bus</Text>
            <Text style={s.wordBuddy}>Buddy</Text>
          </Text>

          <Text style={s.tagline}>Safe Rides. Connected Families.</Text>
          <Text style={s.blurb}>
            We connect drivers to students and keep parents informed with real-time location
            tracking.
          </Text>

          {/* ── Roles ────────────────────────────────────────────────── */}
          <View style={s.roles}>
            {ROLES.map((r, i) => (
              <React.Fragment key={r.label}>
                {i > 0 && <View style={s.roleDivider} />}
                <View style={s.role}>
                  <Ionicons name={r.icon} size={32} color="#1ef0f0" />
                  <Text style={s.roleLabel}>{r.label}</Text>
                  <Text style={s.roleSub}>{r.sub}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>

          {/* ── Hero illustration ────────────────────────────────────── */}
          <View style={s.hero}>
            <View style={s.heroGlow} />

            {/* notification card */}
            <View style={s.card}>
              <View style={s.avatar}>
                <Ionicons name="person" size={16} color="#cfd7ff" />
              </View>
              <View style={s.flex}>
                <Text style={s.cardTitle}>Bus 12</Text>
                <Text style={s.cardSub}>On time • 2 min away</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#8f9bd4" />
            </View>

            {/* bus */}
            <View style={s.bus}>
              <View style={s.busRoof} />
              <View style={s.busWindows}>
                {[0, 1, 2, 3].map((k) => (
                  <View key={k} style={s.busWindow} />
                ))}
              </View>
              <View style={s.busLights}>
                <View style={s.busLight} />
                <View style={s.busLight} />
              </View>
              <View style={s.busWheels}>
                <View style={s.wheel} />
                <View style={s.wheel} />
              </View>
            </View>

            {/* phone with map + pin */}
            <View style={s.phone}>
              <View style={s.mapGrid}>
                <View style={s.mapLineH} />
                <View style={s.mapLineH2} />
                <View style={s.mapLineV} />
              </View>
              <View style={s.mapPin}>
                <Ionicons name="location" size={26} color="#d24bff" />
              </View>
            </View>

            <View style={s.dotted}>
              <View style={s.dot} />
              <View style={s.dot} />
              <View style={s.dot} />
            </View>
          </View>

          {/* ── CTA ──────────────────────────────────────────────────── */}
          <Pressable
            onPress={onGetStarted}
            android_ripple={{ color: 'rgba(255,255,255,0.25)' }}
            style={({ pressed }) => [s.ctaWrap, pressed && s.ctaPressed]}
          >
            <LinearGradient
              colors={['#2bf0dd', '#5a4ff0', '#c22ff0']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={s.cta}
            >
              <Text style={s.ctaText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={22} color="#ffffff" style={{ marginLeft: 10 }} />
            </LinearGradient>
          </Pressable>

          {/* ── Footer ───────────────────────────────────────────────── */}
          <View style={s.footer}>
            <Text style={s.footerText}>Already have an account? </Text>
            <Pressable onPress={onLogin} hitSlop={10}>
              <Text style={s.footerLink}>Log in</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingBottom: 28,
  },

  pinWrap: { alignItems: 'center', marginTop: 4 },
  pinBody: {
    width: 108,
    height: 108,
    borderRadius: 34,
    borderWidth: 4,
    borderColor: '#5312c8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  pinTip: {
    width: 24,
    height: 24,
    marginTop: -14,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderColor: '#5312c8',
    transform: [{ rotate: '45deg' }],
    backgroundColor: 'rgba(255,255,255,0.10)',
  },

  wordmark: { marginTop: 22, fontSize: 44, fontWeight: '800', letterSpacing: 0.5 },
  wordBus: { color: '#5a16cf' },
  wordBuddy: { color: '#25f0e4' },

  tagline: {
    marginTop: 14,
    marginBottom: 14,
    fontSize: 19,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  blurb: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.92)',
    textAlign: 'center',
    maxWidth: 320,
  },

  roles: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 26,
    marginBottom: 18,
    width: '100%',
    maxWidth: 360,
  },
  role: { flex: 1, alignItems: 'center' },
  roleDivider: { width: 1, height: 46, backgroundColor: 'rgba(255,255,255,0.28)', marginTop: 6 },
  roleLabel: { marginTop: 8, fontSize: 14, fontWeight: '700', color: '#ffffff' },
  roleSub: { marginTop: 3, fontSize: 11, color: 'rgba(255,255,255,0.82)', textAlign: 'center' },

  hero: {
    width: '100%',
    maxWidth: 360,
    height: 210,
    marginTop: 6,
    marginBottom: 18,
    justifyContent: 'flex-end',
  },
  heroGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 30,
    height: 150,
    borderRadius: 90,
    backgroundColor: 'rgba(150,40,220,0.35)',
  },

  card: {
    position: 'absolute',
    top: 0,
    left: 10,
    right: 70,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(38,16,72,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(180,120,255,0.35)',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  cardTitle: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  cardSub: { color: '#b9b3e0', fontSize: 11, marginTop: 2 },

  bus: {
    position: 'absolute',
    left: 0,
    bottom: 12,
    width: 170,
    height: 104,
    borderRadius: 14,
    backgroundColor: '#3b1f7a',
    borderWidth: 2,
    borderColor: 'rgba(120,180,255,0.55)',
    overflow: 'hidden',
  },
  busRoof: { height: 12, backgroundColor: 'rgba(120,200,255,0.35)' },
  busWindows: { flexDirection: 'row', paddingHorizontal: 10, paddingTop: 10 },
  busWindow: {
    flex: 1,
    height: 34,
    marginHorizontal: 3,
    borderRadius: 4,
    backgroundColor: 'rgba(90,140,255,0.45)',
  },
  busLights: {
    position: 'absolute',
    bottom: 16,
    left: 6,
    right: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  busLight: { width: 16, height: 7, borderRadius: 4, backgroundColor: '#eaffff' },
  busWheels: {
    position: 'absolute',
    bottom: -8,
    left: 18,
    right: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  wheel: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#120a26' },

  phone: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 96,
    height: 170,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(140,200,255,0.7)',
    backgroundColor: 'rgba(24,12,48,0.95)',
    overflow: 'hidden',
  },
  mapGrid: { flex: 1 },
  mapLineH: {
    position: 'absolute',
    left: 10,
    right: 10,
    top: 46,
    height: 1,
    backgroundColor: 'rgba(120,160,255,0.35)',
  },
  mapLineH2: {
    position: 'absolute',
    left: 10,
    right: 10,
    top: 104,
    height: 1,
    backgroundColor: 'rgba(120,160,255,0.35)',
  },
  mapLineV: {
    position: 'absolute',
    top: 12,
    bottom: 12,
    left: 46,
    width: 1,
    backgroundColor: 'rgba(120,160,255,0.35)',
  },
  mapPin: { position: 'absolute', top: 44, left: 34 },

  dotted: {
    position: 'absolute',
    right: 108,
    bottom: 108,
    flexDirection: 'row',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginHorizontal: 3,
    backgroundColor: 'rgba(255,255,255,0.75)',
  },

  ctaWrap: { width: '100%', maxWidth: 360, borderRadius: 30, overflow: 'hidden' },
  ctaPressed: { opacity: 0.88 },
  cta: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
  },
  ctaText: { color: '#ffffff', fontSize: 18, fontWeight: '700', letterSpacing: 0.3 },

  footer: { flexDirection: 'row', alignItems: 'center', marginTop: 18 },
  footerText: { color: 'rgba(255,255,255,0.85)', fontSize: 14 },
  footerLink: { color: '#30f0e0', fontSize: 14, fontWeight: '700' },
});
