import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { loginRequest } from '../../api';
import Button from '../components/Button';
import Input from '../components/Input';

export default function LoginScreen({ onLogin, onGoRegister }) {
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
    <LinearGradient
      colors={['#06b6d4', '#3b82f6', '#a855f7']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={s.flex}
    >
      <View style={s.container}>
        <Text style={s.title}>BusBuddy</Text>
        <Text style={s.subtitle}>Welcome back</Text>

        <Input
          style={s.input}
          placeholder="Email"
          placeholderTextColor="rgba(255,255,255,0.7)"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <Input
          style={s.input}
          placeholder="Password"
          placeholderTextColor="rgba(255,255,255,0.7)"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {error !== '' && <Text style={s.error}>{error}</Text>}

        <Button
          label="Log in"
          onPress={handleLogin}
          loading={loading}
          style={s.button}
          textStyle={s.buttonText}
        />

        <TouchableOpacity onPress={onGoRegister}>
          <Text style={s.registerLink}>New here? Create an account</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { color: '#fff', fontSize: 32, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  subtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 16, textAlign: 'center', marginBottom: 32 },
  input: { backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', borderRadius: 24, paddingVertical: 12, paddingHorizontal: 18, marginBottom: 12 },
  error: { color: '#fecaca', textAlign: 'center', marginBottom: 12 },
  button: { backgroundColor: '#0f172a', borderRadius: 24, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  registerLink: { color: '#a5f3fc', textAlign: 'center', marginTop: 16 },
});
