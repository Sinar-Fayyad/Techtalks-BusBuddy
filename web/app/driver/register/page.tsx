'use client';
import { useState } from 'react';
import Button from '@/components/Button';
import Input from '@/components/Input';
import ErrorMessage from '@/components/ErrorMessage'; // NEW — shared friendly error
import { useRouter } from 'next/navigation';
import { useAuth } from '../../auth-context';

export default function DriverRegister() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    license_file: null as File | null,
  });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
const { login } = useAuth();

  const set = (k: string) => (e: any) =>
    setForm({ ...form, [k]: e.target.type === 'file' ? e.target.files?.[0] ?? null : e.target.value });

  const submit = async (e: any) => {
    e.preventDefault();
    setError('');
    setMsg('');

    if (!form.name || !form.email || !form.password || !form.license_file) {
      return setError('All fields are required');
    }

    setLoading(true);
    try {
      // 1. Signup
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Signup failed'); return; }

      // 2. Login (get token)
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const ld = await loginRes.json();
      if (!loginRes.ok) { setError(ld.error ?? 'Login failed'); return; }

      // 3. Upload license file
      const fd = new FormData();
      fd.append('file', form.license_file);
      const up = await fetch('/api/driver/license', {
        method: 'POST',
        headers: { Authorization: `Bearer ${ld.token}` },
        body: fd,
      });
      const ud = await up.json();
      if (!up.ok) { setError(ud.error ?? 'Upload failed'); return; }

      // 4. Create driver profile with stored file path
      const prof = await fetch('/api/driver/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ld.token}`,
        },
        body: JSON.stringify({ license_url: ud.path }),
      });
      const pd = await prof.json();
      if (!prof.ok) { setError(pd.error ?? 'Profile failed'); return; }

      setMsg('Registered! Your profile is pending admin review ✅');
      setForm({ name: '', email: '', password: '', license_file: null });
    } catch (err) { // CHANGED — add err param
      console.error('Registration failed:', err); // CHANGED — console.error per convention
      setError('Server error — is the dev server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-md mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Driver Registration</h1>
      <form onSubmit={submit} className="space-y-3">
        <Input label="Full name" placeholder="Your name" value={form.name} onChange={set('name')} />
        <Input label="Email" type="email" placeholder="you@mail.com" value={form.email} onChange={set('email')} />
        <Input label="Password" type="password" placeholder="••••••" value={form.password} onChange={set('password')} />
        <Input label="License (PDF/JPG/PNG, max 5MB)" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={set('license_file')} />
        <Button type="submit" color="primary" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </Button>
      </form>
      {msg && <p className="mt-4" style={{ color: 'var(--success)' }}>{msg}</p>}
      <div className="mt-4"><ErrorMessage message={error} /></div> {/* CHANGED — was: {error && <p className="mt-4" style={{ color: 'var(--danger)' }}>{error}</p>} */}

    </main>
  );

}