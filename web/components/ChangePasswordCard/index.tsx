'use client';
import { FormEvent, useState } from 'react';
import Field from '@/components/ui/Field';
import Icon from '@/components/ui/Icon';
import { api, errorOf } from '@/lib/client-api';

// Shared by every role's Settings page.
export default function ChangePasswordCard({ token }: { token: string }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setOk(false);
    setFormError('');
    const v: Record<string, string> = {};
    if (!current) v.current = 'Enter your current password';
    if (next.length < 8) v.next = 'New password must be at least 8 characters';
    if (confirm !== next) v.confirm = 'Passwords do not match';
    setErrors(v);
    if (Object.keys(v).length) return;
    setBusy(true);
    const r = await api(token, '/auth/change-password', { method: 'POST', body: { currentPassword: current, newPassword: next } });
    setBusy(false);
    if (!r.ok) return setFormError(errorOf(r));
    setOk(true);
    setCurrent(''); setNext(''); setConfirm('');
  }

  return (
    <section className="bb-card">
      <h2 className="bb-card-title"><Icon name="lock" /> Change password</h2>
      <form onSubmit={submit} noValidate className="bb-stack">
        <Field icon="lock" type="password" placeholder="Current password" value={current} onChange={setCurrent} error={errors.current} autoComplete="current-password" />
        <Field icon="lock" type="password" placeholder="New password (min 8 characters)" value={next} onChange={setNext} error={errors.next} autoComplete="new-password" />
        <Field icon="lock" type="password" placeholder="Confirm new password" value={confirm} onChange={setConfirm} error={errors.confirm} autoComplete="new-password" />
        {formError && <div className="bb-alert bb-alert-error" role="alert">{formError}</div>}
        {ok && <div className="bb-alert bb-alert-ok">Password changed.</div>}
        <button className="bb-btn" disabled={busy} type="submit">{busy ? <span className="bb-spinner" /> : 'Update password'}</button>
      </form>
    </section>
  );
}
