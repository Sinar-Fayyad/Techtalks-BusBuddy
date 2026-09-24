'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../auth-context';
import Button from '@/components/Button';
import ErrorMessage from '@/components/ErrorMessage';

interface TripInfo {
  id: number;
  driver_id: number;
  start_time: string;
  end_time: string | null;
}

export default function StudentHomePage() {
  const router = useRouter();
  const { token, role, ready, logout } = useAuth();
  const [trip, setTrip] = useState<TripInfo | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');

  // --- SESSION GUARD: same as driver home ---
  useEffect(() => {
    if (ready && !token) router.replace('/login');
  }, [ready, token, router]);

  // --- LOAD MY TRIP: decode the JWT to get my own userId ---
  useEffect(() => {
    if (!ready || !token || role !== 'student') return;
    (async () => {
      try {
        const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const me = JSON.parse(atob(base64));
        const res = await fetch(`/api/students/${me.userId}/trip-status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) { logout(); return; }
        if (!res.ok) { setError('Could not load your trip status'); setLoaded(true); return; }
        const data = await res.json();
        setTrip(data.trip);
        setLoaded(true);
      } catch (err) {
        console.error('Trip status failed:', err);
        setError('Server error — is the dev server running?');
        setLoaded(true);
      }
    })();
  }, [ready, token, role, logout]);

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

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bb-bg-gradient)', color: 'var(--bb-text)', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <Button color="primary" onClick={logout}>Logout</Button>
        </div>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>My Trip</h1>
        <p style={{ color: 'var(--bb-text-dim)', margin: 0 }}>Student</p>

        <div style={{ height: 16 }} />
        <ErrorMessage message={error} />
        {!loaded && !error && <p style={{ color: 'var(--bb-text-dim)' }}>Loading…</p>}

        {loaded && active && (
          <section style={{ background: 'var(--bb-card-bg)', border: '1px solid var(--bb-link)', borderRadius: 16, padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.75rem 0' }}>🚌 Trip in progress</h2>
            <p style={{ color: 'var(--bb-text-dim)', margin: 0 }}>
              Started at {new Date(trip!.start_time).toLocaleTimeString()} (UTC)
            </p>
          </section>
        )}

        {loaded && ended && (
          <section style={{ background: 'var(--bb-card-bg)', border: '1px solid var(--bb-link)', borderRadius: 16, padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.75rem 0' }}>✅ Trip ended</h2>
            <p style={{ color: 'var(--bb-text-dim)', margin: 0 }}>
              Started {new Date(trip!.start_time).toLocaleTimeString()} · Ended {new Date(trip!.end_time!).toLocaleTimeString()} (UTC)
            </p>
          </section>
        )}

        {loaded && !trip && (
          <section style={{ background: 'var(--bb-card-bg)', border: '1px solid var(--bb-link)', borderRadius: 16, padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.75rem 0' }}>No trip right now</h2>
            <p style={{ color: 'var(--bb-text-dim)', margin: 0 }}>
              You're not assigned to any trip at the moment. Check back later.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
