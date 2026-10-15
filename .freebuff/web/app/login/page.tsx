'use client';

import { useState, type ChangeEvent, type FormEvent, useEffect } from 'react';
import styles from './page.module.css';
import { useRouter } from 'next/navigation';
import { useAuth, ROLE_HOME, isLoggedIn } from '@/app/auth-context';
import ErrorMessage from '@/components/ErrorMessage';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [fieldError, setFieldError] = useState({ email: '', password: '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const router = useRouter();
  const { token, role, ready, login } = useAuth();

  // Logged-in guard: if the session is already authenticated, route to the
  // role home instead of showing the login form / trapping Back.
  useEffect(() => {
    if (isLoggedIn({ token, role })) {
      router.replace(ROLE_HOME[role!]);
    }
  }, [ready, token, role, router]);

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

      // Clear the one-shot login from browser history so the Back button never
      // lands a logged-in user back on /login (Back-button polish).
      router.replace('/');
      router.replace(
        ROLE_HOME[data.role as 'admin' | 'driver' | 'student' | 'parent']
      );
    } catch (err) {
      console.error('Login failed:', err);
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
              <span className={styles.icon} aria-hidden>
                👤
              </span>
              <input
                className={styles.input}
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={set('email')}
                aria-label="Email"
                aria-invalid={!!fieldError.email}
              />
            </div>
          </div>
          {fieldError.email && (
            <p className={styles.fieldError}>{fieldError.email}</p>
          )}

          <div className={styles.field}>
            <div className={styles.fieldInner}>
              <span className={styles.icon} aria-hidden>
                🔒
              </span>
              <input
                className={styles.input}
                type={showPw ? 'text' : 'password'}
                placeholder="Password"
                value={form.password}
                onChange={set('password')}
                aria-label="Password"
                aria-invalid={!!fieldError.password}
              />
              <button
                type="button"
                className={styles.eyeBtn}
                aria-label={showPw ? 'Hide password' : 'Show password'}
                onClick={() => setShowPw(!showPw)}
              >
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          {fieldError.password && (
            <p className={styles.fieldError}>{fieldError.password}</p>
          )}

          <button
            type="submit"
            className={styles.submit}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>

        {msg && <p className={styles.success}>{msg}</p>}
        <ErrorMessage message={error} />
        <p className={styles.createAccount}>
          Don't have an account?{' '}
          <a href="/driver/register">Create Account</a>
        </p>
      </div>
    </main>
  );
}
