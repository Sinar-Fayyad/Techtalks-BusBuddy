import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import DriverTripScreen from './screens/DriverTripScreen';
import DriverStatusScreen from './screens/DriverStatusScreen'; // ← T4

export default function App() {
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState('login'); // 'login' | 'register'
  const [session, setSession] = useState(null);  // { token, role }
  const [driverView, setDriverView] = useState('trip'); // ← T4: 'trip' | 'status'

  useEffect(() => {
    (async () => {
      try {
        const token = await SecureStore.getItemAsync('bb_token');
        const role = await SecureStore.getItemAsync('bb_role');
        if (token) setSession({ token, role });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleLogin(token, role) {
    await SecureStore.setItemAsync('bb_token', token);
    await SecureStore.setItemAsync('bb_role', role);
    setSession({ token, role });
  }

  async function handleLogout() {
    await SecureStore.deleteItemAsync('bb_token');
    await SecureStore.deleteItemAsync('bb_role');
    setDriverView('trip'); // ← T4: next login starts on the trip screen, not the status screen
    setSession(null);
    setScreen('login');
  }

  if (loading) {
    return <View style={s.center}><ActivityIndicator size="large" color="#f59e0b" /></View>;
  }

  if (session) {
    if (session.role === 'driver') {
      // ← T4: the driver branch now has two screens
      if (driverView === 'status') {
        return (
          <DriverStatusScreen
            token={session.token}
            onBack={() => setDriverView('trip')}
            onLogout={handleLogout}
            onSessionExpired={handleLogout}
          />
        );
      }
      return (
        <DriverTripScreen
          token={session.token}
          onSessionExpired={handleLogout}
          onLogout={handleLogout}
          onOpenStatus={() => setDriverView('status')}
        />
      );
    }
    return <HomeScreen role={session.role} onLogout={handleLogout} />;
  }

  return screen === 'register'
    ? <RegisterScreen onBack={() => setScreen('login')} />
    : <LoginScreen onLogin={handleLogin} onGoRegister={() => setScreen('register')} />;
}

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
});