import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { loginRequest } from './api';

export default function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    setError('');
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
    <View style={s.container}>
      <Text style={s.title}>BusBuddy</Text>
      <Text style={s.subtitle}>Driver login</Text>

      <TextInput
        style={s.input}
        placeholder="Email"
        placeholderTextColor="#999"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={s.input}
        placeholder="Password"
        placeholderTextColor="#999"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error !== '' && <Text style={s.error}>{error}</Text>}

      <TouchableOpacity style={s.button} onPress={handleLogin} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={s.buttonText}>Log in</Text>}
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', padding: 24 },
  title: { color: '#fff', fontSize: 32, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  subtitle: { color: '#f59e0b', fontSize: 16, textAlign: 'center', marginBottom: 32 },
  input: { backgroundColor: '#1e293b', color: '#fff', borderRadius: 24, paddingVertical: 12, paddingHorizontal: 18, marginBottom: 12 },
  error: { color: '#ef4444', textAlign: 'center', marginBottom: 12 },
  button: { backgroundColor: '#f59e0b', borderRadius: 24, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#0f172a', fontWeight: '700', fontSize: 16 },
});
