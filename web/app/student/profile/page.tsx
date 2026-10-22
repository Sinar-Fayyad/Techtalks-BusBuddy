'use client';
import { useCallback, useEffect, useState } from 'react';
import StudentShell from '@/components/StudentShell';
import { useMe } from '@/components/AppShell';
import Modal from '@/components/Modal';
import Avatar from '@/components/ui/Avatar';
import Field from '@/components/ui/Field';
import Icon from '@/components/ui/Icon';
import { api, errorOf } from '@/lib/client-api';
import { PHONE_HINT, parseUtc, phoneOk } from '@/lib/format';

function ProfileContent() {
  const { me, token, refreshMe } = useMe();
  const [editing, setEditing] = useState(false);
  const [parents, setParents] = useState<any[] | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // ---- link code ----
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [genBusy, setGenBusy] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const left = expiresAt ? Math.max(0, Math.floor((expiresAt - now) / 1000)) : 0;
  const codeValid = !!code && left > 0;

  async function generate() {
    setGenBusy(true);
    setError('');
    const r = await api(token, '/students/me/link-code', { method: 'POST' });
    setGenBusy(false);
    if (!r.ok) return setError(errorOf(r));
    setCode(r.data.code);
    setExpiresAt((parseUtc(r.data.expires_at)?.getTime() ?? Date.now() + 600_000));
    setNow(Date.now());
  }

  const loadParents = useCallback(async () => {
    const r = await api(token, '/students/me/parents');
    if (r.ok) setParents(r.data.parents);
    else setError(errorOf(r));
  }, [token]);
  useEffect(() => { loadParents(); }, [loadParents]);

  async function removeParent(p: any) {
    if (!window.confirm(`Remove ${p.name}? They will no longer see your location.`)) return;
    const r = await api(token, `/students/me/parents/${p.id}`, { method: 'DELETE' });
    if (!r.ok) return setError(errorOf(r));
    setNotice(`${p.name} was removed.`);
    loadParents();
  }

  return (
    <>
      <div className="bb-page-head">
        <span className="bb-page-icon"><Icon name="user" size={26} /></span>
        <div>
          <h1>Pro<em>file</em></h1>
          <p>Your account and information</p>
        </div>
      </div>

      {error && <div className="bb-alert bb-alert-error" style={{ marginBottom: '1rem' }} role="alert">{error}</div>}
      {notice && <div className="bb-alert bb-alert-ok" style={{ marginBottom: '1rem' }}>{notice}</div>}

      <section className="bb-card bb-card-glow bb-row bb-between" style={{ marginBottom: '1rem' }}>
        <div className="bb-row" style={{ gap: '1.2rem' }}>
          <Avatar name={me?.name} size={84} />
          <div>
            <h2 style={{ margin: 0, fontSize: '1.6rem' }}>{me?.name ?? '…'}</h2>
            <span className="bb-chip bb-chip-cyan"><Icon name="building" size={14} /> Student</span>
            <div className="bb-muted bb-small" style={{ marginTop: 8 }}>
              <div><Icon name="mail" size={14} /> {me?.email}</div>
              <div><Icon name="phone" size={14} /> {me?.phone ?? '—'}</div>
              <div><Icon name="building" size={14} /> {me?.university ?? '—'}</div>
            </div>
          </div>
        </div>
        <button className="bb-btn bb-btn-ghost" onClick={() => setEditing(true)}><Icon name="pencil" size={16} /> Edit</button>
      </section>

      <div className="bb-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', alignItems: 'start' }}>
        <section className="bb-card" id="link">
          <h2 className="bb-card-title"><Icon name="link" /> Link a parent</h2>
          <p className="bb-muted bb-small" style={{ marginTop: 0 }}>
            Create a code and give it to your parent. In their BusBuddy account they enter <b>your email</b> and this code.
            The code works once and expires after 10 minutes.
          </p>
          {codeValid ? (
            <div style={{ textAlign: 'center', margin: '0.8rem 0' }}>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                {code!.split('').map((d, i) => (
                  <span key={i} style={{ width: 44, height: 56, display: 'grid', placeItems: 'center', fontSize: '1.7rem', fontWeight: 800, borderRadius: 12, background: 'rgba(0,229,255,0.12)', border: '1px solid var(--bb-cyan)' }}>{d}</span>
                ))}
              </div>
              <p className="bb-small bb-muted" style={{ margin: '0.6rem 0 0' }}>
                Expires in {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')} · email: <b>{me?.email}</b>
              </p>
            </div>
          ) : code ? (
            <div className="bb-alert bb-alert-info" style={{ margin: '0.8rem 0' }}>This code expired. Create a new one.</div>
          ) : null}
          <button className="bb-btn bb-btn-block" onClick={generate} disabled={genBusy}>
            {genBusy ? <span className="bb-spinner" /> : codeValid ? 'Create a new code' : 'Create link code'}
          </button>
        </section>

        <section className="bb-card">
          <h2 className="bb-card-title"><Icon name="users" /> Linked parents</h2>
          {parents === null ? (
            <div className="bb-skeleton" />
          ) : parents.length === 0 ? (
            <p className="bb-muted bb-small" style={{ margin: 0 }}>No parent is linked yet. Parents only see your location while you are on a trip.</p>
          ) : (
            <div className="bb-stack">
              {parents.map((p) => (
                <div key={p.id} className="bb-row bb-between">
                  <div className="bb-row">
                    <Avatar name={p.name} size={40} />
                    <div>
                      <b>{p.name}</b>
                      <div className="bb-small bb-muted">{p.email}</div>
                    </div>
                  </div>
                  <button className="bb-btn bb-btn-sm bb-btn-danger" onClick={() => removeParent(p)}><Icon name="trash" size={15} /> Remove</button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {editing && me && (
        <EditModal
          me={me}
          token={token}
          onClose={() => setEditing(false)}
          onSaved={() => { setEditing(false); setNotice('Profile updated.'); refreshMe(); }}
        />
      )}
    </>
  );
}

function EditModal({ me, token, onClose, onSaved }: { me: any; token: string; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(me.name ?? '');
  const [phone, setPhone] = useState(me.phone ?? '');
  const [university, setUniversity] = useState(me.university ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  async function save() {
    const e: Record<string, string> = {};
    if (name.trim().length < 2) e.name = 'Enter your full name';
    if (!phoneOk(phone)) e.phone = `Enter a valid phone number, e.g. ${PHONE_HINT}`;
    if (!university.trim()) e.university = 'Enter your university';
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    const r = await api(token, '/auth/me', { method: 'PATCH', body: { name: name.trim(), phone: phone.trim(), university: university.trim() } });
    setBusy(false);
    if (!r.ok) return setFormError(errorOf(r));
    onSaved();
  }

  return (
    <Modal title="Edit profile" onClose={onClose}>
      <div className="bb-stack">
        <Field icon="user" label="Full name" value={name} onChange={setName} error={errors.name} />
        <Field icon="phone" label="Phone" type="tel" value={phone} onChange={setPhone} error={errors.phone} />
        <Field icon="building" label="University" value={university} onChange={setUniversity} error={errors.university} />
        {formError && <div className="bb-alert bb-alert-error" role="alert">{formError}</div>}
        <div className="bb-row" style={{ justifyContent: 'flex-end' }}>
          <button className="bb-btn bb-btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="bb-btn" onClick={save} disabled={busy}>{busy ? <span className="bb-spinner" /> : 'Save'}</button>
        </div>
      </div>
    </Modal>
  );
}

export default function StudentProfilePage() {
  return (
    <StudentShell>
      <ProfileContent />
    </StudentShell>
  );
}
