'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link'; // fixed #5: back link to admin home
import { useRouter } from 'next/navigation';
import { useAuth } from '../../auth-context';
import Button from '@/components/Button';
import ErrorMessage from '@/components/ErrorMessage';
import { viewLicense, fetchLicenseBlob, licenseKind } from '@/lib/view-license';

// --- T12: inline license preview ---
function LicensePreview({
  token,
  licenseUrl,
  onError,
}: {
  token: string;
  licenseUrl: string;
  onError: (msg: string) => void;
}) {
  const name = licenseUrl.split('/').pop() ?? '';
  const kind = licenseKind(licenseUrl);
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Images are fetched inline (Bearer -> blob -> object URL). PDFs are NOT.
  useEffect(() => {
    if (kind !== 'image') return;
    let active = true;
    let created: string | null = null;
    (async () => {
      try {
        const blob = await fetchLicenseBlob(token, name);
        if (!active) return;
        created = URL.createObjectURL(blob);
        setUrl(created);
      } catch (err) {
        console.error('License preview failed:', err);
        if (active) setFailed(true);
      }
    })();
    return () => {
      active = false;
      if (created) URL.revokeObjectURL(created); // free the blob's memory
    };
  }, [token, name, kind]);

  // PDF / unknown type -> protected link (opened with Bearer, endpoint 8)
  if (kind !== 'image') {
    return (
      <Button
        color="primary"
        onClick={async () => {
          try {
            await viewLicense(token, name);
          } catch (e: any) {
            onError(e?.message ?? 'Could not open the license file.');
          }
        }}
      >
        {kind === 'pdf' ? '📄 View PDF' : 'Open file'}
      </Button>
    );
  }

  if (failed) return <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Preview unavailable</span>;
  if (!url) return <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading license…</span>;

  return expanded ? (
    <div>
      <img
        src={url}
        alt="Driver license"
        style={{ display: 'block', width: '100%', maxWidth: 420, borderRadius: 12, border: '1px solid var(--bb-link)' }}
      />
      <button
        onClick={() => setExpanded(false)}
        style={{ marginTop: 6, background: 'none', border: 'none', color: 'var(--bb-link)', cursor: 'pointer', fontSize: 13 }}
      >
        Close preview
      </button>
    </div>
  ) : (
    <img
      src={url}
      alt="Driver license"
      onClick={() => setExpanded(true)}
      title="Click to enlarge"
      style={{ display: 'block', height: 64, borderRadius: 8, border: '1px solid var(--bb-link)', cursor: 'zoom-in' }}
    />
  );
}

export default function AdminDriversPage() {
  const router = useRouter();
  const { token, role, ready, logout } = useAuth();
  const [drivers, setDrivers] = useState<any[]>([]);
  const [error, setError] = useState('');

  // Guard 1: no session at all -> back to /login
  useEffect(() => {
    if (ready && !token) router.replace('/login');
  }, [ready, token, router]);

  // fixed #5: relative URL, and every failure now shows a message
  const load = async (t: string) => {
    setError('');
    try {
      const res = await fetch('/api/admin/drivers', {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.status === 401) {
        logout();
        return;
      }
      if (res.status === 403) {
        setError('This account is not an admin');
        setDrivers([]);
        return;
      }
      if (!res.ok) {
        setError('Could not load the drivers list. Try again.');
        setDrivers([]);
        return;
      }
      const data = await res.json();
      setDrivers(data.drivers ?? []);
    } catch (err) {
      console.error('Load drivers failed:', err);
      setError('Server error — is the dev server running?');
      setDrivers([]);
    }
  };

  // Guard 2 + auto-load
  useEffect(() => {
    if (ready && token && role === 'admin') load(token);
  }, [ready, token, role]);

  // fixed #5: relative URL, check the answer, log out on 401, show errors
  const act = async (id: number, action: string) => {
    setError('');
    try {
      const res = await fetch(`/api/admin/drivers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action }),
      });
      if (res.status === 401) {
        logout();
        return;
      }
      if (!res.ok) {
        setError('Could not update this driver. Try again.');
        return;
      }
    } catch (err) {
      console.error('Driver action failed:', err);
      setError('Server error — is the dev server running?');
      return;
    }
    load(token!);
  };

  if (ready && token && role !== 'admin') {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold">Access denied</h1>
        <p className="mt-2" style={{ color: 'var(--text-muted)' }}>This page is for admins only.</p>
        <Button color="primary" onClick={logout}>Log out</Button>
      </main>
    );
  }

  if (!ready || !token) {
    return <main className="p-8"><p style={{ color: 'var(--text-muted)' }}>Checking session…</p></main>;
  }

  return (
    <main className="p-8">
      {/* fixed #5: link back to the admin home */}
      <p className="mb-2">
        <Link href="/admin/home" style={{ color: 'var(--bb-link)', fontSize: 14 }}>← Admin home</Link>
      </p>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Pending Drivers</h1>
        <Button color="primary" onClick={logout}>Logout</Button>
      </div>
      <ErrorMessage message={error} />
      {drivers.length === 0 && !error && <p className="mt-4" style={{ color: 'var(--text-muted)' }}>No pending drivers 🎉</p>}
      <ul className="mt-4 space-y-2">
        {drivers.map((d) => (
          <li key={d.id} className="border p-3" style={{ borderRadius: 12 }}>
            <div className="flex justify-between items-center gap-3">
              <span>{d.name} — {d.email}</span>
              <span className="flex gap-2">
                <Button color="success" onClick={() => act(d.id, 'verify')}>Verify</Button>
                <Button color="danger" onClick={() => act(d.id, 'reject')}>Reject</Button>
              </span>
            </div>
            <div className="mt-3">
              <LicensePreview token={token!} licenseUrl={d.license_url} onError={setError} />
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}