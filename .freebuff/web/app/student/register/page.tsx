'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import styles from './page.module.css';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../auth-context';
import ErrorMessage from '@/components/ErrorMessage';

export default function StudentRegisterPage() {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const set = (key: 'name' | 'phone' | 'password') =>
    (e: ChangeEvent<HTMLInputElement>) =>
      setForm((current) => ({ ...current, [key]: e.target.value }));

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const name = form.name.trim();
    const phone = form.phone.trim();
    const password = form.password;

    if (!name || !phone || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (!/^\d{7,12}$/.test(phone.replace(/[\s\-()]/g, ''))) {
      setError('Enter a valid phone number');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email: '', password, phone, university: '', role: 'student' }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? data.message ?? 'Signup failed — please try again');
        return;
      }

      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: '', password }),
      });
      const loginData = await loginRes.json();

      if (!loginRes.ok) {
        setError('Account created, but automatic sign-in failed — please log in instead');
        return;
      }

      login(loginData.token, loginData.role);
      router.push('/student/home');
    } catch (err) {
      console.error('Signup failed:', err);
      setError('Server error — is the dev server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Sign In</h1>
        <p className={styles.subtitle}>
          Enter your details to access
          <br />
          your student account.
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
              <span className={styles.icon} aria-hidden>📱</span>
              <input
                className={styles.input}
                type="tel"
                placeholder="Phone Number"
                value={form.phone}
                onChange={set('phone')}
                aria-label="Phone Number"
              />
              <span className={styles.inputHint}>+961 71 234 567</span>
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
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>

        <div className={styles.orDivider}>
          <span className={styles.orLine} />
          <span className={styles.orText}>OR</span>
          <span className={styles.orLine} />
        </div>

        <button type="button" className={styles.secondary}>
          <span className={styles.secondaryIcon}>G</span>
          Continue with Google
        </button>

        <ErrorMessage message={error} />

        <p className={styles.footer}>
          Don&apos;t have an account?{' '}
          <a href="/student/register" className={styles.footerLink}>
            Sign up
          </a>
        </p>
      </div>
    </main>
  );
}
