'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../auth-context';
import Button from '@/components/Button';
import ErrorMessage from '@/components/ErrorMessage';

interface DriverInfo {
  name: string;
  email: string;
  status: 'pending' | 'verified' | 'rejected';
}

interface TripInfo {
  id: number;
  start_time: string;
  end_time: string | null;
}

export default function DriverHomePage() {
  const router = useRouter();
  const { token, role, ready, logout } = useAuth();
  const [driver, setDriver] = useState<DriverInfo | null>(null);
  const [onTrip, setOnTrip] = useState(false);
  const [lastTrip, setLastTrip] = useState<TripInfo | null>(null);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);

  // --- SESSION GUARD: identical to status page ---
  useEffect(() => {
    if (ready && !token) router.replace('/login');
  }, [ready, token, router]);

  // --- LOAD PROFILE: same fetch pattern as status page ---
  useEffect(() => {
    if (!ready || !token || role !== 'driver') return;
    (async () => {
      try {
        const res = await fetch('/api/driver/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) { logout(); return; }
        if (!res.ok) { setError('Could not load your profile'); return; }
        const data = await res.json();
        setDriver(data.driver);
      } catch {
        setError('Server error — is the dev server running?');
      }
    })();
  }, [ready, token, role, logout]);

  // --- START: endpoint 9. 409 = already on a trip → friendly + flip to Stop ---
  const startTrip = async () => {
    setError('');
    setStarting(true);
    try {
      const res = await fetch('/api/driver/trips/start', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { logout(); return; }
      if (res.status === 409) {
        setOnTrip(true);
        setError('You already have an active trip — stop it first.');
        return;
      }
      if (!res.ok) { setError('Could not start the trip. Try again.'); return; }
      const data = await res.json();
      setLastTrip(data.trip);
      setOnTrip(true);
    } catch {
      setError('Server error — is the dev server running?');
    } finally {
      setStarting(false);
    }
  };

  // --- STOP: endpoint 10. 404 = nothing to stop → friendly + flip back ---
  const stopTrip = async () => {
    setError('');
    setStopping(true);
    try {
      const res = await fetch('/api/driver/trips/stop', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { logout(); return; }
      if (res.status === 404) {
        setOnTrip(false);
        setError('No active trip found — nothing to stop.');
        return;
      }
      if (!res.ok) { setError('Could not stop the trip. Try again.'); return; }
      const data = await res.json();
      setLastTrip(data.trip);
      setOnTrip(false);
    } catch {
      setError('Server error — is the dev server running?');
    } finally {
      setStopping(false);
    }
  };

  if (ready && token && role !== 'driver') {
    return (
      <main style={{ minHeight: '100vh', padding: '2rem', color: 'var(--text-muted)' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Access denied</h1>
        <p style={{ marginTop: '0.5rem' }}>This page is for drivers only.</p>
        <Button color="primary" onClick={logout}>Log out</Button>
      </main>
    );
  }

  if (!ready || !token) {
    return <main style={{ minHeight: '100vh', padding: '2rem', color: 'var(--text-muted)' }}>Checking session…</main>;
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const verified = driver?.status === 'verified';

  return (
    <main style={{
      minHeight: '100vh',
      background: 'var(--bb-bg-gradient)',
      color: 'var(--bb-text)',
      padding: '2rem 1rem',
    }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <Button color="primary" onClick={logout}>Logout</Button>
        </div>

        {/* --- HEADER per mockup screen 1 --- */}
        <p style={{ color: 'var(--bb-text-dim)', margin: 0 }}>{greeting},</p>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: '0.25rem 0 0.25rem 0' }}>{driver?.name ?? '…'}</h1>
        <p style={{ color: 'var(--bb-text-dim)', margin: 0 }}>
          Driver · {verified ? '✅ Verified' : driver ? `Status: ${driver.status}` : ''}

        </p>
        <a href="/driver/status" style={{ color: 'var(--bb-link)', fontSize: '0.9rem' }}>My status & license →</a>

        <div style={{ height: 16 }} />
        <ErrorMessage message={error} />
        {!driver && !error && <p style={{ color: 'var(--bb-text-dim)' }}>Loading…</p>}

        {/* --- CRITERION 2: buttons only for verified drivers --- */}
        {driver && verified && (
          <section style={{
            background: 'var(--bb-card-bg)',
            border: '1px solid var(--bb-link)',
            borderRadius: 16,
            padding: '1.5rem',
          }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.75rem 0' }}>
              {onTrip ? 'Trip in progress' : 'Next Trip'}
            </h2>
            {lastTrip && (
              <p style={{ color: 'var(--bb-text-dim)', margin: '0 0 1rem 0' }}>
                {lastTrip.end_time
                  ? `Last trip: started ${new Date(lastTrip.start_time).toLocaleTimeString()} · ended ${new Date(lastTrip.end_time).toLocaleTimeString()}`
                  : `Started at ${new Date(lastTrip.start_time).toLocaleTimeString()} (UTC)`}
              </p>
            )}
            {onTrip ? (
              <Button color="primary" onClick={stopTrip}>{stopping ? 'Stopping…' : '⏹ Stop Trip'}</Button>
            ) : (
              <Button color="primary" onClick={startTrip}>{starting ? 'Starting…' : '▶ Start Trip'}</Button>
            )}
          </section>
        )}

        {driver && !verified && (
          <section style={{
            background: 'var(--bb-card-bg)',
            border: '1px solid var(--bb-link)',
            borderRadius: 16,
            padding: '1.5rem',
          }}>
            <p style={{ margin: 0, color: 'var(--bb-text-dim)' }}>
              {driver.status === 'pending'
                ? 'Your license is under review — trip controls unlock once an admin verifies you.'
                : 'Your registration was rejected — trip controls are unavailable. Contact the admin team.'}
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
