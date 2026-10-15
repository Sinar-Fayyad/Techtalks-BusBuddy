import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { apiFetch } from '../../api';
import Button from '../components/Button';

// view: 'loading' | 'none' | 'pending' | 'rejected' | 'ready' | 'error'
// ← T4: onOpenStatus lets App.js switch to the driver status screen
export default function DriverTripScreen({ token, onSessionExpired, onLogout, onOpenStatus }) {
  const [view, setView] = useState('loading');
  const [trip, setTrip] = useState(null); // active trip or null
  const [busy, setBusy] = useState(false); // Start/Stop in flight
  const [error, setError] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  // Mount chain: who am I first, then (only if verified) do I have an active trip?
  async function loadProfile() {
    setError('');
    try {
      const me = await apiFetch('/api/driver/me', token);
      if (me.status === 401) return onSessionExpired(); // token expired → back to login
      if (me.status === 404) return setView('none'); // driver never created a profile
      if (!me.ok) throw new Error(`status ${me.status}`);
      const status = me.data.driver.status;
      if (status === 'verified') {
        await loadTrip();
        setView('ready');
      } else {
        setView(status); // 'pending' | 'rejected'
      }
    } catch (e) {
      setView('error');
      setError('Cannot reach the server. Check Wi-Fi and that the web server is running.');
    }
  }

  async function loadTrip() {
    const r = await apiFetch('/api/driver/trips/active', token);
    if (r.status === 401) return onSessionExpired();
    if (r.ok) setTrip(r.data.trip || null);
  }

  async function startTrip() {
    setBusy(true);
    setError('');
    try {
      const r = await apiFetch('/api/driver/trips/start', token, { method: 'POST' });
      if (r.status === 401) return onSessionExpired();
      if (r.status === 201) setTrip(r.data.trip);
      else if (r.status === 409) await loadTrip(); // started elsewhere (other tab) → sync UI
      else if (r.status === 403 || r.status === 404) await loadProfile(); // status may have changed
      else setError(r.data.error || `Could not start the trip (${r.status}).`);
    } catch (e) {
      setError('Cannot reach the server. Check Wi-Fi and that the web server is running.');
    } finally {
      setBusy(false);
    }
  }

  async function stopTrip() {
    setBusy(true);
    setError('');
    try {
      const r = await apiFetch('/api/driver/trips/stop', token, { method: 'POST' });
      if (r.status === 401) return onSessionExpired();
      if (r.status === 200) setTrip(null);
      else if (r.status === 404) await loadTrip(); // already stopped elsewhere → sync UI
      else setError(r.data.error || `Could not stop the trip (${r.status}).`);
    } catch (e) {
      setError('Cannot reach the server. Check Wi-Fi and that the web server is running.');
    } finally {
      setBusy(false);
    }
  }

  function fmtTime(utc) {
    if (!utc) return '';
    return new Date(String(utc).replace(' ', 'T') + 'Z').toLocaleTimeString();
  }

  // Shared wrapper: web-style gradient + logout, same on every view
  function shell(content) {
    return (
      <LinearGradient
        colors={['#06b6d4', '#3b82f6', '#a855f7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.flex}
      >
        <TouchableOpacity onPress={onLogout} style={s.logout}>
          <Text style={s.logoutText}>Log out</Text>
        </TouchableOpacity>
        {content}
      </LinearGradient>
    );
  }

  if (view === 'loading') {
    return shell(
      <View style={s.center}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (view === 'error') {
    return shell(
      <View style={s.container}>
        <Text style={s.title}>BusBuddy Driver</Text>
        <View style={[s.card, s.cardRed]}>
          <Text style={s.cardTitle}>Connection problem</Text>
          <Text style={s.cardText}>{error}</Text>
        </View>
        <Button label="Retry" onPress={loadProfile} style={s.button} textStyle={s.buttonText} />
      </View>
    );
  }

  if (view === 'pending' || view === 'rejected' || view === 'none') {
    const msg = {
      pending: ['License under review', 'An admin still needs to verify your license. Trip controls unlock once your status becomes "verified".'],
      rejected: ['License rejected', 'Your license was not approved. Please contact an admin or re-register with a valid license.'],
      none: ['No driver profile', 'Your account has no driver profile yet. Register a driver profile with your license to get verified.'],
    }[view];
    return shell(
      <View style={s.container}>
        <Text style={s.title}>BusBuddy Driver</Text>
        <View style={[s.card, view === 'rejected' && s.cardRed]}>
          <Text style={s.cardTitle}>{msg[0]}</Text>
          <Text style={s.cardText}>{msg[1]}</Text>
        </View>
        {error !== '' && <Text style={s.error}>{error}</Text>}

        {/* ← T4: same entry point from every view, so pending/rejected drivers can see their status + license */}
        {onOpenStatus && (
          <TouchableOpacity onPress={onOpenStatus}>
            <Text style={s.refresh}>My status & license</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // view === 'ready' → verified driver
  return shell(
    <View style={s.container}>
      <Text style={s.title}>BusBuddy Driver</Text>

      {trip ? (
        <View style={[s.card, s.cardActive]}>
          <Text style={s.cardTitle}>Trip active</Text>
          <Text style={s.cardText}>Started at {fmtTime(trip.start_time)} (your local time)</Text>
        </View>
      ) : (
        <Text style={s.subtitle}>No active trip</Text>
      )}

      {error !== '' && <Text style={s.error}>{error}</Text>}

      {trip ? (
        <Button label="Stop trip" onPress={stopTrip} loading={busy} style={s.button} textStyle={s.buttonText} />
      ) : (
        <Button label="Start trip" onPress={startTrip} loading={busy} style={s.button} textStyle={s.buttonText} />
      )}

      {/* ← T4: verified drivers get the same link (trip screen stays the trip screen) */}
      {onOpenStatus && (
        <TouchableOpacity onPress={onOpenStatus}>
          <Text style={s.refresh}>My status & license</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={loadProfile}>
        <Text style={s.refresh}>Refresh status</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logout: { alignSelf: 'flex-end', backgroundColor: 'rgba(15,23,42,0.85)', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 18, marginTop: 40, marginRight: 24 },
  logoutText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  title: { color: '#fff', fontSize: 28, fontWeight: '700', textAlign: 'center', marginBottom: 24 },
  subtitle: { color: '#e0f2fe', fontSize: 16, textAlign: 'center', marginBottom: 16 },
  card: { backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(191,219,254,0.7)', borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 20 },
  cardActive: { borderColor: '#fde68a' },
  cardRed: { borderColor: '#fca5a5' },
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 6 },
  cardText: { color: '#e0f2fe', fontSize: 14, lineHeight: 20 },
  error: { color: '#fecaca', textAlign: 'center', marginBottom: 12 },
  button: { backgroundColor: '#0f172a', borderRadius: 24, paddingVertical: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  refresh: { color: '#a5f3fc', textAlign: 'center', marginTop: 20 },
});