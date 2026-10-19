// mobile/src/screens/RegisterScreen.js
// Registration — same API flow as before, restyled to the BusBuddy mockup.
// (Real fields stay: Full Name / Email / Password + license photo — see notes.)

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  ScrollView,
  Image,
  SafeAreaView,
  StatusBar as RNStatusBar,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { BASE_URL } from '../../api';

const BG = ['#1de6f4', '#1e9df7', '#5b5df8', '#8b3ff0', '#c23ff0'];
const BG_LOC = [0, 0.2, 0.44, 0.7, 1];
const CTA = ['#25f0e0', '#5a4ff0', '#c22ff0'];

export default function RegisterScreen({ onBack, role = 'Drivers' }) {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [license, setLicense] = useState(null);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (v) => setForm({ ...form, [k]: v });

  const pick = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return setError('Gallery permission needed');
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!result.canceled) setLicense(result.assets[0]);
  };

  const submit = async () => {
    setError('');
    setMsg('');
    if (!form.name || !form.email || !form.password || !license) {
      return setError('All fields + license photo required');
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Signup failed'); return; }

      const login = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const ld = await login.json();
      if (!login.ok) { setError(ld.error ?? 'Login failed'); return; }

      const up = await FileSystem.uploadAsync(`${BASE_URL}/api/driver/license`, license.uri, {
        httpMethod: 'POST',
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        fieldName: 'file',
        headers: { Authorization: `Bearer ${ld.token}` },
      });
      if (up.status !== 201) { setError('Upload failed: ' + up.body); return; }
      const ud = JSON.parse(up.body);

      const prof = await fetch(`${BASE_URL}/api/driver/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ld.token}` },
        body: JSON.stringify({ license_url: ud.path }),
      });
      const pd = await prof.json();
      if (!prof.ok) { setError(pd.error ?? 'Profile failed'); return; }

      setMsg('Registered! Pending admin review ✅');
      setForm({ name: '', email: '', password: '' });
      setLicense(null);
    } catch (e) {
      setError('Error: ' + (e?.message ?? String(e)));
    } finally {
      setLoading(false);
    }
  };

  const badgeIcon = role.toLowerCase() === 'driver' ? 'bus' : role.toLowerCase() === 'student' ? 'school' : 'people';

  return (
    <LinearGradient colors={BG} locations={BG_LOC} start={{ x: 0.3, y: 0 }} end={{ x: 0.7, y: 1 }} style={s.flex}>
      <StatusBar style="dark" />

      {/* bottom illustration silhouette */}
      <View pointerEvents="none" style={s.illus}>
        <View style={s.road} />
        <View style={[s.building, { left: 0, height: 90 }]} />
        <View style={[s.building, { left: 46, height: 130 }]} />
        <View style={[s.building, { left: 96, height: 70 }]} />
        <View style={[s.building, { right: 96, height: 110 }]} />
        <View style={[s.building, { right: 44, height: 150 }]} />
        <View style={[s.building, { right: 0, height: 84 }]} />
        <Ionicons name="bus" size={54} color="rgba(255,255,255,0.55)" style={s.illusBus} />
        <Ionicons name="location" size={30} color="#ff6bf0" style={s.illusPin} />
      </View>

      <SafeAreaView style={s.flex}>
        <ScrollView
          contentContainerStyle={[
            s.scroll,
            { paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) + 12 : 16 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* back button */}
          <TouchableOpacity style={s.backCircle} onPress={onBack} hitSlop={10}>
            <Ionicons name="chevron-back" size={22} color="#ffffff" />
          </TouchableOpacity>

          {/* logo */}
          <View style={s.pinWrap}>
            <View style={s.pinBody}>
              <Ionicons name="bus" size={34} color="#5312c8" />
            </View>
            <View style={s.pinTip} />
          </View>
          <Text style={s.wordmark}>
            <Text style={s.wordBus}>Bus</Text>
            <Text style={s.wordBuddy}>Buddy</Text>
          </Text>
          <Text style={s.tagline}>Safe Rides, Connected Families.</Text>

          {/* role badge */}
          <View style={s.badgeRow}>
            <View style={s.badgeLine} />
            <Ionicons name={badgeIcon} size={18} color="#3ef0e0" style={{ marginHorizontal: 10 }} />
            <Text style={s.badgeText}>{role}</Text>
            <View style={s.badgeLine} />
          </View>

          {/* glass card */}
          <LinearGradient
            colors={['#39e0ff', '#7c5cf6', '#ff45d6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.cardBorder}
          >
            <View style={s.cardInner}>
              <Text style={s.cardTitle}>Sign Up</Text>
              <Text style={s.cardSub}>Enter your details to create your account.</Text>

              <View style={s.field}>
                <Ionicons name="person" size={20} color="#46d8ff" style={s.fieldIcon} />
                <TextInput
                  style={s.input}
                  placeholder="Full Name"
                  placeholderTextColor="rgba(255,255,255,0.75)"
                  value={form.name}
                  onChangeText={set('name')}
                  autoCapitalize="sentences"
                />
              </View>

              <View style={s.field}>
                <Ionicons name="mail" size={20} color="#46d8ff" style={s.fieldIcon} />
                <TextInput
                  style={s.input}
                  placeholder="Email"
                  placeholderTextColor="rgba(255,255,255,0.75)"
                  value={form.email}
                  onChangeText={set('email')}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View style={s.field}>
                <Ionicons name="lock-closed" size={20} color="#46d8ff" style={s.fieldIcon} />
                <TextInput
                  style={s.input}
                  placeholder="Password"
                  placeholderTextColor="rgba(255,255,255,0.75)"
                  value={form.password}
                  onChangeText={set('password')}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity style={s.picker} onPress={pick}>
                <Text style={s.pickerText}>
                  {license ? '📎 Photo selected' : '📷 Pick license photo'}
                </Text>
              </TouchableOpacity>
              {license && <Image source={{ uri: license.uri }} style={s.thumb} />}

              <Pressable
                onPress={submit}
                disabled={loading}
                android_ripple={{ color: 'rgba(255,255,255,0.25)' }}
                style={({ pressed }) => [s.ctaWrap, (pressed || loading) && s.ctaPressed]}
              >
                <LinearGradient colors={CTA} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={s.cta}>
                  <Text style={s.ctaText}>{loading ? 'Registering…' : 'Sign Up'}</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 10 }} />
                </LinearGradient>
              </Pressable>

              {msg !== '' && <Text style={s.msg}>{msg}</Text>}
              {error !== '' && <Text style={s.error}>{error}</Text>}
            </View>
          </LinearGradient>

          <View style={s.footer}>
            <Text style={s.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={onBack} hitSlop={10}>
              <Text style={s.footerLink}>Log in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 24, paddingBottom: 34 },

  illus: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 190, justifyContent: 'flex-end' },
  road: { height: 2, backgroundColor: 'rgba(255,107,240,0.75)', marginBottom: 34 },
  building: {
    position: 'absolute',
    bottom: 34,
    width: 34,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  illusBus: { position: 'absolute', right: 40, bottom: 6 },
  illusPin: { position: 'absolute', left: '46%', bottom: 40 },

  backCircle: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },

  pinWrap: { alignItems: 'center', marginTop: 44 },
  pinBody: {
    width: 74,
    height: 74,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: '#5312c8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  pinTip: {
    width: 17,
    height: 17,
    marginTop: -10,
    borderRightWidth: 3,
    borderBottomWidth: 3,
    borderColor: '#5312c8',
    transform: [{ rotate: '45deg' }],
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  wordmark: { marginTop: 8, fontSize: 30, fontWeight: '800' },
  wordBus: { color: '#5a16cf' },
  wordBuddy: { color: '#25f0e4' },
  tagline: { marginTop: 4, marginBottom: 14, fontSize: 14, fontWeight: '700', color: '#ffffff' },

  badgeRow: { flexDirection: 'row', alignItems: 'center', width: '100%', maxWidth: 420, marginBottom: 14 },
  badgeLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.45)' },
  badgeText: { color: '#3ef0e0', fontSize: 15, fontWeight: '800' },

  cardBorder: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 30,
    padding: 1.5,
    shadowColor: '#7c4dff',
    shadowOpacity: 0.6,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
  cardInner: { borderRadius: 28.5, backgroundColor: 'rgba(12,20,70,0.6)', padding: 22 },
  cardTitle: { fontSize: 34, fontWeight: '800', color: '#ffffff', textAlign: 'center' },
  cardSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.92)',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
    paddingHorizontal: 6,
  },

  field: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: 'rgba(70,216,255,0.95)',
    backgroundColor: 'rgba(8,16,60,0.55)',
    paddingHorizontal: 18,
    marginBottom: 14,
  },
  fieldIcon: { marginRight: 12 },
  input: { flex: 1, color: '#ffffff', fontSize: 15, padding: 0 },

  picker: {
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: 'rgba(191,219,254,0.9)',
    backgroundColor: 'rgba(8,16,60,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  pickerText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  thumb: { width: '100%', height: 140, borderRadius: 14, marginBottom: 14 },

  ctaWrap: { borderRadius: 30, overflow: 'hidden' },
  ctaPressed: { opacity: 0.85 },
  cta: {
    height: 58,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { color: '#ffffff', fontSize: 18, fontWeight: '700' },

  msg: { color: '#bbf7d0', marginTop: 12, textAlign: 'center', fontSize: 13.5 },
  error: { color: '#ffd0d0', marginTop: 10, textAlign: 'center', fontSize: 13.5 },

  footer: { flexDirection: 'row', alignItems: 'center', marginTop: 20 },
  footerText: { color: 'rgba(255,255,255,0.9)', fontSize: 14 },
  footerLink: { color: '#30f0e0', fontSize: 14, fontWeight: '800' },
});
