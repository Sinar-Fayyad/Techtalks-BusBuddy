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

const statusColors: Record<string, string> = {
  pending: 'var(--amber)',
  verified: 'var(--success)',
  rejected: 'var(--danger)',
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

  const licenseName = driver?.license_url?.split('/').pop() ?? '';

  return (
    <main className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">My Status</h1>
      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
      {!driver && !error && <p style={{ color: 'var(--text-muted)' }}>Loading…</p>}

      {driver && (
        <div className="border rounded-lg p-6">
          <p style={{ color: 'var(--text-muted)' }}>Driver</p>
          <p className="text-xl font-semibold">{driver.name}</p>
          <p className="mb-4" style={{ color: 'var(--text-muted)' }}>{driver.email}</p>

          <p style={{ color: 'var(--text-muted)' }}>Registration status</p>
          <p className="text-lg font-bold mb-4" style={{ color: statusColors[driver.status] ?? 'var(--grey)' }}>
            {driver.status.toUpperCase()}
          </p>

          <p style={{ color: 'var(--text-muted)' }}>License</p>
          <p>{licenseName}</p>
          <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Submitted: {new Date(driver.created_at).toLocaleDateString()}</p>
          <a className="underline" style={{ color: 'var(--navy)' }} target="_blank"
             href={`http://localhost:3000/api/driver/license/${licenseName}?token=${encodeURIComponent(token!)}`}>
            View license file
          </a>
        </div>
      )}
    </main>
  );
}
