'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../auth-context';
import Button from '@/components/Button';

export default function AdminDriversPage() {
  const router = useRouter();
  const { token, role, ready, logout } = useAuth();
  const [drivers, setDrivers] = useState<any[]>([]);
  const [error, setError] = useState('');

  // Guard 1: no session at all -> back to /login
  useEffect(() => {
    if (ready && !token) router.replace('/login');
  }, [ready, token, router]);

  const load = async (t: string) => {
    setError('');
    const res = await fetch('http://localhost:3000/api/admin/drivers', {
      headers: { Authorization: `Bearer ${t}` },
    });
    if (res.status === 401) {
      logout(); // stale/invalid token -> end session, guard 1 kicks user to /login
      return;
    }
    if (res.status === 403) {
      setError('This account is not an admin');
      setDrivers([]);
      return;
    }
    const data = await res.json();
    setDrivers(data.drivers ?? []);
  };

  // Guard 2 + auto-load: fetch only when we KNOW there's an admin session
  useEffect(() => {
    if (ready && token && role === 'admin') load(token);
  }, [ready, token, role]);

  const act = async (id: number, action: string) => {
    await fetch(`http://localhost:3000/api/admin/drivers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action }),
    });
    load(token!); // token is guaranteed here: buttons only render for logged-in admins
  };

  const licenseHref = (path: string) =>
    `http://localhost:3000/api/driver/license/${path.split('/').pop()}?token=${encodeURIComponent(token!)}`;

  // Driver (or unknown role) token on this page -> blocked, no data, no API call
  if (ready && token && role !== 'admin') {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold">Access denied</h1>
        <p className="mt-2" style={{ color: 'var(--text-muted)' }}>This page is for admins only.</p>
        <Button color="primary" onClick={logout}>Log out</Button>


      </main>
    );
  }

  // Small placeholder while the session is being read from localStorage
  if (!ready || !token) {
    return <main className="p-8"><p style={{ color: 'var(--text-muted)' }}>Checking session…</p></main>;
  }

  return (
    <main className="p-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Pending Drivers</h1>
        <Button color="primary" onClick={logout}>Logout</Button>
      </div>
      {error && <p className="mt-2" style={{ color: 'var(--danger)' }}>{error}</p>}
      {drivers.length === 0 && !error && <p className="mt-4" style={{ color: 'var(--text-muted)' }}>No pending drivers 🎉</p>}
      <ul className="mt-4 space-y-2">
        {drivers.map((d) => (
          <li key={d.id} className="border p-3 flex justify-between items-center">
            <span>
              {d.name} — {d.email} —{' '}
              <a className="underline" style={{ color: 'var(--navy)' }} href={licenseHref(d.license_url)} target="_blank">
                license
              </a>
            </span>
            <span className="flex gap-2">
              <Button color="success" onClick={() => act(d.id, 'verify')}>Verify</Button>
              <Button color="danger" onClick={() => act(d.id, 'reject')}>Reject</Button>
            </span>
          </li>
        ))}
      </ul>
    </main>
  );