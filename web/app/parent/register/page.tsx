'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '../../student/register/page.module.css';
import { useAuth } from '../../auth-context';
import ErrorMessage from '@/components/ErrorMessage';

export default function ParentRegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const set = (key: 'name' | 'email' | 'password') =>
    (e: ChangeEvent<HTMLInputElement>) =>
      setForm((current) => ({ ...current, [key]: e.target.value }));

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const name = form.name.trim();
    const email = form.email.trim();
    const password = form.password;

    if (!name || !email || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Enter a valid email');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role: 'parent' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Signup failed — please try again');
        return;
      }

      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const loginData = await loginRes.json();
      if (!loginRes.ok) {
        setError('Account created, but automatic sign-in failed — please log in instead');
        return;
      }

      login(loginData.token, loginData.role);
      router.push('/parent/home');
    } catch (err) {
      console.error('Parent signup failed:', err);
      setError('Server error — is the dev server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Parent Sign Up</h1>
        <p className={styles.subtitle}>
          Create your account, then
          <br />
          link your child from your home page.
        </p>

        <form className={styles.form} onSubmit={submit} noValidate>
          <div className={styles.field}>
            <div className={styles.fieldInner}>
              <span className={styles.icon} aria-hidden>👤</span>
              <input
                className={styles.input}
                type="text"
                placeholder="Full Name"
                value={form.name}
                onChange={set('name')}
                aria-label="Full Name"
              />
            </div>
          </div>

          <div className={styles.field}>
            <div className={styles.fieldInner}>
              <span className={styles.icon} aria-hidden>✉️</span>
              <input
                className={styles.input}
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={set('email')}
                aria-label="Email"
              />
            </div>
          </div>

          <div className={styles.field}>
            <div className={styles.fieldInner}>
              <span className={styles.icon} aria-hidden>🔒</span>
              <input
                className={styles.input}
                type={showPw ? 'text' : 'password'}
                placeholder="Password"
                value={form.password}
                onChange={set('password')}
                aria-label="Password"
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

          <button type="submit" className={styles.submit} disabled={loading}>
            {loading ? 'Creating account…' : 'Sign Up →'}
          </button>
        </form>

        <ErrorMessage message={error} />

        <p className={styles.footer}>
          Already have an account?{' '}
          <Link href="/login" className={styles.footerLink}>
            Log in
          </Link>
        </p>
        <p className={styles.footer}>
          <Link href="/get-started" className={styles.footerLink}>
            ← Go back
          </Link>
        </p>
      </div>
    </main>
  );
}