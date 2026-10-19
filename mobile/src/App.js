// mobile/src/App.js

import React, { useCallback, useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import RoleSelectScreen from './screens/RoleSelectScreen';
import HomeScreen from './screens/HomeScreen';
import DriverTripScreen from './screens/DriverTripScreen';
import DriverStatusScreen from './screens/DriverStatusScreen';
import WelcomeScreen from './screens/WelcomeScreen';

const ROLE_LABEL = { student: 'Students', parent: 'Parents', driver: 'Drivers' };

export default function App() {
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState('welcome'); // 'welcome' | 'role' | 'login' | 'register'
  const [pendingRole, setPendingRole] = useState('driver');
  const [session, setSession] = useState(null); // { token, role }
  const [driverView, setDriverView] = useState('trip'); // 'trip' | 'status'

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

  // ← T6: a slow or failing keychain write must not strand the user on Login
  const handleLogin = useCallback(async (token, role) => {
    try {
      await SecureStore.setItemAsync('bb_token', token);
      await SecureStore.setItemAsync('bb_role', role);
    } catch (e) {
      console.error('Could not persist session', e);
    }
    setSession({ token, role });
  }, []);

  // ← T6: try/finally — the session always clears, even if SecureStore throws
  const handleLogout = useCallback(async () => {
    try {
      await SecureStore.deleteItemAsync('bb_token');
      await SecureStore.deleteItemAsync('bb_role');
    } catch (e) {
      console.error('Could not clear stored session', e);
    } finally {
      setScreen('welcome'); // lands back on the welcome screen
      setDriverView('trip');
      setSession(null);
    }
  }, []);

  // ← T6: stable identities — these feed a BackHandler effect downstream
  const openStatus = useCallback(() => setDriverView('status'), []);
  const closeStatus = useCallback(() => setDriverView('trip'), []);
  const goRole = useCallback(() => setScreen('role'), []);
  const goLogin = useCallback(() => setScreen('login'), []);
  const chooseRole = useCallback((role) => {
    setPendingRole(role);
    setScreen('register');
  }, []);

  if (loading) {
    return <View style={s.center}><ActivityIndicator size="large" color="#f59e0b" /></View>;
  }

  if (session) {
    if (session.role === 'driver') {
      if (driverView === 'status') {
        return (
          <DriverStatusScreen
            token={session.token}
            onBack={closeStatus}
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
          onOpenStatus={openStatus}
        />
      );
    }
    return <HomeScreen role={session.role} onLogout={handleLogout} />;
  }

  if (screen === 'welcome') {
    return <WelcomeScreen onGetStarted={goRole} onLogin={goLogin} />;
  }

  if (screen === 'role') {
    return <RoleSelectScreen onContinue={chooseRole} onBack={() => setScreen('welcome')} />;
  }

  if (screen === 'register') {
    return (
      <RegisterScreen
        role={ROLE_LABEL[pendingRole] || 'Drivers'}
        onBack={() => setScreen('role')}
      />
    );
  }

  return <LoginScreen onLogin={handleLogin} onGoRegister={goRole} />;
}

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
});
