'use client';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../auth-context';
import Button from '@/components/Button';
import ErrorMessage from '@/components/ErrorMessage';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
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
    // --- T8: link-child state (POST /api/parents/me/children, entry 12) ---
  const [showLink, setShowLink] = useState(false);
  const [childEmail, setChildEmail] = useState('');
  const [linkError, setLinkError] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkNotice, setLinkNotice] = useState('');

  // --- SESSION GUARD ---
  useEffect(() => {
    if (ready && !token) router.replace('/login');
  }, [ready, token, router]);

  
  // --- LOAD my linked children (entry 15) — T8: CallableRefresh ---
  const loadChildren = useCallback(async () => {
    if (!token || role !== 'parent') return;
    try {
      const res = await fetch('/api/parents/me/children', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { logout(); return; }
      if (!res.ok) { setError('Could not load your children'); setChildrenLoaded(true); return; }
      const data = await res.json();
      setChildren(data.children ?? []);
      setSelectedId((current) =>
        data.children?.some((c: Child) => c.id === current) ? current : (data.children?.[0]?.id ?? null)
      );
      setChildrenLoaded(true);
    } catch (err) {
      console.error('Load children failed:', err);
      setError('Server error — is the dev server running?');
      setChildrenLoaded(true);
    }
  }, [token, role, logout]);

  useEffect(() => {
    if (ready) loadChildren();
  }, [ready, loadChildren]);

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
    // --- T8: register-page notice (account created, link attempt failed) ---
  useEffect(() => {
    const notice = sessionStorage.getItem('bb_link_notice');
    if (notice) {
      setLinkNotice(notice);
      sessionStorage.removeItem('bb_link_notice');
      setShowLink(true); // reopen the Add-child card so the parent can retry immediately
    }
  }, []);

  // --- T8: link child by email — POST /api/parents/me/children (contract entry 12) ---
  const submitLink = async (e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    const email = childEmail.trim();
    // Same regex as the login/register pages — fail fast, zero network requests.
    if (!/\S+@\S+\.\S+/.test(email)) {
      setLinkError('Enter a valid child email');
      return;
    }
    setLinkLoading(true);
    setLinkError('');
    try {
      const res = await fetch('/api/parents/me/children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      // Page convention: a 401 means the session died — log out.
      if (res.status === 401) { logout(); return; }
      if (!res.ok) {
        // 400 invalid body · 403 target not a student · 404 no account · 409 already linked · 500
        setLinkError(data.error ?? data.message ?? 'Could not link this child right now');
        return;
      }
      // Success case: close the card, refresh the list from the server — the
      // child chip and trip-status card appear without any page reload.
      setShowLink(false);
      setChildEmail('');
      setLinkError('');
      setLinkNotice('');
      await loadChildren();
    } catch (err) {
      console.error('Link child failed:', err);
      setLinkError('Server error — is the dev server running?');
    } finally {
      setLinkLoading(false);
    }
  };

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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <button onClick={() => setShowLink(true)}
            style={{ padding: '6px 14px', borderRadius: 999, cursor: 'pointer', border: '1px solid var(--bb-link)', background: 'transparent', color: 'var(--bb-text)' }}>
            + Add child
          </button>
          <Button color="primary" onClick={logout}>Logout</Button>
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>Parent Home</h1>
        <p style={{ color: 'var(--bb-text-dim)', margin: 0 }}>Track your child&apos;s trip</p>

        <div style={{ height: 16 }} />
        <ErrorMessage message={error} />
                {linkNotice && <ErrorMessage message={linkNotice} />}
        {!childrenLoaded && !error && <p style={{ color: 'var(--bb-text-dim)' }}>Loading…</p>}

        {/* --- NO CHILD LINKED (mockup screen 6) --- */}
        {childrenLoaded && children.length === 0 && (
          <section style={{ background: 'var(--bb-card-bg)', border: '1px solid var(--bb-link)', borderRadius: 16, padding: '2rem 1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem' }}>👤</div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0.75rem 0 0.5rem 0' }}>No child linked</h2>
            <p style={{ color: 'var(--bb-text-dim)', margin: 0 }}>Add your child to start tracking their trip.</p>
                        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
              <Button color="primary" onClick={() => setShowLink(true)}>+ Add child</Button>
            </div>
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
                {/* --- T8: add a child by email (entry 12) --- */}
        {showLink && (
          <section style={{ background: 'var(--bb-card-bg)', border: '1px solid var(--bb-link)', borderRadius: 16, padding: '1.5rem', marginTop: '1rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>Add a child</h2>
            <p style={{ color: 'var(--bb-text-dim)', margin: '0 0 0.75rem 0', fontSize: '0.85rem' }}>
              Enter the BusBuddy email of your child&apos;s account.
            </p>
            <form onSubmit={submitLink}>
              <input
                type="email"
                value={childEmail}
                onChange={(e) => setChildEmail(e.target.value)}
                placeholder="child@example.com"
                aria-label="Child's BusBuddy email"
                style={{ width: '100%', boxSizing: 'border-box', padding: '0.6rem 0.75rem', borderRadius: 10, border: '1px solid var(--bb-link)', background: 'transparent', color: 'var(--bb-text)' }}
              />
              <ErrorMessage message={linkError} />
              <div style={{ display: 'flex', gap: 8, marginTop: '0.75rem' }}>
                <button type="submit" disabled={linkLoading}
                  style={{ padding: '8px 16px', borderRadius: 999, border: '1px solid var(--bb-link)', background: 'var(--bb-link)', color: '#fff', cursor: linkLoading ? 'default' : 'pointer' }}>
                  {linkLoading ? 'Linking…' : 'Link child'}
                </button>
                <button type="button"
                  onClick={() => { setShowLink(false); setChildEmail(''); setLinkError(''); }}
                  style={{ padding: '8px 16px', borderRadius: 999, cursor: 'pointer', border: '1px solid var(--bb-link)', background: 'transparent', color: 'var(--bb-text)' }}>
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}
      </div>
    </main>
  );
}
