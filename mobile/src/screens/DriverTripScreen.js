import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { apiFetch } from '../../api';
import Button from '../components/Button';

// view: 'loading' | 'none' | 'pending' | 'rejected' | 'ready' | 'error'
// ← T4: onOpenStatus lets App.js switch to the driver status screen
export default function DriverTripScreen({ token, onSessionExpired, onLogout, onOpenStatus }) {
  const [view, setView] = useState('loading');
  const [trip, setTrip] = useState(null); // active trip or null
  const [trips, setTrips] = useState([]); // ← T5: last 5 trips (contract entry 18)
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
        await loadTrips(); // ← T5: fill the My trips list on first render
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

  // ← T5: the caller's own last 5 trips, newest first (contract entry 18)
  async function loadTrips() {
    const r = await apiFetch('/api/driver/trips', token);
    if (r.status === 401) return onSessionExpired();
    if (r.ok) setTrips(r.data.trips || []);
  }

  async function startTrip() {
    setBusy(true);
    setError('');
    try {
      const r = await apiFetch('/api/driver/trips/start', token, { method: 'POST' });
      if (r.status === 401) return onSessionExpired();
      if (r.status === 201) {
        setTrip(r.data.trip);
        await loadTrips(); // ← T5: the trip we just started is row 1
      } else if (r.status === 409) {
        await loadTrip(); // started elsewhere (other tab) → sync UI
        await loadTrips(); // ← T5
      } else if (r.status === 403 || r.status === 404) {
        await loadProfile(); // status may have changed
      } else {
        setError(r.data.error || `Could not start the trip (${r.status}).`);
      }
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
      if (r.status === 200) {
        setTrip(null);
        await loadTrips(); // ← T5: that row flips from "Active" to an end time
      } else if (r.status === 404) {
        await loadTrip(); // already stopped elsewhere → sync UI
        await loadTrips(); // ← T5
      } else {
        setError(r.data.error || `Could not stop the trip (${r.status}).`);
      }
    } catch (e) {
      setError('Cannot reach the server. Check Wi-Fi and that the web server is running.');
    } finally {
      setBusy(false);
    }
  }

  // UTC from the API → local time; tolerates "YYYY-MM-DD HH:MM:SS" or ISO.
  function fmtTime(iso) {
    if (!iso) return '—';
    const raw = String(iso);
    const d = new Date(raw.replace(' ', 'T') + (raw.endsWith('Z') ? '' : 'Z'));
    return isNaN(d.getTime()) ? raw : d.toLocaleString();
  }

  // Shared chrome: gradient + header with Log out.
  function shell(children) {
    return (
      <LinearGradient colors={['#0f172a', '#1e293b']} style={s.screen}>
        <View style={s.header}>
          <Text style={s.headerTitle}>Driver</Text>
          <TouchableOpacity onPress={onLogout} hitSlop={12}>
            <Text style={s.headerAction}>Log out</Text>
          </TouchableOpacity>
        </View>
        {children}
      </LinearGradient>
    );
  }

  if (view === 'loading') {
    return shell(
      <View style={s.center}>
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  if (view === 'error') {
    return shell(
      <View style={s.center}>
        <Text style={s.error}>{error}</Text>
        <View style={s.action}>
          <Button label="Retry" onPress={loadProfile} />
        </View>
      </View>
    );
  }

  if (view === 'none') {
    return shell(
      <View style={s.center}>
        <View style={s.card}>
          <Text style={s.cardTitle}>No driver profile</Text>
          <Text style={s.cardText}>
            This account has no driver profile yet. Create one on the BusBuddy website, then come
            back and refresh.
          </Text>
        </View>
        <View style={s.action}>
          <Button label="Refresh status" onPress={loadProfile} />
        </View>
      </View>
    );
  }

  if (view === 'pending' || view === 'rejected') {
    const pending = view === 'pending';
    return shell(
      <View style={s.center}>
        <View style={s.card}>
          <Text style={s.cardTitle}>{pending ? '⏳ Pending approval' : '✗ Rejected'}</Text>
          <Text style={s.cardText}>
            {pending
              ? 'Your driver profile is waiting for an admin to verify it. You can start trips once it is verified.'
              : 'Your driver profile was rejected by an admin. Contact the BusBuddy team to have it reviewed again.'}
          </Text>
        </View>

        {error !== '' && <Text style={s.error}>{error}</Text>}

        {/* ← T4: same entry point from every view, so pending/rejected drivers can see their status + license */}
        {onOpenStatus && (
          <TouchableOpacity onPress={onOpenStatus}>
            <Text style={s.refresh}>My status & license</Text>
          </TouchableOpacity>
        )}

        <View style={s.action}>
          <Button label="Refresh status" onPress={loadProfile} />
        </View>
      </View>
    );
  }

  // view === 'ready'
  return shell(
    <ScrollView
      style={s.screen}
      contentContainerStyle={s.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.card}>
        <Text style={s.cardTitle}>{trip ? 'Trip in progress' : 'No active trip'}</Text>
        <Text style={s.cardText}>
          {trip
            ? `Started at ${fmtTime(trip.start_time)}. Passengers can see your location while the trip is running.`
            : 'Start a trip when you pick up passengers. Your location is shared with them until you stop.'}
        </Text>
        <View style={s.action}>
          <Button
            label={trip ? 'Stop trip' : 'Start trip'}
            onPress={trip ? stopTrip : startTrip}
            loading={busy}
          />
        </View>
      </View>

      {/* ← T5: My trips — parity with the web driver home (contract entry 18) */}
      <View style={s.card}>
        <Text style={s.cardTitle}>My trips</Text>
        {trips.length === 0 ? (
          <Text style={s.cardText}>No trips yet.</Text>
        ) : (
          trips.map((t) => (
            <Text key={t.id} style={s.cardText}>
              {fmtTime(t.start_time)} → {t.end_time ? fmtTime(t.end_time) : 'Active'}
            </Text>
          ))
        )}
      </View>

      {error !== '' && <Text style={s.error}>{error}</Text>}

      {/* ← T4 : verified drivers get the same link (trip screen stays the trip screen) */}
      {onOpenStatus && (
        <TouchableOpacity onPress={onOpenStatus}>
          <Text style={s.refresh}>My status & license</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={loadProfile}>
        <Text style={s.refresh}>Refresh status</Text>
      </TouchableOpacity>
    </ScrollView>
  );
} 

const s = StyleSheet.create({
  screen: { flex: 1 },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 8,
  },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  headerAction: { color: '#a5f3fc', fontSize: 14, fontWeight: '600' },
  card: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(191,219,254,0.7)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 6 },
  cardText: { color: '#e0f2fe', fontSize: 14, lineHeight: 20 },
  action: { marginTop: 12 },
  error: { color: '#fecaca', textAlign: 'center', marginBottom: 12 },
  refresh: { color: '#a5f3fc', textAlign: 'center', marginTop: 20 },
});