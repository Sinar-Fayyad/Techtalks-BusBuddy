import React, { useState } from 'react';
import { View, Text, Image, Pressable, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform, StatusBar as RNStatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AuthBg from './AuthBg';
import { Card, Field, Btn, Notice, C } from '../ui';
import { call } from '../net';

export default function LoginScreen({ onLogin, onGoSignUp, onBack }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const top = Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) : 0;

  async function submit() {
    const v = {};
    if (!identifier.trim()) v.identifier = 'Enter your email or phone number';
    if (!password) v.password = 'Password is required';
    setErrors(v);
    setFormError('');
    if (Object.keys(v).length) return; // nothing is sent when a field is empty
    setBusy(true);
    const r = await call(null, '/auth/login', { method: 'POST', body: { identifier: identifier.trim(), password } });
    setBusy(false);
    if (!r.ok) {
      setFormError(r.status === 401 ? 'Wrong email/phone or password.' : (r.data && r.data.error) || 'Could not log in. Try again.');
      return;
    }
    onLogin(r.data.token, r.data.role, remember);
  }

  return (
    <AuthBg>
      <SafeAreaView style={{ flex: 1, paddingTop: top }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ padding: 22, flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
            <Pressable onPress={onBack} style={{ position: 'absolute', top: 8, left: 14, zIndex: 2 }} hitSlop={10}>
              <Ionicons name="chevron-back-circle-outline" size={36} color="#fff" />
            </Pressable>
            <View style={{ alignItems: 'center', marginBottom: 14 }}>
              <View style={{ width: 70, height: 70, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
                <Image source={require('../../assets/busbuddy-logo.png')} style={{ width: 52, height: 52 }} resizeMode="contain" />
              </View>
              <Text style={{ fontSize: 32, fontWeight: '800', marginTop: 4 }}><Text style={{ color: '#3b13b8' }}>Bus</Text><Text style={{ color: '#fff' }}>Buddy</Text></Text>
              <Text style={{ color: '#fff', fontWeight: '600' }}>Safe Rides. Connected Families.</Text>
            </View>
            <Card glow style={{ backgroundColor: 'rgba(12,22,120,0.72)', padding: 20 }}>
              <Text style={{ color: '#fff', fontSize: 28, fontWeight: '800', textAlign: 'center' }}>Welcome Back!</Text>
              <Text style={{ color: C.dim, textAlign: 'center', marginBottom: 16 }}>Log in to continue your journey.</Text>
              <Field icon="person-outline" placeholder="Email or phone number" value={identifier} onChangeText={setIdentifier} error={errors.identifier} keyboardType="email-address" autoComplete="username" />
              <Field icon="lock-closed-outline" secure placeholder="Password" value={password} onChangeText={setPassword} error={errors.password} />
              <Pressable onPress={() => setRemember((x) => !x)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Ionicons name={remember ? 'checkbox' : 'square-outline'} size={22} color={C.cyan} />
                <Text style={{ color: '#fff' }}>Remember me</Text>
              </Pressable>
              {formError ? <Notice kind="error">{formError}</Notice> : null}
              <Btn title="Log In" onPress={submit} busy={busy} />
            </Card>
            <Pressable onPress={onGoSignUp} style={{ marginTop: 16 }}>
              <Text style={{ color: '#fff', textAlign: 'center' }}>Don’t have an account? <Text style={{ color: '#0b1a6b', fontWeight: '800' }}>Sign up</Text></Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AuthBg>
  );
}
