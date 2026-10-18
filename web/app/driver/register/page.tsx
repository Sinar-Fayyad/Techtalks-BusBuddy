'use client';
import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, isLoggedIn, ROLE_HOME } from '@/app/auth-context';
import ErrorMessage from '@/components/ErrorMessage';
import styles from '../../student/register/page.module.css';
import extra from './page.module.css';

// Must match the server's rules in /api/driver/license (same types, same size)
const ALLOWED_LICENSE_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_LICENSE_SIZE = 5 * 1024 * 1024; // 5MB

export default function DriverRegister() {
  const router = useRouter();
  const { token, role, ready } = useAuth();

  // Logged-in guard: already authenticated users don't create a second account here.
  useEffect(() => {
    if (isLoggedIn({ token, role })) {
      router.replace(ROLE_HOME[role!]);
    }
  }, [ready, token, role, router]);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    license_file: null as File | null,
  });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const set = (key: 'name' | 'email' | 'password' | 'confirmPassword') =>
    (e: ChangeEvent<HTMLInputElement>) =>
      setForm((current) => ({ ...current, [key]: e.target.value }));

  const setFile = (e: ChangeEvent<HTMLInputElement>) =>
    setForm((current) => ({ ...current, license_file: e.target.files?.[0] ?? null }));

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setMsg('');

    const name = form.name.trim();
    const email = form.email.trim();
    const license = form.license_file;

    if (!name || !email || !form.password || !form.confirmPassword || !license) {
      return setError('Please fill in all fields');
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      return setError('Enter a valid email');
    }
    if (form.password !== form.confirmPassword) {
      return setError('Passwords do not match');
    }

    // Check the license BEFORE creating the account, so a bad file
    // can never leave a half-registered account behind
    if (!ALLOWED_LICENSE_TYPES.includes(license.type)) {
      return setError('License must be a PDF, JPG or PNG file');
    }
    if (license.size > MAX_LICENSE_SIZE) {
      return setError('License file must be 5MB or smaller');
    }

    setLoading(true);
    try {
      // 1. Signup
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Signup failed'); return; }

      // 2. Login (get token)
      const login = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: form.password }),
      });
      const ld = await login.json();
      if (!login.ok) { setError(ld.error ?? 'Login failed'); return; }

      // 3. Upload license file
      const fd = new FormData();
      fd.append('file', license);
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
      setForm({ name: '', email: '', password: '', confirmPassword: '', license_file: null });
      // Close out the one-shot registration from browser history so Back doesn't
      // revisit it, and leave the user on a sensible place (Back-button polish).
      router.replace('/login');
    } catch (err) {
      console.error('Registration failed:', err);
      setError('Server error — is the dev server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Driver Sign Up</h1>
        <p className={styles.subtitle}>
          Create your driver account.
          <br />
          An admin will review your license.
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
                aria-label={showPw ? 'Hide passwords' : 'Show passwords'}
                onClick={() => setShowPw(!showPw)}
              >
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div className={styles.field}>
            <div className={styles.fieldInner}>
              <span className={styles.icon} aria-hidden>🔒</span>
              <input
                className={styles.input}
                type={showPw ? 'text' : 'password'}
                placeholder="Confirm Password"
                value={form.confirmPassword}
                onChange={set('confirmPassword')}
                aria-label="Confirm Password"
              />
            </div>
          </div>

                    <div className={styles.field}>
            <label className={`${styles.fieldInner} ${extra.fileLabel}`}>
              <span className={styles.icon} aria-hidden>📎</span>
              <input
                className={extra.fileInput}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={setFile}
                aria-label="Driver license file"
              />
              <span className={extra.fileText}>
                {form.license_file ? form.license_file.name : 'Upload your driver license'}
              </span>
            </label>
          </div>
          <p className={extra.fileHint}>PDF, JPG or PNG, max 5MB</p>

          <button type="submit" className={styles.submit} disabled={loading}>
            {loading ? 'Registering…' : 'Sign Up →'}
          </button>
        </form>

        {msg && <p className={extra.success}>{msg}</p>}
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