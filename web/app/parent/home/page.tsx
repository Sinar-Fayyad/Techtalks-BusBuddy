'use client';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../auth-context';
import Button from '@/components/Button';
import ErrorMessage from '@/components/ErrorMessage';
import LiveBusMap from '@/components/LiveBusMap/index';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import styles from './page.module.css';

interface Child { id: number; name: string; email: string; }
interface TripInfo {
  id: number;
  driver_id: number;
  start_time: string;
  end_time: string | null;
  latitude: string | null;
  longitude: string | null;
  location_updated_at: string | null;
}

// Entry 14 returns UTC strings; without the "Z" JS would read them as local time.
function fmtTime(value: string) {
  const raw = String(value);
  const d = new Date(raw.replace(' ', 'T') + (raw.endsWith('Z') ? '' : 'Z'));
  return isNaN(d.getTime()) ? raw : d.toLocaleTimeString();
}

type ChildStatus = 'loading' | 'active' | 'none' | 'ended';

export default function ParentHomePage() {
  const router = useRouter();
  const { token, role, ready, logout } = useAuth();

  const [children, setChildren] = useState<Child[]>([]);
  const [childrenLoaded, setChildrenLoaded] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [trips, setTrips] = useState<Record<number, TripInfo | null>>({});
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

  // --- T8: one entry-14 call per child → badge on every row + the banner count ---
  const loadTrips = useCallback(async (list: Child[]) => {
    if (!token) return;
    if (list.length === 0) { setTrips({}); return; }
    try {
      const pairs = await Promise.all(
        list.map(async (c): Promise<[number, TripInfo | null]> => {
          const res = await fetch(`/api/students/${c.id}/trip-status`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.status === 401) { logout(); return [c.id, null]; }
          if (!res.ok) { console.error('Trip-status lookup failed:', c.id, res.status); return [c.id, null]; }
          const data = await res.json();
          return [c.id, data.trip ?? null];
        })
      );
      const map: Record<number, TripInfo | null> = {};
      for (const [id, t] of pairs) map[id] = t;
      setTrips(map);
    } catch (err) {
      console.error('Load trips failed:', err);
      setError('Server error — is the dev server running?');
    }
  }, [token, logout]);

  // --- LOAD my linked children (entry 15), then their trips ---
  const loadChildren = useCallback(async () => {
    if (!token || role !== 'parent') return;
    try {
      const res = await fetch('/api/parents/me/children', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { logout(); return; }
      if (!res.ok) { setError('Could not load your children'); setChildrenLoaded(true); return; }
      const data = await res.json();
      const list: Child[] = data.children ?? [];
      setChildren(list);
      setSelectedId((current) =>
        list.some((c) => c.id === current) ? current : (list[0]?.id ?? null)
      );
      setChildrenLoaded(true);
      await loadTrips(list);
    } catch (err) {
      console.error('Load children failed:', err);
      setError('Server error — is the dev server running?');
      setChildrenLoaded(true);
    }
  }, [token, role, logout, loadTrips]);

  useEffect(() => {
    if (ready) loadChildren();
  }, [ready, loadChildren]);

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
      if (res.status === 401) { logout(); return; }
      if (!res.ok) {
        // 400 invalid body · 403 target not a student · 404 no account · 409 already linked · 500
        setLinkError(data.error ?? data.message ?? 'Could not link this child right now');
        return;
      }
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

  // --- DERIVED ---
  const statusOf = (id: number): ChildStatus => {
    if (!(id in trips)) return 'loading';
    const t = trips[id];
    if (t === null) return 'none';
    return t.end_time === null ? 'active' : 'ended';
  };
  const labelOf: Record<Exclude<ChildStatus, 'loading'>, string> = {
    active: '🚌 In transit',
    none: '🗓 Idle',
    ended: '✅ Arrived',
  };
  const classOf: Record<Exclude<ChildStatus, 'loading'>, string> = {
    active: styles.badge_active,
    none: styles.badge_none,
    ended: styles.badge_ended,
  };

  const inTransitCount = children.filter((c) => trips[c.id] && trips[c.id]!.end_time === null).length;
  const child = children.find((c) => c.id === selectedId) ?? null;
  const selectedTrip = child ? trips[child.id] : undefined; // undefined = not loaded yet
  const selectedReady = child ? child.id in trips : false;
  const firstInTransit = children.find((c) => trips[c.id] && trips[c.id]!.end_time === null) ?? null;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>{greeting}</p>
            <h1 className={styles.title}>Parent Home</h1>
          </div>
          <Button color="primary" onClick={logout}>Logout</Button>
        </header>
        <p className={styles.subtitle}>Your children are safe with us.</p>

        <ErrorMessage message={error} />
        {linkNotice && <ErrorMessage message={linkNotice} />}
        {!childrenLoaded && !error && <p className={styles.muted}>Loading…</p>}

        {/* --- NO CHILD LINKED --- */}
        {childrenLoaded && children.length === 0 && (
          <section className={styles.emptyCard}>
            <div className={styles.emptyIcon}>👤</div>
            <h2 className={styles.sectionTitle}>No child linked</h2>
            <p className={styles.muted}>Add your child to start tracking their trip.</p>
            <div className={styles.centerRow}>
              <Button color="primary" onClick={() => setShowLink(true)}>+ Add child</Button>
            </div>
          </section>
        )}

        {/* --- TRACKING ACTIVE BANNER (only when at least one child is in transit) --- */}
        {childrenLoaded && inTransitCount > 0 && (
          <section className={styles.banner}>
            <span className={styles.bannerIcon}>🛡️</span>
            <div>
              <p className={styles.bannerTitle}>Tracking Active</p>
              <p className={styles.bannerSub}>
                {inTransitCount} {inTransitCount === 1 ? 'child' : 'children'} in transit
              </p>
            </div>
          </section>
        )}

        {/* --- MY CHILDREN (the selector) --- */}
        {children.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>My Children</h2>
            <div className={styles.childList}>
              {children.map((c) => {
                const st = statusOf(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedId(c.id)}
                    className={`${styles.childCard} ${c.id === selectedId ? styles.childCardActive : ''}`}
                  >
                    <span className={styles.avatar}>{c.name.charAt(0)}</span>
                    <span className={styles.childInfo}>
                      <span className={styles.childName}>{c.name}</span>
                      <span className={styles.childEmail}>{c.email}</span>
                    </span>
                    {st !== 'loading' && (
                      <span className={`${styles.badge} ${classOf[st]}`}>{labelOf[st]}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* --- SELECTED CHILD: TRIP STATES (unchanged behavior) --- */}
        {child && (
          <section className={styles.card}>
            <h2 className={styles.sectionTitle}>{child.name}&apos;s trip</h2>
            {!selectedReady && <p className={styles.muted}>Loading trip…</p>}

            {selectedReady && selectedTrip && selectedTrip.end_time === null && (
              <>
                <span className={`${styles.badge} ${styles.badge_active}`}>🚌 In transit</span>
                <p className={styles.muted}>Started at {fmtTime(selectedTrip.start_time)}</p>
              </>
            )}

            {selectedReady && selectedTrip && selectedTrip.end_time !== null && (
              <>
                <span className={`${styles.badge} ${styles.badge_ended}`}>✅ Trip ended</span>
                <p className={styles.muted}>
                  Started {fmtTime(selectedTrip.start_time)} · Ended {fmtTime(selectedTrip.end_time)}
                </p>
              </>
            )}

            {selectedReady && selectedTrip === null && (
              <>
                <span className={`${styles.badge} ${styles.badge_none}`}>🗓 No trip today</span>
                <p className={styles.muted}>Your child has no trip assigned right now.</p>
              </>
            )}
          </section>
        )}

        {/* --- LIVE MAP (selected child, only while their trip is active) --- */}
        {selectedReady && selectedTrip && selectedTrip.end_time === null && (
          <section className={styles.card}>
            <h2 className={styles.sectionTitle}>Live location</h2>
            <LiveBusMap
              latitude={selectedTrip.latitude === null ? null : Number(selectedTrip.latitude)}
              longitude={selectedTrip.longitude === null ? null : Number(selectedTrip.longitude)}
              locationUpdatedAt={selectedTrip.location_updated_at}
              staleAfterMs={30_000}
            />
          </section>
        )}

        {/* --- QUICK ACTIONS --- */}
        {children.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Quick Actions</h2>
            <div className={styles.actions}>
              <button type="button" className={styles.action} onClick={() => setShowLink(true)}>
                <span className={styles.actionIcon}>🔗</span> Link child
              </button>
              <button
                type="button"
                className={styles.action}
                disabled={!firstInTransit}
                onClick={() => firstInTransit && setSelectedId(firstInTransit.id)}
              >
                <span className={styles.actionIcon}>📍</span> View map
              </button>
            </div>
          </section>
        )}

        {/* --- T8: add a child by email (entry 12) --- */}
        {showLink && (
          <section className={styles.card}>
            <h2 className={styles.sectionTitle}>Add a child</h2>
            <p className={styles.muted}>Enter the BusBuddy email of your child&apos;s account.</p>
            <form onSubmit={submitLink} className={styles.form}>
              <input
                type="email"
                value={childEmail}
                onChange={(e) => setChildEmail(e.target.value)}
                placeholder="child@example.com"
                aria-label="Child's BusBuddy email"
                className={styles.formField}
              />
              <ErrorMessage message={linkError} />
              <div className={styles.formRow}>
                <button type="submit" disabled={linkLoading} className={styles.actionPrimary}>
                  {linkLoading ? 'Linking…' : 'Link child'}
                </button>
                <button
                  type="button"
                  className={styles.action}
                  onClick={() => { setShowLink(false); setChildEmail(''); setLinkError(''); }}
                >
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