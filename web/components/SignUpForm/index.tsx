'use client';
import { FormEvent, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthShell from '@/components/AuthShell';
import Field from '@/components/ui/Field';
import Icon from '@/components/ui/Icon';
import { ROLE_HOME, Role, useAuth } from '@/app/auth-context';
import { api, errorOf } from '@/lib/client-api';
import { EMAIL_RE, PHONE_HINT, phoneOk } from '@/lib/format';

type SignUpRole = 'student' | 'parent' | 'driver';

const COPY: Record<SignUpRole, { badge: string; icon: string; blurb: string }> = {
  student: { badge: 'Student', icon: 'building', blurb: 'Create your student account.' },
  parent: { badge: 'Parent', icon: 'users', blurb: 'Create your parent account.' },
  driver: { badge: 'Driver', icon: 'bus', blurb: 'Create your driver account.' },
};

const MAX_LICENSE = 5 * 1024 * 1024;

// One sign-up form for the 3 roles. Every field is required (student: + university, driver: + license).
export default function SignUpForm({ role }: { role: SignUpRole }) {
  const router = useRouter();
  const { login } = useAuth();
  const copy = COPY[role];

  const [name, setName] = useState('');
  const [university, setUniversity] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [license, setLicense] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  // driver only: the account exists but the license upload failed -> retry without signing up again
  const [needsLicenseRetry, setNeedsLicenseRetry] = useState(false);
  const tokenRef = useRef<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (name.trim().length < 2) e.name = 'Enter your full name';
    if (role === 'student' && !university.trim()) e.university = 'Enter your university name';
    if (!phone.trim()) e.phone = 'Enter your phone number';
    else if (!phoneOk(phone)) e.phone = `Enter a valid phone number, e.g. ${PHONE_HINT}`;
    if (!email.trim()) e.email = 'Enter your email';
    else if (!EMAIL_RE.test(email.trim())) e.email = 'Enter a valid email';
    if (password.length < 8) e.password = 'Password must be at least 8 characters';
    if (!confirm) e.confirm = 'Confirm your password';
    else if (confirm !== password) e.confirm = 'Passwords do not match';
    if (role === 'driver') {
      if (!license) e.license = 'Upload your driving license (PDF, JPG or PNG)';
      else if (!/\.(pdf|jpe?g|png)$/i.test(license.name)) e.license = 'License must be a PDF, JPG or PNG';
      else if (license.size > MAX_LICENSE) e.license = 'License file must be 5 MB or smaller';
    }
    return e;
  }

  async function uploadLicense(token: string, file: File): Promise<string | null> {
    const form = new FormData();
    form.append('file', file);
    const up = await api(token, '/driver/license', { method: 'POST', form });
    if (!up.ok) return errorOf(up, 'License upload failed.');
    const prof = await api(token, '/driver/profile', { method: 'POST', body: { license_url: up.data.path } });
    // 409 = profile already exists (a previous attempt got that far) -> fine
    if (!prof.ok && prof.status !== 409) return errorOf(prof, 'Could not save your driver profile.');
    return null;
  }

  function finish(token: string) {
    login(token, role as Role, true);
    router.replace(ROLE_HOME[role as Role]);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError('');
    if (needsLicenseRetry && tokenRef.current && license) {
      setBusy(true);
      const err = await uploadLicense(tokenRef.current, license);
      setBusy(false);
      if (err) return setFormError(err);
      return finish(tokenRef.current);
    }

    const v = validate();
    setErrors(v);
    if (Object.keys(v).length > 0) return; // nothing is sent when something is invalid

    setBusy(true);
    const signup = await api(null, '/auth/signup', {
      method: 'POST',
      body: {
        name: name.trim(), email: email.trim(), phone: phone.trim(), password, role,
        ...(role === 'student' ? { university: university.trim() } : {}),
      },
    });
    if (!signup.ok) {
      setBusy(false);
      console.error('signup failed:', signup.status, signup.data);
      const msg = errorOf(signup);
      if (signup.status === 409) {
        if (/phone/i.test(msg)) setErrors({ phone: msg });
        else setErrors({ email: msg });
      } else setFormError(msg);
      return;
    }

    const lg = await api(null, '/auth/login', { method: 'POST', body: { identifier: email.trim(), password } });
    if (!lg.ok) {
      setBusy(false);
      setFormError('Account created. Please log in to continue.');
      router.replace('/login');
      return;
    }
    tokenRef.current = lg.data.token;

    if (role === 'driver' && license) {
      const err = await uploadLicense(lg.data.token, license);
      if (err) {
        setBusy(false);
        setNeedsLicenseRetry(true);
        setFormError(`Your account was created, but: ${err} Choose the file again and press the button to retry.`);
        return;
      }
    }
    setBusy(false);
    finish(lg.data.token);
  }

  return (
    <AuthShell badge={copy.badge} badgeIcon={copy.icon} backHref="/get-started" wide>
      <h1 className="bb-auth-title">Sign Up</h1>
      <p className="bb-auth-sub">{copy.blurb}</p>
      <form onSubmit={onSubmit} noValidate className="bb-stack">
        {!needsLicenseRetry && (
          <>
            <Field icon="user" name="name" placeholder="Full Name" value={name} onChange={setName} error={errors.name} autoComplete="name" />
            {role === 'student' && (
              <Field icon="building" name="university" placeholder="University Name" value={university} onChange={setUniversity} error={errors.university} />
            )}
            <Field icon="phone" name="phone" type="tel" placeholder={`Phone Number (${PHONE_HINT})`} value={phone} onChange={setPhone} error={errors.phone} autoComplete="tel" />
            <Field icon="mail" name="email" type="email" placeholder="Email" value={email} onChange={setEmail} error={errors.email} autoComplete="email" />
            <Field icon="lock" name="password" type="password" placeholder="Password (min 8 characters)" value={password} onChange={setPassword} error={errors.password} autoComplete="new-password" />
            <Field icon="lock" name="confirm" type="password" placeholder="Confirm Password" value={confirm} onChange={setConfirm} error={errors.confirm} autoComplete="new-password" />
          </>
        )}

        {role === 'driver' && (
          <div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              style={{ display: 'none' }}
              onChange={(e) => setLicense(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              className="bb-btn bb-btn-ghost bb-btn-block"
              onClick={() => fileRef.current?.click()}
              style={{ borderRadius: 999, justifyContent: 'flex-start' }}
            >
              <Icon name="ticket" size={19} />
              {license ? license.name : 'Upload driving license (PDF, JPG, PNG · max 5 MB)'}
            </button>
            {errors.license && <p className="bb-field-error">{errors.license}</p>}
          </div>
        )}

        {formError && <div className="bb-alert bb-alert-error" role="alert">{formError}</div>}
        <button className="bb-btn bb-btn-block" disabled={busy} type="submit">
          {busy ? <span className="bb-spinner" /> : needsLicenseRetry ? 'Retry license upload' : <>Sign Up <Icon name="chevron" size={18} /></>}
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '1rem' }} className="bb-small bb-muted">
        Already have an account? <Link href="/login" style={{ color: 'var(--bb-cyan)', fontWeight: 700 }}>Sign in</Link>
      </p>
    </AuthShell>
  );
}
