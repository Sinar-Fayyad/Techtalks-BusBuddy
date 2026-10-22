'use client';
import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ParentShell from '@/components/ParentShell';
import { useMe } from '@/components/AppShell';
import Field from '@/components/ui/Field';
import PageHead from '@/components/ui/PageHead';
import Icon from '@/components/ui/Icon';
import { api, errorOf } from '@/lib/client-api';
import { EMAIL_RE } from '@/lib/format';

const STEPS = [
  { n: 1, t: 'Ask your child for their email', d: 'It is the email they used to sign up for BusBuddy.' },
  { n: 2, t: 'Get the link code', d: 'They open Profile → Link a parent → Create link code. It has 6 digits and lasts 10 minutes.' },
  { n: 3, t: 'Enter both below', d: 'Type their email and the 6-digit code, then tap Link Student.' },
];

function LinkContent() {
  const { token } = useMe();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [done, setDone] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setFormError('');
    const v: Record<string, string> = {};
    if (!EMAIL_RE.test(email.trim())) v.email = 'Enter your child’s email';
    if (!/^\d{6}$/.test(code)) v.code = 'The code has 6 digits';
    setErrors(v);
    if (Object.keys(v).length) return;
    setBusy(true);
    const r = await api(token, '/parents/me/children', { method: 'POST', body: { email: email.trim(), code } });
    setBusy(false);
    if (!r.ok) {
      console.error('link failed:', r.status, r.data);
      setFormError(r.status === 404 ? 'That email and code do not match, or the code expired. Ask your child for a new code.' : errorOf(r));
      return;
    }
    setDone(r.data.child?.name ?? 'Your child');
  }

  return (
    <>
      <PageHead icon="link" highlight="Student" title="Link Your" subtitle="Enter your student’s email and link code to connect them to your account" />
      <div className="bb-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', alignItems: 'start' }}>
        <section className="bb-card bb-card-glow">
          {done ? (
            <div className="bb-stack" style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '2.6rem' }}>✅</span>
              <h2 style={{ margin: 0 }}>{done} is linked</h2>
              <p className="bb-muted" style={{ margin: 0 }}>You will see their rides on your map while they are on the bus.</p>
              <div className="bb-row" style={{ justifyContent: 'center' }}>
                <button className="bb-btn" onClick={() => router.push('/parent/children')}>Go to Children</button>
                <button className="bb-btn bb-btn-ghost" onClick={() => { setDone(null); setEmail(''); setCode(''); }}>Link another</button>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="bb-stack">
              <Field icon="mail" type="email" label="Student email" placeholder="student@university.edu" value={email} onChange={setEmail} error={errors.email} autoComplete="off" />
              <Field icon="link" label="Link code" placeholder="6-digit code" inputMode="numeric" maxLength={6} value={code} onChange={(v) => setCode(v.replace(/\D/g, ''))} error={errors.code} autoComplete="off" />
              {formError && <div className="bb-alert bb-alert-error" role="alert">{formError}</div>}
              <button className="bb-btn bb-btn-block" disabled={busy} type="submit">{busy ? <span className="bb-spinner" /> : <><Icon name="link" size={17} /> Link Student</>}</button>
              <p className="bb-small bb-muted" style={{ margin: 0, textAlign: 'center' }}>For safety, only the student can create the code.</p>
            </form>
          )}
        </section>

        <section className="bb-card">
          <h2 className="bb-card-title"><Icon name="shield" /> How to link your student</h2>
          <div className="bb-stack">
            {STEPS.map((s) => (
              <div key={s.n} className="bb-row" style={{ gap: 12, flexWrap: 'nowrap', alignItems: 'flex-start' }}>
                <span style={{ width: 34, height: 34, flex: 'none', borderRadius: '50%', display: 'grid', placeItems: 'center', fontWeight: 800, background: 'var(--bb-grad)' }}>{s.n}</span>
                <div><b>{s.t}</b><div className="bb-small bb-muted">{s.d}</div></div>
              </div>
            ))}
          </div>
          <p className="bb-small bb-muted" style={{ marginBottom: 0 }}>
            Back to <Link href="/parent/children" style={{ color: 'var(--bb-cyan)' }}>Children</Link>.
          </p>
        </section>
      </div>
    </>
  );
}

export default function ParentLinkPage() {
  return <ParentShell><LinkContent /></ParentShell>;
}
