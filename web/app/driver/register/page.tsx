'use client';
import { useState } from 'react';
import Button from '@/components/Button';
import Input from '@/components/Input';

export default function DriverRegister() {
  const [form, setForm] = useState({ name: '', email: '', password: '', license_url: '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const set = (k: string) => (e: any) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e: any) => {
    e.preventDefault();
    setError(''); setMsg('');
    try {
      const res = await fetch('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error ?? 'Signup failed');

      const login = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const ld = await login.json();
      if (!login.ok) return setError(ld.error ?? 'Login failed');

      const prof = await fetch('http://localhost:3000/api/driver/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ld.token}` },
        body: JSON.stringify({ license_url: form.license_url }),
      });
      const pd = await prof.json();
      if (!prof.ok) return setError(pd.error ?? 'Profile failed');

      setMsg('Registered! Your profile is pending admin review ✅');
    } catch {
      setError('Server error — is the dev server running?');
    }
  };

  return (
    <main className="max-w-md mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Driver Registration</h1>
      <form onSubmit={submit} className="space-y-3">
        <Input label="Full name" placeholder="Your name" value={form.name} onChange={set('name')} />
        <Input label="Email" type="email" placeholder="you@mail.com" value={form.email} onChange={set('email')} />
        <Input label="Password" type="password" placeholder="••••••" value={form.password} onChange={set('password')} />
        <Input label="License URL" placeholder="https://..." value={form.license_url} onChange={set('license_url')} />
        <Button type="submit" color="primary">Register</Button>
      </form>
      {msg && <p className="text-green-600 mt-4">{msg}</p>}
      {error && <p className="text-red-600 mt-4">{error}</p>}
    </main>
  );
}
