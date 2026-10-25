import React, { useState } from 'react';
import { View, Text, Image, Pressable, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform, StatusBar as RNStatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AuthBg from './AuthBg';
import { Card, Field, Btn, Notice, C } from '../ui';
import { call, uploadNative, errOf } from '../net';
import { EMAIL_RE, PHONE_HINT, phoneOk } from '../format';

const COPY = {
  student: { badge: 'Student', icon: 'school', blurb: 'Create your student account.' },
  parent: { badge: 'Parent', icon: 'people', blurb: 'Create your parent account.' },
  driver: { badge: 'Driver', icon: 'bus', blurb: 'Create your driver account.' },
};

// Same rules as the web sign-up: everything is required (student + university, driver + license photo).
export default function SignUpScreen({ role, onLogin, onBack, onGoLogin }) {
  const copy = COPY[role];
  const [name, setName] = useState('');
  const [uni, setUni] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [conf, setConf] = useState('');
  const [photo, setPhoto] = useState(null); // { uri, name, type }
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(null); // token when the account exists but the license upload failed
  const top = Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) : 0;

  async function pickPhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { setErrors((e) => ({ ...e, photo: 'Allow photo access to upload your license.' })); return; }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (res.canceled || !res.assets || !res.assets[0]) return;
    const a = res.assets[0];
    const ext = (a.uri.split('.').pop() || 'jpg').toLowerCase();
    const type = ext === 'png' ? 'image/png' : 'image/jpeg';
    setPhoto({ uri: a.uri, name: `license.${ext === 'png' ? 'png' : 'jpg'}`, type });
    setErrors((e) => ({ ...e, photo: undefined }));
  }

  async function sendLicense(token) {
    const up = await uploadNative(token, '/driver/license', photo);
    if (!up.ok) return errOf(up, 'License upload failed.');
    const prof = await call(token, '/driver/profile', { method: 'POST', body: { license_url: up.data.path } });
    if (!prof.ok && prof.status !== 409) return errOf(prof, 'Could not save your driver profile.');
    return null;
  }

  async function submit() {
    setFormError('');
    if (retry && photo) {
      setBusy(true);
      const err = await sendLicense(retry);
      setBusy(false);
      if (err) return setFormError(err);
      return onLogin(retry, role, true);
    }
    const v = {};
    if (name.trim().length < 2) v.name = 'Enter your full name';
    if (role === 'student' && !uni.trim()) v.uni = 'Enter your university name';
    if (!phone.trim()) v.phone = 'Enter your phone number';
    else if (!phoneOk(phone)) v.phone = `Enter a valid phone number, e.g. ${PHONE_HINT}`;
    if (!email.trim()) v.email = 'Enter your email';
    else if (!EMAIL_RE.test(email.trim())) v.email = 'Enter a valid email';
    if (pw.length < 8) v.pw = 'Password must be at least 8 characters';
    if (!conf) v.conf = 'Confirm your password';
    else if (conf !== pw) v.conf = 'Passwords do not match';
    if (role === 'driver' && !photo) v.photo = 'Upload a photo of your driving license';
    setErrors(v);
    if (Object.keys(v).length) return;

    setBusy(true);
    const su = await call(null, '/auth/signup', {
      method: 'POST',
      body: { name: name.trim(), email: email.trim(), phone: phone.trim(), password: pw, role, ...(role === 'student' ? { university: uni.trim() } : {}) },
    });
    if (!su.ok) {
      setBusy(false);
      const msg = errOf(su);
      if (su.status === 409) setErrors(/phone/i.test(msg) ? { phone: msg } : { email: msg });
      else setFormError(msg);
      return;
    }
    const lg = await call(null, '/auth/login', { method: 'POST', body: { identifier: email.trim(), password: pw } });
    if (!lg.ok) { setBusy(false); setFormError('Account created. Please log in.'); return onGoLogin(); }
    if (role === 'driver') {
      const err = await sendLicense(lg.data.token);
      if (err) {
        setBusy(false);
        setRetry(lg.data.token);
        setFormError(`Your account was created, but: ${err} Pick the photo again and press the button to retry.`);
        return;
      }
    }
    setBusy(false);
    onLogin(lg.data.token, role, true);
  }

  return (
    <AuthBg>
      <SafeAreaView style={{ flex: 1, paddingTop: top }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ padding: 22, paddingTop: 54 }} keyboardShouldPersistTaps="handled">
            <Pressable onPress={onBack} style={{ position: 'absolute', top: 8, left: 14, zIndex: 2 }} hitSlop={10}>
              <Ionicons name="chevron-back-circle-outline" size={36} color="#fff" />
            </Pressable>
            <View style={{ alignItems: 'center', marginBottom: 12 }}>
              <View style={{ width: 62, height: 62, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
                <Image source={require('../../assets/busbuddy-logo.png')} style={{ width: 46, height: 46 }} resizeMode="contain" />
              </View>
              <Text style={{ fontSize: 28, fontWeight: '800' }}><Text style={{ color: '#3b13b8' }}>Bus</Text><Text style={{ color: '#fff' }}>Buddy</Text></Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <Ionicons name={copy.icon} size={20} color="#0b1a6b" /><Text style={{ color: '#0b1a6b', fontWeight: '800', fontSize: 17 }}>{copy.badge}</Text>
              </View>
            </View>
            <Card glow style={{ backgroundColor: 'rgba(12,22,120,0.74)', padding: 20 }}>
              <Text style={{ color: '#fff', fontSize: 28, fontWeight: '800', textAlign: 'center' }}>Sign Up</Text>
              <Text style={{ color: C.dim, textAlign: 'center', marginBottom: 14 }}>{copy.blurb}</Text>
              {!retry ? (
                <>
                  <Field icon="person-outline" placeholder="Full Name" value={name} onChangeText={setName} error={errors.name} autoCapitalize="words" />
                  {role === 'student' ? <Field icon="school-outline" placeholder="University Name" value={uni} onChangeText={setUni} error={errors.uni} autoCapitalize="words" /> : null}
                  <Field icon="call-outline" placeholder={`Phone Number (${PHONE_HINT})`} value={phone} onChangeText={setPhone} error={errors.phone} keyboardType="phone-pad" />
                  <Field icon="mail-outline" placeholder="Email" value={email} onChangeText={setEmail} error={errors.email} keyboardType="email-address" />
                  <Field icon="lock-closed-outline" secure placeholder="Password (min 8 characters)" value={pw} onChangeText={setPw} error={errors.pw} />
                  <Field icon="lock-closed-outline" secure placeholder="Confirm Password" value={conf} onChangeText={setConf} error={errors.conf} />
                </>
              ) : null}
              {role === 'driver' ? (
                <View style={{ marginBottom: 12 }}>
                  <Btn kind="ghost" icon="image-outline" title={photo ? 'License photo selected ✓' : 'Upload driving license photo'} onPress={pickPhoto} />
                  {photo ? <Image source={{ uri: photo.uri }} style={{ height: 110, borderRadius: 12, marginTop: 8 }} resizeMode="cover" /> : null}
                  {errors.photo ? <Text style={{ color: '#ff8f8f', fontSize: 12, marginTop: 4, marginLeft: 10 }}>{errors.photo}</Text> : null}
                </View>
              ) : null}
              {formError ? <Notice kind="error">{formError}</Notice> : null}
              <Btn title={retry ? 'Retry license upload' : 'Sign Up'} onPress={submit} busy={busy} />
            </Card>
            <Pressable onPress={onGoLogin} style={{ marginTop: 16, marginBottom: 20 }}>
              <Text style={{ color: '#fff', textAlign: 'center' }}>Already have an account? <Text style={{ color: '#0b1a6b', fontWeight: '800' }}>Sign in</Text></Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AuthBg>
  );
}
