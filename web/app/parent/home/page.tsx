'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../auth-context';
import Button from '@/components/Button';
import ErrorMessage from '@/components/ErrorMessage';

interface Child { id: number; name: string; email: string; }
interface TripInfo { id: number; driver_id: number; start_time: string; end_time: string | null; }

export default function ParentHomePage() {
  const router = useRouter();
  const { token, role, ready, logout } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [childrenLoaded, setChildrenLoaded] = useState(false);
  const [trip, setTrip] = useState<TripInfo | null>(null);
  const [tripLoaded, setTripLoaded] = useState(false);
  const [error, setError] = useState('');

  // --- SESSION GUARD ---
  useEffect(() => {
    if (ready && !token) router.replace('/login');
  }, [ready, token, router]);

  // --- LOAD my linked children (entry 15) ---
  useEffect(() => {
    if (!ready || !token || role !== 'parent') return;
    (async () => {
      try {
        const res = await fetch('/api/parents/me/children', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) { logout(); return; }
        if (!res.ok) { setError('Could not load your children'); setChildrenLoaded(true); return; }
        const data = await res.json();
        setChildren(data.children ?? []);
        setSelectedId(data.children?.[0]?.id ?? null);
        setChildrenLoaded(true);
      } catch (err) {
        console.error('Load children failed:', err);
        setError('Server error — is the dev server running?');
        setChildrenLoaded(true);
      }
    })();
  }, [ready, token, role, logout]);

  // --- LOAD the selected child's trip (entry 14) ---
  useEffect(() => {
    if (!selectedId || !token) return;
    setTripLoaded(false);
    (async () => {
      try {
        const res = await fetch(`/api/students/${selectedId}/trip-status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) { logout(); return; }
        if (!res.ok) { setError('Could not load the trip status'); setTripLoaded(true); return; }
        const data = await res.json();
        setTrip(data.trip);
        setTripLoaded(true);
      } catch (err) {
        console.error('Load trip failed:', err);
        setError('Server error — is the dev server running?');
        setTripLoaded(true);
      }
    })();
  }, [selectedId, token, logout]);

  // --- WRONG ROLE → Access denied ---
  if (ready && token && role !== 'parent') {
    return (
      <main style={{ minHeight: '100vh', padding: '2rem', color: 'var(--text-muted)' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Access denied</h1>
        <p style={{ marginTop: '0.5rem' }}>This page is for parents only.</p>
        <Button color="primary" onClick={logout}>Log out</Button>
      </main>
    );
  }

  if (!ready || !token) {
    return <main style={{ minHeight: '100vh', padding: '2rem', color: 'var(--text-muted)' }}>Checking session…</main>;
  }

  const child = children.find((c) => c.id === selectedId) ?? null;
  const active = trip !== null && trip.end_time === null;
  const ended = trip !== null && trip.end_time !== null;
  const badge = { display: 'inline-block', borderRadius: 999, padding: '4px 12px', fontSize: '0.85rem', fontWeight: 600, color: '#fff' } as const;

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bb-bg-gradient)', color: 'var(--bb-text)', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <Button color="primary" onClick={logout}>Logout</Button>
        </div>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>Parent Home</h1>
        <p style={{ color: 'var(--bb-text-dim)', margin: 0 }}>Track your child&apos;s trip</p>

        <div style={{ height: 16 }} />
        <ErrorMessage message={error} />
        {!childrenLoaded && !error && <p style={{ color: 'var(--bb-text-dim)' }}>Loading…</p>}

        {/* --- NO CHILD LINKED (mockup screen 6) --- */}
        {childrenLoaded && children.length === 0 && (
          <section style={{ background: 'var(--bb-card-bg)', border: '1px solid var(--bb-link)', borderRadius: 16, padding: '2rem 1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem' }}>👤</div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0.75rem 0 0.5rem 0' }}>No child linked</h2>
            <p style={{ color: 'var(--bb-text-dim)', margin: 0 }}>Add your child to start tracking their trip.</p>
          </section>
        )}

        {/* --- MULTIPLE CHILDREN: simple selector --- */}
        {children.length > 1 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {children.map((c) => (
              <button key={c.id} onClick={() => setSelectedId(c.id)}
                style={{ padding: '6px 12px', borderRadius: 999, cursor: 'pointer', border: '1px solid var(--bb-link)',
                  background: c.id === selectedId ? 'var(--bb-link)' : 'transparent',
                  color: c.id === selectedId ? '#fff' : 'var(--bb-text)' }}>
                {c.name}
              </button>
            ))}
          </div>
        )}

        {/* --- CHILD CARD + TRIP STATUS --- */}
        {child && (
          <section style={{ background: 'var(--bb-card-bg)', border: '1px solid var(--bb-link)', borderRadius: 16, padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--bb-link)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                {child.name.charAt(0)}
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 700 }}>{child.name}</p>
                <p style={{ margin: 0, color: 'var(--bb-text-dim)', fontSize: '0.85rem' }}>{child.email}</p>
              </div>
            </div>

            {!tripLoaded && <p style={{ color: 'var(--bb-text-dim)', margin: 0 }}>Loading trip…</p>}

            {tripLoaded && active && (
              <>
                <span style={{ ...badge, background: '#1f9d55' }}>🚌 In Transit</span>
                <p style={{ color: 'var(--bb-text-dim)', margin: '0.75rem 0 0 0' }}>
                  Started at {new Date(trip!.start_time).toLocaleTimeString()} (UTC)
                </p>
              </>
            )}

            {tripLoaded && ended && (
              <>
                <span style={{ ...badge, background: '#4a5568' }}>✅ Trip ended</span>
                <p style={{ color: 'var(--bb-text-dim)', margin: '0.75rem 0 0 0' }}>
                  Started {new Date(trip!.start_time).toLocaleTimeString()} · Ended {new Date(trip!.end_time!).toLocaleTimeString()} (UTC)
                </p>
              </>
            )}

            {tripLoaded && !trip && (
              <>
                <span style={{ ...badge, background: '#4a5568' }}>🗓 No trip today</span>
                <p style={{ color: 'var(--bb-text-dim)', margin: '0.75rem 0 0 0' }}>
                  Your child has no trip assigned right now.
                </p>
              </>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
