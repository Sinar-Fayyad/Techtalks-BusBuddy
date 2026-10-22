'use client';
import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthShell from '@/components/AuthShell';
import Field from '@/components/ui/Field';
import Icon from '@/components/ui/Icon';
import { useAuth, isLoggedIn, ROLE_HOME, Role } from '@/app/auth-context';
import { api, errorOf } from '@/lib/client-api';

export default function LoginPage() {
  const { token, role, ready, login } = useAuth();
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  // already logged in -> straight to the user's home
  useEffect(() => {
    if (ready && isLoggedIn({ token, role })) router.replace(ROLE_HOME[role!]);
  }, [ready, token, role, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!identifier.trim()) next.identifier = 'Enter your email or phone number';
    if (!password) next.password = 'Password is required';
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length > 0) return; // no request when the form is empty

    setBusy(true);
    const r = await api(null, '/auth/login', { method: 'POST', body: { identifier: identifier.trim(), password } });
    setBusy(false);
    if (!r.ok) {
      console.error('login failed:', r.status, r.data);
      setFormError(r.status === 401 ? 'Wrong email/phone or password.' : errorOf(r));
      return;
    }
    login(r.data.token, r.data.role as Role, remember);
    router.replace(ROLE_HOME[r.data.role as Role]);
  }

  return (
    <AuthShell>
      <h1 className="bb-auth-title">Welcome Back!</h1>
      <p className="bb-auth-sub">Log in to continue your journey.</p>
      <form onSubmit={onSubmit} noValidate className="bb-stack">
        <Field icon="user" name="identifier" placeholder="Email or phone number" value={identifier} onChange={setIdentifier} error={errors.identifier} autoComplete="username" />
        <Field icon="lock" type="password" name="password" placeholder="Password" value={password} onChange={setPassword} error={errors.password} autoComplete="current-password" />
        <label className="bb-row bb-small" style={{ cursor: 'pointer', gap: 8 }}>
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          Remember me
        </label>
        {formError && <div className="bb-alert bb-alert-error" role="alert">{formError}</div>}
        <button className="bb-btn bb-btn-block" disabled={busy} type="submit">
          {busy ? <span className="bb-spinner" /> : <>Log In <Icon name="chevron" size={18} /></>}
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '1rem' }} className="bb-small bb-muted">
        Don&apos;t have an account? <Link href="/get-started" style={{ color: 'var(--bb-cyan)', fontWeight: 700 }}>Sign up</Link>
      </p>
    </AuthShell>
  );
}
