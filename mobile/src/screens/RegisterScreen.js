import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
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
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>BusBuddy — Driver Registration</Text>
      <Input style={styles.input} placeholder="Full name" value={form.name} onChangeText={set('name')} autoCapitalize="sentences" />
      <Input style={styles.input} placeholder="Email" value={form.email} onChangeText={set('email')} autoCapitalize="none" keyboardType="email-address" />
      <Input style={styles.input} placeholder="Password" value={form.password} onChangeText={set('password')} secureTextEntry autoCapitalize="none" />
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
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#1B2A4A' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 12, marginBottom: 12, fontSize: 15 },
  picker: { borderWidth: 1, borderColor: '#1B2A4A', borderRadius: 6, padding: 12, marginBottom: 12, alignItems: 'center' },
  pickerText: { color: '#1B2A4A', fontWeight: '600' },
  thumb: { width: '100%', height: 150, borderRadius: 6, marginBottom: 12 },
  button: { backgroundColor: '#1B2A4A', padding: 14, borderRadius: 6, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  msg: { color: '#16a34a', marginTop: 12, textAlign: 'center' },
  error: { color: '#dc2626', marginTop: 12, textAlign: 'center' },
  backLink: { color: '#1B2A4A', marginTop: 20, textAlign: 'center' },
});
