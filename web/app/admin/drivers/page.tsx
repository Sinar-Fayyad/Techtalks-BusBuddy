'use client';
import { useEffect, useState } from 'react';

export default function AdminDriversPage() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [token, setToken] = useState('');
  const [msg, setMsg] = useState('');

  const load = async (t: string) => {
    const res = await fetch('http://localhost:3000/api/admin/drivers', {
      headers: { Authorization: `Bearer ${t}` },
    });
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

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Pending Drivers</h1>
      <input
        className="border p-2 mb-4 w-1/2"
        placeholder="Paste admin token here"
        onChange={(e) => setToken(e.target.value)}
      />
      <button className="bg-blue-600 text-white p-2 rounded ml-2" onClick={() => load(token)}>
        Load
      </button>
      {msg && <p>{msg}</p>}
      <ul className="mt-4 space-y-2">
        {drivers.map((d) => (
          <li key={d.id} className="border p-3 flex justify-between items-center">
            <span>{d.name} — {d.email} — <a className="text-blue-500 underline" href={d.license_url}>license</a></span>
            <span>
              <button className="bg-green-600 text-white p-1 rounded mr-2" onClick={() => act(d.id, 'verify')}>Verify</button>
              <button className="bg-red-600 text-white p-1 rounded" onClick={() => act(d.id, 'reject')}>Reject</button>
            </span>
          </li>
        ))}
      </ul>
      {drivers.length === 0 && <p>No pending drivers 🎉</p>}
    </main>
  );
}
