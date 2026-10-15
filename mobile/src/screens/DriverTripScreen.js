import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  BackHandler,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { apiFetch } from '../../api';
import Button from '../components/Button';

// view: 'loading' | 'none' | 'pending' | 'rejected' | 'ready' | 'error'
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

  // Shared chrome: gradient header + centered card, with Log out in the header.
  function shell(children) {
    return (
      <LinearGradient colors={['#0f172a', '#1e293b']} style={s.flex}>
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
        <Text style={s.errorText}>{error}</Text>
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
        <TouchableOpacity style={s.refresh} onPress={onOpenStatus}>
          <Text style={s.refreshText}>My status &amp; license</Text>
        </TouchableOpacity>
        <View style={s.action}>
          <Button label="Refresh status" onPress={loadProfile} />
        </View>
      </View>
    );
  }

  // view === 'ready'
  return shell(
    <ScrollView
      style={s.flex}
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

      {/* ← T5: My trips — parity with the web driver home */}
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

      {error ? <Text style={s.errorText}>{error}</Text> : null}

      <TouchableOpacity style={s.refresh} onPress={onOpenStatus}>
        <Text style={s.refreshText}>My status &amp; license</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: 20, paddingBottom: 40, justifyContent: 'center', flexGrow: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 8,
  },
  headerTitle: { color: '#e2e8f0', fontSize: 16, fontWeight: '600' },
  headerAction: { color: '#f59e0b', fontSize: 14, fontWeight: '600' },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 18,
    marginBottom: 14,
    width: '100%',
    maxWidth: 480,
  },
  cardTitle: { color: '#f8fafc', fontSize: 17, fontWeight: '700', marginBottom: 8 },
  cardText: { color: '#cbd5e1', fontSize: 14, lineHeight: 21, marginBottom: 4 },
  action: { marginTop: 12, width: '100%', maxWidth: 480 },
  errorText: { color: '#fca5a5', fontSize: 14, lineHeight: 21, textAlign: 'center', marginBottom: 12 },
  refresh: { alignSelf: 'center', paddingVertical: 10 },
  refreshText: { color: '#f59e0b', fontSize: 14, fontWeight: '600' },
});