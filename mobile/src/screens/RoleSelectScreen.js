// mobile/src/screens/RoleSelectScreen.js
// "Choose Your Role" — the BusBuddy role picker, adapted to a phone layout.

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar as RNStatusBar,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const BG = ['#1de6f4', '#1e9df7', '#5b5df8', '#8b3ff0', '#c23ff0'];
const BG_LOC = [0, 0.2, 0.44, 0.7, 1];
const CTA = ['#25f0e0', '#5a4ff0', '#c22ff0'];

const ROLES = [
  { id: 'student', icon: 'school', title: 'Student', sub: 'Ride to campus and beyond' },
  { id: 'parent', icon: 'people', title: 'Parent', sub: 'Keep your loved ones safe' },
  { id: 'driver', icon: 'bus', title: 'Driver', sub: 'Drive. Earn. Make a difference' },
];

export default function RoleSelectScreen({ onContinue = () => {}, onBack = () => {} }) {
  const [role, setRole] = useState(null);
  const [hint, setHint] = useState('');

  const pressContinue = () => {
    if (!role) {
      setHint('Select a role to continue.');
      return;
    }
    onContinue(role);
  };

  return (
    <LinearGradient colors={BG} locations={BG_LOC} start={{ x: 0.3, y: 0 }} end={{ x: 0.7, y: 1 }} style={s.flex}>
      <StatusBar style="dark" />
      <SafeAreaView style={s.flex}>
        <ScrollView
          contentContainerStyle={[
            s.scroll,
            { paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) + 12 : 16 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* header: small logo + step dashes */}
          <View style={s.header}>
            <View style={s.headerBrand}>
              <View style={s.miniPin}>
                <Ionicons name="bus" size={14} color="#5312c8" />
              </View>
              <Text style={s.headerWord}>
                <Text style={s.wordBus}>Bus</Text>
                <Text style={s.wordBuddy}>Buddy</Text>
              </Text>
            </View>
            <View style={s.dashes}>
              <View style={[s.dash, s.dashOn]} />
              <View style={s.dash} />
              <View style={s.dash} />
            </View>
          </View>

          <TouchableOpacity style={s.backCircle} onPress={onBack} hitSlop={10}>
            <Ionicons name="chevron-back" size={22} color="#ffffff" />
          </TouchableOpacity>

          <Text style={s.title}>Choose Your Role</Text>
          <Text style={s.subtitle}>Select the role that best describes you</Text>

          {ROLES.map((r) => {
            const on = role === r.id;
            return (
              <Pressable key={r.id} onPress={() => { setRole(r.id); setHint(''); }} style={({ pressed }) => [s.card, on && s.cardOn, pressed && s.cardPressed]}>
                <LinearGradient
                  colors={on ? ['#25f0e0', '#7c5cf6', '#ff45d6'] : ['#2ee6f0', '#7c5cf6', '#ff45d6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={s.iconCircle}
                >
                  <Ionicons name={r.icon} size={34} color="#ffffff" />
                </LinearGradient>
                <Text style={s.cardTitle}>{r.title}</Text>
                <Text style={s.cardSub}>{r.sub}</Text>
              </Pressable>
            );
          })}

          {hint !== '' && <Text style={s.hint}>{hint}</Text>}

          <Pressable
            onPress={pressContinue}
            android_ripple={{ color: 'rgba(255,255,255,0.25)' }}
            style={({ pressed }) => [s.ctaWrap, role === null && s.ctaDisabled, pressed && s.ctaPressed]}
          >
            <LinearGradient colors={CTA} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={s.cta}>
              <Text style={s.ctaText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 10 }} />
            </LinearGradient>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 24, paddingBottom: 34 },

  header: {
    width: '100%',
    maxWidth: 480,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerBrand: { flexDirection: 'row', alignItems: 'center' },
  miniPin: {
    width: 30,
    height: 30,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#5312c8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginRight: 8,
  },
  headerWord: { fontSize: 20, fontWeight: '800' },
  wordBus: { color: '#5a16cf' },
  wordBuddy: { color: '#25f0e4' },
  dashes: { flexDirection: 'row' },
  dash: { width: 22, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)', marginLeft: 6 },
  dashOn: { backgroundColor: '#25f0e4' },

  backCircle: {
    alignSelf: 'flex-start',
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginTop: 4,
    marginBottom: 6,
  },

  title: { fontSize: 34, fontWeight: '800', color: '#ffffff', textAlign: 'center', marginTop: 6 },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.92)',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },

  card: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(12,20,70,0.55)',
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#7c4dff',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  cardOn: { borderColor: '#25f0e0', backgroundColor: 'rgba(20,30,95,0.75)' },
  cardPressed: { opacity: 0.9 },

  iconCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardTitle: { fontSize: 21, fontWeight: '800', color: '#ffffff' },
  cardSub: {
    fontSize: 13.5,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginTop: 5,
    lineHeight: 18,
  },

  hint: { color: '#ffd0d0', fontSize: 13, textAlign: 'center', marginBottom: 10 },

  ctaWrap: { width: '100%', maxWidth: 480, borderRadius: 30, overflow: 'hidden', marginTop: 6 },
  ctaDisabled: { opacity: 0.55 },
  ctaPressed: { opacity: 0.85 },
  cta: {
    height: 58,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
});
