'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../auth-context';
import Button from '@/components/Button';

export default function AdminHomePage() {
  const router = useRouter();
  const { token, role, ready, logout } = useAuth();

  // Guard 1: no session at all -> back to /login (same as /admin/drivers)
  useEffect(() => {
    if (ready && !token) router.replace('/login');
  }, [ready, token, router]);

  // Guard 2: logged in but not an admin -> Access denied
  if (ready && token && role !== 'admin') {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold">Access denied</h1>
        <p className="mt-2" style={{ color: 'var(--text-muted)' }}>This page is for admins only.</p>
        <Button color="primary" onClick={logout}>Log out</Button>
      </main>
    );
  }

  // Still restoring the session (or about to redirect)
  if (!ready || !token) {
    return <main className="p-8"><p style={{ color: 'var(--text-muted)' }}>Checking session…</p></main>;
  }

  return (
    <main className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Home</h1>
        <Button color="primary" onClick={logout}>Logout</Button>
      </div>

      <div className="flex flex-wrap gap-4">
        {/* Live section */}
        <Link
          href="/admin/drivers"
          className="border p-4 block"
          style={{ borderRadius: 12, minWidth: 220, textDecoration: 'none', color: 'inherit' }}
        >
          <h2 className="font-bold">Drivers</h2>
          <p className="mt-1" style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Review pending drivers and verify or reject licenses.
          </p>
        </Link>

        {/* No /admin/trips route exists yet — disabled card, no dead link */}
        <div
          className="border p-4"
          aria-disabled="true"
          style={{ borderRadius: 12, minWidth: 220, opacity: 0.5, cursor: 'not-allowed' }}
        >
          <h2 className="font-bold">Trips</h2>
          <p className="mt-1" style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Coming soon.
          </p>
        </div>
      </div>
    </main>
  );
}
