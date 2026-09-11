'use client';
import { useEffect, useState } from 'react';

export default function AdminDriversPage() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('admin_token');
    if (saved) setToken(saved);
  }, []);

  const load = async (t: string) => {
    setError('');
    const res = await fetch('http://localhost:3000/api/admin/drivers', {
      headers: { Authorization: `Bearer ${t}` },
    });
    if (res.status === 401 || res.status === 403) {
      setError('Invalid or missing admin token');
      setDrivers([]);
      return;
    }
    const data = await res.json();
    setDrivers(data.drivers ?? []);
  };

  const act = async (id: number, action: string) => {
    await fetch(`http://localhost:3000/api/admin/drivers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action }),
    });
    load(token);
  };

  const licenseHref = (path: string) =>
    `http://localhost:3000/api/driver/license/${path.split('/').pop()}?token=${encodeURIComponent(token)}`;

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Pending Drivers</h1>
      <input
        className="border p-2 mb-4 w-1/2"
        placeholder="Paste admin token (saved in this browser)"
        value={token}
        onChange={(e) => setToken(e.target.value)}
      />
      <button
        className="bg-blue-600 text-white p-2 rounded ml-2"
        onClick={() => { localStorage.setItem('admin_token', token); load(token); }}
      >
        Load
      </button>
      {error && <p className="text-red-600 mt-2">{error}</p>}
      {drivers.length === 0 && !error && <p className="text-gray-500 mt-4">No pending drivers 🎉</p>}
      <ul className="mt-4 space-y-2">
        {drivers.map((d) => (
          <li key={d.id} className="border p-3 flex justify-between items-center">
            <span>
              {d.name} — {d.email} —{' '}
              <a className="text-blue-500 underline" href={licenseHref(d.license_url)} target="_blank">
                license
              </a>
            </span>
            <span>
              <button className="bg-green-600 text-white p-1 rounded mr-2" onClick={() => act(d.id, 'verify')}>Verify</button>
              <button className="bg-red-600 text-white p-1 rounded" onClick={() => act(d.id, 'reject')}>Reject</button>
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
