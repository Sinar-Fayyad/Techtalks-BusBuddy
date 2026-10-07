'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import styles from './page.module.css';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../auth-context';
import ErrorMessage from '@/components/ErrorMessage';

export default function StudentRegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const set = (key: 'name' | 'email' | 'password') => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((current) => ({ ...current, [key]: e.target.value }));

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const name = form.name.trim();
    const email = form.email.trim();

    // 1) Client validation — ALL errors go through the shared Error component (decision a)
    if (!name || !email || !form.password) {
      setError('Please fill in all fields');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Enter a valid email');
      return;
    }

    setLoading(true);

    try {
      // 2) Signup — entry 1 of the contract, role fixed to student
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password: form.password, role: 'student' }),
      });
      const data = await res.json();

      if (!res.ok) {
        // 400 missing fields · 409 email exists · 403 admin (never sent here) · 500
        setError(data.error ?? data.message ?? 'Signup failed — please try again');
        return; // no login attempt on failure
      }

      // 3) Auto-login — entry 2 of the contract
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: form.password }),
      });
      const loginData = await loginRes.json();

      if (!loginRes.ok) {
        setError('Account created, but automatic sign-in failed — please log in instead');
        return;
      }

      // 4) Save session (localStorage via auth-context → survives refresh) → home
      login(loginData.token, loginData.role);
      router.push('/student/home');
    } catch (err) {
      console.error('Signup failed:', err); // convention: console.error
      setError('Server error — is the dev server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Create Student Account</h1>
        <p className={styles.subtitle}>Join BusBuddy to track your bus in real time</p>

        <form onSubmit={submit} noValidate>
          <div className={styles.field}>
            <div className={styles.fieldInner}>
              <span className={styles.icon} aria-hidden>👤</span>
              <input className={styles.input} type="text" placeholder="Full name"
                value={form.name} onChange={set('name')}
                aria-label="Full name" />
            </div>
          </div>

          <div className={styles.field}>
            <div className={styles.fieldInner}>
              <span className={styles.icon} aria-hidden>✉️</span>
              <input className={styles.input} type="email" placeholder="Email"
                value={form.email} onChange={set('email')}
                aria-label="Email" />
            </div>
          </div>

          <div className={styles.field}>
            <div className={styles.fieldInner}>
              <span className={styles.icon} aria-hidden>🔒</span>
              <input className={styles.input} type={showPw ? 'text' : 'password'}
                placeholder="Password" value={form.password} onChange={set('password')}
                aria-label="Password" />
              <button type="button" className={styles.eyeBtn}
                aria-label={showPw ? 'Hide password' : 'Show password'}
                onClick={() => setShowPw(!showPw)}>{showPw ? '🙈' : '👁️'}</button>
            </div>
          </div>

          <button type="submit" className={styles.submit} disabled={loading}>
            {loading ? 'Creating account…' : 'Sign Up →'}
          </button>
        </form>

        <ErrorMessage message={error} />

        <p className={styles.footerLink}>
          Already have an account?{' '}
          <a href="/login">Sign in</a>
        </p>
      </div>
    </main>
  );
}