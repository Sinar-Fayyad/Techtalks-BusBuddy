'use client';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../auth-context';
import Button from '@/components/Button';
import ErrorMessage from '@/components/ErrorMessage';
import { useCallback, useEffect, useRef, useState } from 'react';
import LiveBusMap from '@/components/LiveBusMap';

interface TripInfo {
  id: number;
  driver_id: number;
  start_time: string;
  end_time: string | null;
  latitude: string | null;
  longitude: string | null;
  location_updated_at: string | null;
}


function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '0.5rem 0', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
      <span style={{ color: 'var(--bb-text-dim)', fontSize: '0.9rem' }}>{label}</span>
      <span style={{ fontWeight: 600, fontSize: '0.9rem', textAlign: 'right' }}>{value}</span>
    </div>
  );
}

export default function StudentHomePage() {
  const router = useRouter();
  const { token, role, ready, logout } = useAuth();
  const [trip, setTrip] = useState<TripInfo | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // --- SESSION GUARD ---
  useEffect(() => {
    if (ready && !token) router.replace('/login');
  }, [ready, token, router]);

  // --- LOAD MY TRIP ---
  const busyRef = useRef(false);

  const loadTrip = useCallback(async (silent = false) => {
    if (!token || busyRef.current) return;
    busyRef.current = true;
    if (!silent) { setError(''); setLoaded(false); }
    try {
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const me = JSON.parse(atob(base64));
      const res = await fetch(`/api/students/${me.userId}/trip-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { logout(); return; }
      if (!res.ok) {
        if (!silent) setError('Something went wrong — we could not load your trip status.');
        else console.error('Trip status poll failed:', res.status);
        return;
      }
      const data = await res.json();
      setTrip(data.trip);
      setLastUpdated(new Date());
      setError('');
    } catch (err) {
      console.error('Trip status failed:', err);
      if (!silent) setError('Server error — is the dev server running?');
    } finally {
      busyRef.current = false;
      setLoaded(true);
    }
  }, [token, logout]);

  // T12: true only while an ACTIVE trip is on screen — gates the polling interval.
  const activeTrip = trip !== null && trip.end_time === null;

  // --- INITIAL LOAD (unchanged behavior) ---
  useEffect(() => {
    if (!ready || !token || role !== 'student') return;
    loadTrip();
  }, [ready, token, role, loadTrip]);

  // --- T7/F1 POLLING: interval ALWAYS runs once the student session is live.
  //     No active trip → slow 30s poll (a new trip is detected without refresh).
  //     Active trip → fast 10s poll (live map).
  //     activeTrip flips → effect re-runs: cleanup clears the old interval, so
  //     exactly ONE interval ever exists (no overlaps). Unmount → same cleanup.
  //     Trip ends → activeTrip false → 10s interval destroyed, 30s resumes (no zombies). ---
  useEffect(() => {
    if (!ready || !token || role !== 'student') return;
    const id = setInterval(() => { void loadTrip(true); }, activeTrip ? 10_000 : 30_000);
    return () => clearInterval(id);
  }, [ready, token, role, loadTrip, activeTrip]);

  // --- WRONG ROLE → Access denied ---
  if (ready && token && role !== 'student') {
    return (
      <main style={{ minHeight: '100vh', padding: '2rem', color: 'var(--text-muted)' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Access denied</h1>
        <p style={{ marginTop: '0.5rem' }}>This page is for students only.</p>
        <Button color="primary" onClick={logout}>Log out</Button>
      </main>
    );
  }

  if (!ready || !token) {
    return <main style={{ minHeight: '100vh', padding: '2rem', color: 'var(--text-muted)' }}>Checking session…</main>;
  }

  const active = trip !== null && trip.end_time === null;
  const ended = trip !== null && trip.end_time !== null;

  const card = {
    background: 'var(--bb-card-bg, var(--bb-card-bg-fallback))',
    border: '1px solid var(--bb-link)',
    borderRadius: 18,
    padding: '1.25rem',
    marginBottom: '1rem',
  };

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bb-bg-gradient)', color: 'var(--bb-text)', padding: '1.25rem 1rem 2.5rem' }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        {/* --- HEADER --- */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <p style={{ margin: 0, color: 'var(--bb-text-dim)', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Student</p>
            <h1 style={{ margin: '0.1rem 0 0', fontSize: '1.6rem', fontWeight: 700 }}>Trip Status</h1>
          </div>
          <Button color="primary" onClick={logout}>Logout</Button>
        </header>

        <ErrorMessage message={error} />

        {/* --- LOADING --- */}
        {!loaded && !error && (
          <section style={card}>
            <p style={{ margin: 0, color: 'var(--bb-text-dim)' }}>Loading trip status…</p>
          </section>
        )}

        {/* --- ACTIVE / ENDED --- */}
        {loaded && trip && (
          <>
            <section style={{ ...card, textAlign: 'center' }}>
              <span style={{
                display: 'inline-block', borderRadius: 999, padding: '6px 14px',
                fontSize: '0.8rem', fontWeight: 700,
                background: active ? 'var(--success)' : 'var(--navy)',
              }}>
                {active ? '🚌 Trip in progress' : '✅ Trip completed'}
              </span>
              <h2 style={{ margin: '0.9rem 0 0.25rem 0', fontSize: '2rem', fontWeight: 700 }}>
                {new Date(active ? trip.start_time : trip.end_time!).toLocaleTimeString()}
              </h2>
              <p style={{ margin: 0, color: 'var(--bb-text-dim)' }}>
                {active ? 'Your bus is currently on the way.' : 'Your trip has been completed.'}
              </p>
            </section>
            {active && (
              <section style={card}>
                <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem', fontWeight: 700 }}>Live location</h2>
                <LiveBusMap
                  latitude={trip.latitude === null ? null : Number(trip.latitude)}
                  longitude={trip.longitude === null ? null : Number(trip.longitude)}
                  locationUpdatedAt={trip.location_updated_at}
                  staleAfterMs={30_000}
                />
              </section>
            )}


            <section style={card}>
              <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem', fontWeight: 700 }}>Trip Summary</h2>
              <Row label="Status" value={active ? 'Active' : 'Completed'} />
              <Row label="Started" value={new Date(trip.start_time).toLocaleString()} />
              {ended && <Row label="Ended" value={new Date(trip.end_time!).toLocaleString()} />}
              <Row label="Trip ID" value={`#${trip.id}`} />
            </section>
          </>
        )}

        {/* --- NO TRIP --- */}
        {loaded && !trip && (
          <section style={{ ...card, textAlign: 'center' }}>
            <div style={{ fontSize: '2.25rem' }}>🗓</div>
            <span style={{
              display: 'inline-block', marginTop: 10, borderRadius: 999, padding: '6px 14px',
              fontSize: '0.8rem', fontWeight: 700, background: 'rgba(255,255,255,0.15)',
            }}>
              No trip scheduled
            </span>
            <p style={{ margin: '0.9rem 0 0', color: 'var(--bb-text-dim)' }}>
              You don&apos;t have a trip assigned right now.
            </p>
          </section>
        )}

        {/* --- ERROR + RETRY --- */}
        {loaded && error && (
          <section style={{ ...card, textAlign: 'center' }}>
            <div style={{ fontSize: '2.25rem' }}>⚠️</div>
            <p style={{ margin: '0.5rem 0 1rem 0', color: 'var(--bb-text-dim)' }}>
              We couldn&apos;t load your trip status.
            </p>
            <Button color="primary" onClick={loadTrip}>Retry</Button>
          </section>
        )}

        {/* --- FOOTER: last updated + refresh --- */}
        {loaded && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
            <small style={{ color: 'var(--bb-text-dim)' }}>
              Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : '—'}
            </small>
            <Button color="primary" onClick={loadTrip}>Refresh</Button>
          </div>
        )}
      </div>
    </main>
  );
}