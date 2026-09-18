'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../auth-context';
import Button from '@/components/Button';

interface DriverInfo {
  name: string;
  email: string;
  status: 'pending' | 'verified' | 'rejected';
  license_url: string;
  created_at: string;
}

interface ChecklistItem {
  label: string;
  done?: boolean;
  failed?: boolean;
  dim?: boolean;
}

const statusMeta: Record<string, { color: string; icon: string; headline: string; message: string }> = {
  pending: {
    color: 'var(--amber)',
    icon: '⏳',
    headline: 'Under review',
    message: "We're checking your license. This usually takes 1–2 days.",
  },
  verified: {
    color: 'var(--success)',
    icon: '✅',
    headline: 'Verification Approved',
    message: 'Your license has been verified. You are ready to go live.',
  },
  rejected: {
    color: 'var(--danger)',
    icon: '❌',
    headline: 'Verification Rejected',
    message: 'Your license could not be verified. Please contact the admin team.',
  },
};

export default function DriverStatusPage() {
  const router = useRouter();
  const { token, role, ready, logout } = useAuth();
  const [driver, setDriver] = useState<DriverInfo | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (ready && !token) router.replace('/login');
  }, [ready, token, router]);

  useEffect(() => {
    if (!ready || !token || role !== 'driver') return;
    (async () => {
      try {
        const res = await fetch('/api/driver/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) { logout(); return; }
        if (res.status === 404) {
          setError('No driver profile yet — complete registration first.');
          return;
        }
        if (!res.ok) { setError('Could not load your status'); return; }
        const data = await res.json();
        setDriver(data.driver);
      } catch {
        setError('Server error — is the dev server running?');
      }
    })();
  }, [ready, token, role, logout]);

  if (ready && token && role !== 'driver') {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold">Access denied</h1>
        <p className="mt-2" style={{ color: 'var(--text-muted)' }}>This page is for drivers only.</p>
        <Button color="primary" onClick={logout}>Log out</Button>
      </main>
    );
  }

  if (!ready || !token) {
    return <main className="p-8"><p style={{ color: 'var(--text-muted)' }}>Checking session…</p></main>;
  }

  const meta = driver ? statusMeta[driver.status] : null;
  const licenseName = driver?.license_url?.split('/').pop() ?? '';

  const checklist: ChecklistItem[] = [
    { label: 'Profile created', done: true },
    { label: 'License uploaded', done: true },
    {
      label: driver?.status === 'pending' ? 'Admin review — in progress' : 'Admin review',
      done: driver?.status === 'verified',
      failed: driver?.status === 'rejected',
    },
    { label: 'Go live', done: driver?.status === 'verified', dim: driver?.status !== 'verified' },
  ];

  return (
    <main style={{
      minHeight: '100vh',
      background: 'var(--bb-bg-gradient)',
      color: 'var(--bb-text)',
      padding: '2rem 1rem',
    }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 700, marginBottom: '1.5rem' }}>
          My <span style={{ color: 'var(--bb-link)' }}>Status</span>
        </h1>

        {error && <p style={{ color: 'var(--bb-error)', textAlign: 'center' }}>{error}</p>}
        {!driver && !error && <p style={{ color: 'var(--bb-text-dim)', textAlign: 'center' }}>Loading…</p>}

        {driver && meta && (
          <>
            <section style={{
              background: 'var(--bb-card-bg)',
              border: '1px solid var(--bb-link)',
              borderRadius: 16,
              padding: '1.5rem',
              textAlign: 'center',
              marginBottom: '1rem',
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{meta.icon}</div>
              <p style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>
                {meta.headline.split(' ')[0]}{' '}
                <span style={{ color: meta.color }}>
                  {meta.headline.split(' ').slice(1).join(' ')}
                </span>
              </p>
              <p style={{ color: 'var(--bb-text-dim)', marginTop: '0.5rem' }}>{meta.message}</p>

              <div style={{ textAlign: 'left', marginTop: '1.25rem', display: 'grid', gap: '0.5rem' }}>
                {checklist.map((item) => (
                  <div key={item.label} style={{ color: item.dim ? 'var(--bb-text-dim)' : 'var(--bb-text)' }}>
                    {item.failed ? '❌' : item.done ? '✅' : '⬜'} {item.label}
                  </div>
                ))}
              </div>
            </section>

            <section style={{
              background: 'var(--bb-card-bg)',
              border: '1px solid var(--bb-link)',
              borderRadius: 16,
              padding: '1.5rem',
            }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.75rem 0' }}>License Information</h2>
              <p style={{ color: 'var(--bb-text-dim)', margin: 0 }}>Driver</p>
              <p style={{ margin: '0 0 0.5rem 0' }}>{driver.name} — {driver.email}</p>
              <p style={{ color: 'var(--bb-text-dim)', margin: 0 }}>Uploaded</p>
              <p style={{ margin: '0 0 0.5rem 0' }}>{new Date(driver.created_at).toLocaleDateString()}</p>
              <p style={{ color: 'var(--bb-text-dim)', margin: 0 }}>License file</p>
              <p style={{ margin: '0 0 0.75rem 0' }}>{licenseName}</p>
              <a
                href={`http://localhost:3000/api/driver/license/${licenseName}?token=${encodeURIComponent(token!)}`}
                target="_blank"
                style={{ color: 'var(--bb-link)', fontWeight: 600, textDecoration: 'none' }}
              >
                View license file
              </a>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
