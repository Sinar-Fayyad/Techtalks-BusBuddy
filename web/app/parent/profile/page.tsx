'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ParentShell from '@/components/ParentShell';
import { useMe } from '@/components/AppShell';
import ChangePasswordCard from '@/components/ChangePasswordCard';
import { useLiveChildren, LiveChild } from '@/components/useLiveChildren';
import Modal from '@/components/Modal';
import Avatar from '@/components/ui/Avatar';
import Field from '@/components/ui/Field';
import Icon from '@/components/ui/Icon';
import PageHead from '@/components/ui/PageHead';
import { useAuth } from '@/app/auth-context';
import { api, errorOf } from '@/lib/client-api';
import { PHONE_HINT, phoneOk } from '@/lib/format';

function ProfileContent() {
  const { me, token, refreshMe } = useMe();
  const { logout } = useAuth();
  const router = useRouter();
  const { children, reload } = useLiveChildren(token);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function unlink(c: LiveChild) {
    if (!window.confirm(`Unlink ${c.name}? You will stop seeing their rides.`)) return;
    const r = await api(token, `/parents/me/children/${c.id}`, { method: 'DELETE' });
    if (!r.ok) return setError(errorOf(r));
    setNotice(`${c.name} was unlinked.`);
    reload();
  }

  return (
    <>
      <PageHead icon="user" highlight="Profile" title="My" subtitle="Manage your account and preferences" />
      {error && <div className="bb-alert bb-alert-error" style={{ marginBottom: '1rem' }} role="alert">{error}</div>}
      {notice && <div className="bb-alert bb-alert-ok" style={{ marginBottom: '1rem' }}>{notice}</div>}

      <section className="bb-card bb-card-glow bb-row bb-between" style={{ marginBottom: '1rem' }}>
        <div className="bb-row" style={{ gap: '1.2rem' }}>
          <Avatar name={me?.name} size={84} />
          <div>
            <h2 style={{ margin: 0, fontSize: '1.6rem' }}>{me?.name ?? '…'}</h2>
            <span className="bb-chip bb-chip-cyan"><Icon name="users" size={14} /> Parent account</span>
            <div className="bb-muted bb-small" style={{ marginTop: 8 }}>
              <div><Icon name="mail" size={14} /> {me?.email}</div>
              <div><Icon name="phone" size={14} /> {me?.phone ?? '—'}</div>
            </div>
          </div>
        </div>
        <button className="bb-btn bb-btn-ghost" onClick={() => setEditing(true)}><Icon name="pencil" size={16} /> Edit profile</button>
      </section>

      <div className="bb-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', alignItems: 'start' }}>
        <section className="bb-card">
          <div className="bb-row bb-between">
            <h2 className="bb-card-title"><Icon name="users" /> Connected students</h2>
            <Link href="/parent/link" className="bb-btn bb-btn-sm"><Icon name="plus" size={14} /> Link</Link>
          </div>
          {children === null ? <div className="bb-skeleton" /> : children.length === 0 ? (
            <p className="bb-muted bb-small" style={{ margin: 0 }}>No student is linked yet.</p>
          ) : (
            <div className="bb-stack">
              {children.map((c) => (
                <div key={c.id} className="bb-row bb-between">
                  <div className="bb-row" style={{ gap: 10 }}>
                    <Avatar name={c.name} size={40} />
                    <div><b>{c.name}</b><div className="bb-small bb-muted">{c.university ?? 'Student'}</div></div>
                  </div>
                  <button className="bb-btn bb-btn-sm bb-btn-danger" onClick={() => unlink(c)}><Icon name="trash" size={14} /> Unlink</button>
                </div>
              ))}
            </div>
          )}
        </section>

        <ChangePasswordCard token={token} />

        <section className="bb-card">
          <h2 className="bb-card-title"><Icon name="shield" /> Privacy</h2>
          <p className="bb-muted bb-small" style={{ marginTop: 0 }}>You only see a child’s location between the moment they scan in and the moment they scan out. Your account and family information are protected.</p>
          <button className="bb-btn bb-btn-danger" onClick={() => { logout(); router.replace('/login'); }}><Icon name="logout" size={17} /> Log out</button>
        </section>
      </div>

      {editing && me && <EditModal me={me} token={token} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); setNotice('Profile updated.'); refreshMe(); }} />}
    </>
  );
}

function EditModal({ me, token, onClose, onSaved }: { me: any; token: string; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(me.name ?? '');
  const [phone, setPhone] = useState(me.phone ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  async function save() {
    const e: Record<string, string> = {};
    if (name.trim().length < 2) e.name = 'Enter your full name';
    if (!phoneOk(phone)) e.phone = `Enter a valid phone number, e.g. ${PHONE_HINT}`;
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    const r = await api(token, '/auth/me', { method: 'PATCH', body: { name: name.trim(), phone: phone.trim() } });
    setBusy(false);
    if (!r.ok) return setFormError(errorOf(r));
    onSaved();
  }
  return (
    <Modal title="Edit profile" onClose={onClose}>
      <div className="bb-stack">
        <Field icon="user" label="Full name" value={name} onChange={setName} error={errors.name} />
        <Field icon="phone" label="Phone" type="tel" value={phone} onChange={setPhone} error={errors.phone} />
        {formError && <div className="bb-alert bb-alert-error" role="alert">{formError}</div>}
        <div className="bb-row" style={{ justifyContent: 'flex-end' }}>
          <button className="bb-btn bb-btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="bb-btn" onClick={save} disabled={busy}>{busy ? <span className="bb-spinner" /> : 'Save'}</button>
        </div>
      </div>
    </Modal>
  );
}

export default function ParentProfilePage() {
  return <ParentShell><ProfileContent /></ParentShell>;
}
