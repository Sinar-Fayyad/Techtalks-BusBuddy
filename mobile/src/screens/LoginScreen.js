// mobile/src/screens/LoginScreen.js
// "Welcome Back!" — matches the BusBuddy login mockup.

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  StatusBar as RNStatusBar,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { loginRequest } from '../../api';

const BG = ['#1de6f4', '#1e9df7', '#5b5df8', '#8b3ff0', '#c23ff0'];
const BG_LOC = [0, 0.2, 0.44, 0.7, 1];
const CTA = ['#25f0e0', '#5a4ff0', '#c22ff0'];

export default function LoginScreen({ onLogin, onGoRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hint, setHint] = useState('');

  async function handleLogin() {
    setError('');
    setHint('');
    if (!email.trim() || !password) {
      setError('Please enter email and password.');
      return;
    }
    setLoading(true);
    try {
      const { ok, status, data } = await loginRequest(email.trim(), password);
      if (ok && data.token) {
        onLogin(data.token, data.role); // App.js stores it
      } else if (status === 401) {
        setError('Wrong email or password.');
      } else if (status === 0) {
        setError('Cannot reach the server. Check Wi-Fi and that the web server is running.');
      } else {
        setError(data.error || `Login failed (${status}).`);
      }
    } catch (e) {
      setError('Cannot reach the server. Check Wi-Fi and that the web server is running.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient colors={BG} locations={BG_LOC} start={{ x: 0.3, y: 0 }} end={{ x: 0.7, y: 1 }} style={s.flex}>
      <StatusBar style="dark" />
      <SafeAreaView style={s.flex}>
        <ScrollView
          contentContainerStyle={[
            s.scroll,
            { paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) + 12 : 16 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Logo ─────────────────────────────────────────────── */}
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

          {/* ── Glass card ──────────────────────────────────────── */}
          <LinearGradient
            colors={['#39e0ff', '#7c5cf6', '#ff45d6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.cardBorder}
          >
            <View style={s.cardInner}>
              <Text style={s.cardTitle}>Welcome Back!</Text>
              <Text style={s.cardSub}>Log in to continue your journey.</Text>

              {/* email / phone */}
              <View style={s.field}>
                <Ionicons name="person" size={20} color="#46d8ff" style={s.fieldIcon} />
                <TextInput
                  style={s.input}
                  placeholder="Email or phone number"
                  placeholderTextColor="rgba(255,255,255,0.75)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              {/* password */}
              <View style={s.field}>
                <Ionicons name="lock-closed" size={20} color="#46d8ff" style={s.fieldIcon} />
                <TextInput
                  style={s.input}
                  placeholder="Password"
                  placeholderTextColor="rgba(255,255,255,0.75)"
                  secureTextEntry={!show}
                  autoCapitalize="none"
                  value={password}
                  onChangeText={setPassword}
                />
                <Pressable onPress={() => setShow((v) => !v)} hitSlop={10} style={s.eye}>
                  <Ionicons name={show ? 'eye-off' : 'eye'} size={20} color="#ffffff" />
                </Pressable>
              </View>

              <TouchableOpacity style={s.forgot} onPress={() => setHint('Ask your administrator to reset your password.')} hitSlop={8}>
                <Text style={s.forgotText}>Forgot password?</Text>
              </TouchableOpacity>

              {hint !== '' && <Text style={s.hint}>{hint}</Text>}
              {error !== '' && <Text style={s.error}>{error}</Text>}

              {/* Log In CTA */}
              <Pressable
                onPress={handleLogin}
                disabled={loading}
                android_ripple={{ color: 'rgba(255,255,255,0.25)' }}
                style={({ pressed }) => [s.ctaWrap, (pressed || loading) && s.ctaPressed]}
              >
                <LinearGradient colors={CTA} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={s.cta}>
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={s.ctaText}>Log In</Text>
                      <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 10 }} />
                    </>
                  )}
                </LinearGradient>
              </Pressable>
            </View>
          </LinearGradient>

          {/* ── Footer ──────────────────────────────────────────── */}
          <View style={s.footer}>
            <Text style={s.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={onGoRegister} hitSlop={10}>
              <Text style={s.footerLink}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 24, paddingBottom: 30 },

  pinWrap: { alignItems: 'center', marginTop: 4 },
  pinBody: {
    width: 78,
    height: 78,
    borderRadius: 26,
    borderWidth: 3,
    borderColor: '#5312c8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  pinTip: {
    width: 18,
    height: 18,
    marginTop: -10,
    borderRightWidth: 3,
    borderBottomWidth: 3,
    borderColor: '#5312c8',
    transform: [{ rotate: '45deg' }],
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  wordmark: { marginTop: 10, fontSize: 34, fontWeight: '800', letterSpacing: 0.4 },
  wordBus: { color: '#5a16cf' },
  wordBuddy: { color: '#25f0e4' },
  tagline: { marginTop: 6, marginBottom: 22, fontSize: 15, fontWeight: '700', color: '#ffffff' },

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
  cardInner: {
    borderRadius: 28.5,
    backgroundColor: 'rgba(12,20,70,0.55)',
    padding: 24,
  },
  cardTitle: { fontSize: 36, fontWeight: '800', color: '#ffffff', textAlign: 'center' },
  cardSub: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.92)',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },

  field: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(70,216,255,0.95)',
    backgroundColor: 'rgba(8,16,60,0.55)',
    paddingHorizontal: 18,
    marginBottom: 16,
  },
  fieldIcon: { marginRight: 12 },
  input: { flex: 1, color: '#ffffff', fontSize: 15, padding: 0 },
  eye: { paddingLeft: 10 },

  forgot: { alignSelf: 'flex-end', marginTop: -4, marginBottom: 16 },
  forgotText: { color: '#3ef0e0', fontSize: 14, fontWeight: '700' },
  hint: { color: 'rgba(255,255,255,0.85)', fontSize: 12.5, textAlign: 'center', marginBottom: 10 },
  error: { color: '#ffd0d0', fontSize: 13, textAlign: 'center', marginBottom: 12 },

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

  footer: { flexDirection: 'row', alignItems: 'center', marginTop: 22 },
  footerText: { color: 'rgba(255,255,255,0.9)', fontSize: 14 },
  footerLink: { color: '#30f0e0', fontSize: 14, fontWeight: '800' },
});
