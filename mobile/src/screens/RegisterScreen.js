import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, ScrollView, Image, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { BASE_URL } from '../../api';
import Button from '../components/Button';
import Input from '../components/Input';

export default function RegisterScreen({ onBack }) {
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
    setError(''); setMsg('');
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

  return (
    <LinearGradient
      colors={['#06b6d4', '#3b82f6', '#a855f7']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.flex}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>BusBuddy</Text>
        <Text style={styles.subtitle}>Driver registration</Text>

        <Input style={styles.input} placeholder="Full name" placeholderTextColor="rgba(255,255,255,0.7)" value={form.name} onChangeText={set('name')} autoCapitalize="sentences" />
        <Input style={styles.input} placeholder="Email" placeholderTextColor="rgba(255,255,255,0.7)" value={form.email} onChangeText={set('email')} autoCapitalize="none" keyboardType="email-address" />
        <Input style={styles.input} placeholder="Password" placeholderTextColor="rgba(255,255,255,0.7)" value={form.password} onChangeText={set('password')} secureTextEntry autoCapitalize="none" />

        <TouchableOpacity style={styles.picker} onPress={pick}>
          <Text style={styles.pickerText}>
            {license ? '📎 Photo selected' : '📷 Pick license photo'}
          </Text>
        </TouchableOpacity>
        {license && <Image source={{ uri: license.uri }} style={styles.thumb} />}

        <Button
          label={loading ? 'Registering...' : 'Register'}
          onPress={submit}
          disabled={loading}
          style={styles.button}
          textStyle={styles.buttonText}
        />
        {msg !== '' && <Text style={styles.msg}>{msg}</Text>}
        {error !== '' && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backLink}>← Back to login</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 32, fontWeight: '700', marginBottom: 4, textAlign: 'center', color: '#fff' },
  subtitle: { fontSize: 16, marginBottom: 28, textAlign: 'center', color: 'rgba(255,255,255,0.9)' },
  input: { backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', borderRadius: 24, paddingVertical: 12, paddingHorizontal: 18, marginBottom: 12, fontSize: 15 },
  picker: { backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(191,219,254,0.7)', borderWidth: 1, borderRadius: 24, paddingVertical: 12, paddingHorizontal: 18, marginBottom: 12, alignItems: 'center' },
  pickerText: { color: '#fff', fontWeight: '600' },
  thumb: { width: '100%', height: 150, borderRadius: 12, marginBottom: 12 },
  button: { backgroundColor: '#0f172a', paddingVertical: 14, borderRadius: 24, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  msg: { color: '#bbf7d0', marginTop: 12, textAlign: 'center' },
  error: { color: '#fecaca', marginTop: 12, textAlign: 'center' },
  backLink: { color: '#a5f3fc', marginTop: 20, textAlign: 'center' },
});
