'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import styles from './page.module.css';
import { useRouter } from 'next/navigation';
import { useAuth } from '../auth-context';


export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [fieldError, setFieldError] = useState({ email: '', password: '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const router = useRouter();
  const { login } = useAuth();


  const set = (key: 'email' | 'password') => (e: ChangeEvent<HTMLInputElement>) =>
  setForm((current) => ({ ...current, [key]: e.target.value }));

const submit = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setError('');
  setMsg('');

  const fe = { email: '', password: '' };
  const email = form.email.trim();

  if (!email) {
    fe.email = 'Email is required';
  } else if (!/\S+@\S+\.\S+/.test(email)) {
    fe.email = 'Enter a valid email';
  }

  if (!form.password) {
    fe.password = 'Password is required';
  }

  setFieldError(fe);

  // Required: prevents any API request when validation fails.
  if (fe.email || fe.password) return;

  setLoading(true);

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password: form.password,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? data.message ?? 'Invalid email or password');
      return;
    }

           login(data.token, data.role);
    setMsg(`Login successful as ${data.role}. ✅`);

    if (data.role === 'admin') {
      router.push('/admin/drivers');
    } else if (data.role === 'driver') {
      router.push('/driver/status');
    }


  } catch {
    setError('Server error — is the dev server running?');
  } finally {
    setLoading(false);
  }
};

  return (
    <main className={styles.page}>
      <div className={styles.card}>
               <h1 className={styles.title}>Welcome Back</h1>
        <p className={styles.subtitle}>Sign in to continue to BusBuddy</p>


        <form onSubmit={submit} noValidate>
          <div className={styles.field}>
            <div className={styles.fieldInner}>
              <span className={styles.icon} aria-hidden>👤</span>
              <input className={styles.input} type="email" placeholder="Email"
                value={form.email} onChange={set('email')}
                aria-label="Email" aria-invalid={!!fieldError.email} />
            </div>
          </div>
          {fieldError.email && <p className={styles.fieldError}>{fieldError.email}</p>}

          <div className={styles.field}>
            <div className={styles.fieldInner}>
              <span className={styles.icon} aria-hidden>🔒</span>
              <input className={styles.input} type={showPw ? 'text' : 'password'}
                placeholder="Password" value={form.password} onChange={set('password')}
                aria-label="Password" aria-invalid={!!fieldError.password} />
              <button type="button" className={styles.eyeBtn} aria-label={showPw ? 'Hide password' : 'Show password'}
                onClick={() => setShowPw(!showPw)}>{showPw ? '🙈' : '👁️'}</button>
            </div>
          </div>
          {fieldError.password && <p className={styles.fieldError}>{fieldError.password}</p>}

          <button type="submit" className={styles.submit} disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>

        {msg && <p className={styles.success}>{msg}</p>}
        {error && <p className={styles.error}>{error}</p>}
                <p style={{ color: 'var(--bb-text-dim)', textAlign: 'center', marginTop: '16px', fontSize: '14px' }}>
          Don't have an account?{' '}
          <a href="/driver/register" style={{ color: 'var(--bb-link)', fontWeight: 600, textDecoration: 'none' }}>
            Create Account
          </a>
        </p>

      </div>
    </main>
  );
}
