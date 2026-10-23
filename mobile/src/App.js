// mobile/src/App.js — BusBuddy (Expo). No react-navigation: a small state machine.
//   signed out: welcome -> role -> signup / login      signed in: permissions gate -> Shell (tabs per role)
import React, { useCallback, useEffect, useState } from 'react';
import { View, ActivityIndicator, BackHandler } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { StatusBar } from 'expo-status-bar';
import WelcomeScreen from './screens/WelcomeScreen';
import RoleSelectScreen from './screens/RoleSelectScreen';
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignUpScreen';
import PermissionsScreen from './screens/PermissionsScreen';
import Shell from './Shell';

export default function App() {
  const [boot, setBoot] = useState(true);
  const [stage, setStage] = useState('welcome'); // welcome | role | login | signup
  const [signupRole, setSignupRole] = useState('student');
  const [session, setSession] = useState(null); // { token, role }
  const [permDone, setPermDone] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const token = await SecureStore.getItemAsync('bb_token');
        const role = await SecureStore.getItemAsync('bb_role');
        if (token && role) setSession({ token, role });
      } catch (e) {
        console.error('Could not read stored session', e);
      } finally {
        setBoot(false);
      }
    })();
  }, []);

  // "Remember me" ON -> stored in the keychain · OFF -> only kept in memory until the app closes
  const handleLogin = useCallback(async (token, role, remember) => {
    try {
      if (remember) {
        await SecureStore.setItemAsync('bb_token', token);
        await SecureStore.setItemAsync('bb_role', role);
      } else {
        await SecureStore.deleteItemAsync('bb_token');
        await SecureStore.deleteItemAsync('bb_role');
      }
    } catch (e) {
      console.error('Could not persist session', e);
    }
    setPermDone(false);
    setSession({ token, role });
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await SecureStore.deleteItemAsync('bb_token');
      await SecureStore.deleteItemAsync('bb_role');
    } catch (e) {
      console.error('Could not clear stored session', e);
    } finally {
      setStage('welcome');
      setSession(null);
    }
  }, []);

  const permissionsDone = useCallback(() => setPermDone(true), []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (session) return false;
      if (stage === 'signup') { setStage('role'); return true; }
      if (stage === 'role' || stage === 'login') { setStage('welcome'); return true; }
      return false;
    });
    return () => sub.remove();
  }, [session, stage]);

  if (boot) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#050b3a' }}><ActivityIndicator size="large" color="#00e5ff" /></View>;
  }

  let screen;
  if (session) {
    screen = !permDone
      ? <PermissionsScreen role={session.role} onDone={permissionsDone} />
      : <Shell token={session.token} role={session.role} onLogout={handleLogout} />;
  } else if (stage === 'welcome') {
    screen = <WelcomeScreen onGetStarted={() => setStage('role')} onLogin={() => setStage('login')} />;
  } else if (stage === 'role') {
    screen = <RoleSelectScreen onContinue={(role) => { setSignupRole(role); setStage('signup'); }} onBack={() => setStage('welcome')} />;
  } else if (stage === 'signup') {
    screen = <SignUpScreen role={signupRole} onLogin={handleLogin} onBack={() => setStage('role')} onGoLogin={() => setStage('login')} />;
  } else {
    screen = <LoginScreen onLogin={handleLogin} onGoSignUp={() => setStage('role')} onBack={() => setStage('welcome')} />;
  }

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="light" />
      {screen}
    </View>
  );
}
