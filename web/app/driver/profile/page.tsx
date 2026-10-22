'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import DriverShell from '@/components/DriverShell';
import { useMe } from '@/components/AppShell';
import ChangePasswordCard from '@/components/ChangePasswordCard';
import ReportIssueModal from '@/components/ReportIssueModal';
import Modal from '@/components/Modal';
import Avatar from '@/components/ui/Avatar';
import Field from '@/components/ui/Field';
import Icon from '@/components/ui/Icon';
import PageHead from '@/components/ui/PageHead';
import StatusChip from '@/components/ui/StatusChip';
import { useAuth } from '@/app/auth-context';
import { api, errorOf } from '@/lib/client-api';
import { PHONE_HINT, phoneOk } from '@/lib/format';
import { viewLicense } from '@/lib/view-license';

type Tab = 'personal' | 'license' | 'vehicle' | 'settings';
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'personal', label: 'Personal Info', icon: 'user' },
  { id: 'license', label: 'License', icon: 'ticket' },
  { id: 'vehicle', label: 'Vehicle & Route', icon: 'bus' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
];
const STATUS_TEXT: Record<string, string> = {
  verified: 'You can appear to students and receive bookings.',
  pending: 'An admin is reviewing your license. You will be notified.',
  rejected: 'Your license was rejected. Upload a clearer copy in the License tab.',
};

function ProfileContent() {
  const { me, token, refreshMe } = useMe();
  const { logout } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('personal');
  const [d, setD] = useState<any | null>(null);
  const [counts, setCounts] = useState<any | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editing, setEditing] = useState(false);
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('tab');
    if (t && TABS.some((x) => x.id === t)) setTab(t as Tab);
  }, []);

  const load = useCallback(async () => {
    const [p, t] = await Promise.all([api(token, '/driver/me'), api(token, '/driver/scheduled-trips')]);
    if (p.ok) setD(p.data.driver); else setError(errorOf(p));
    if (t.ok) setCounts(t.data.counts);
  }, [token]);
  useEffect(() => { load(); }, [load]);

  return (
    <>
      <PageHead icon="user" highlight="Profile" subtitle="Manage your personal information and driver details" />
      {error && <div className="bb-alert bb-alert-error" style={{ marginBottom: '1rem' }} role="alert">{error}</div>}
      {notice && <div className="bb-alert bb-alert-ok" style={{ marginBottom: '1rem' }}>{notice}</div>}

      <div className="bb-grid" style={{ gridTemplateColumns: 'minmax(0, 2fr) minmax(260px, 1fr)', alignItems: 'start' }}>
        <div className="bb-stack">
          <section className="bb-card bb-card-glow bb-row" style={{ gap: '1.2rem' }}>
            <Avatar name={me?.name} size={84} />
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{me?.name ?? '…'}</h2>
              <div className="bb-row" style={{ gap: 8, margin: '4px 0 8px' }}>
                <span className="bb-muted">Driver</span>
                {d && <StatusChip status={d.status} />}
              </div>
              <div className="bb-muted bb-small">
                <div><Icon name="phone" size={14} /> {me?.phone ?? '—'}</div>
                <div><Icon name="mail" size={14} /> {me?.email}</div>
              </div>
            </div>
          </section>

          <div className="bb-tabs" role="tablist">
            {TABS.map((t) => (
              <button key={t.id} className="bb-tab" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>
                <Icon name={t.icon} size={15} /> {t.label}
              </button>
            ))}
          </div>

          {tab === 'personal' && (
            <section className="bb-card">
              <h2 className="bb-card-title"><Icon name="user" /> Personal information</h2>
              <div className="bb-kv"><span>Full name</span><span>{me?.name}</span></div>
              <div className="bb-kv"><span>Email</span><span>{me?.email}</span></div>
              <div className="bb-kv"><span>Phone</span><span>{me?.phone ?? '—'}</span></div>
              <button className="bb-btn" style={{ marginTop: 12 }} onClick={() => setEditing(true)}><Icon name="pencil" size={16} /> Edit profile</button>
            </section>
          )}
          {tab === 'license' && d && <LicenseTab d={d} token={token} onChanged={(m) => { setNotice(m); load(); }} onError={setError} />}
          {tab === 'vehicle' && d && <VehicleTab d={d} token={token} onSaved={() => { setNotice('Vehicle & route saved.'); load(); }} onError={setError} />}
          {tab === 'settings' && (
            <div className="bb-stack">
              <ChangePasswordCard token={token} />
              <section className="bb-card">
                <h2 className="bb-card-title"><Icon name="logout" /> Session</h2>
                <button className="bb-btn bb-btn-danger" onClick={() => { logout(); router.replace('/login'); }}><Icon name="logout" size={17} /> Log out</button>
              </section>
            </div>
          )}
        </div>

        <div className="bb-stack">
          <section className="bb-card">
            <h2 className="bb-card-title"><Icon name="shield" /> Driver status</h2>
            {d ? (
              <div className={`bb-alert ${d.status === 'verified' ? 'bb-alert-ok' : d.status === 'rejected' ? 'bb-alert-error' : 'bb-alert-info'}`}>
                <b style={{ textTransform: 'capitalize' }}>{d.status === 'verified' ? 'Approved' : d.status}</b>
                <div className="bb-small">{STATUS_TEXT[d.status]}</div>
              </div>
            ) : <div className="bb-skeleton" />}
          </section>
          <section className="bb-card">
            <h2 className="bb-card-title"><Icon name="alert" /> Quick actions</h2>
            <button className="bb-btn bb-btn-block bb-btn-danger" onClick={() => setReporting(true)}><Icon name="alert" size={16} /> Report vehicle issue</button>
          </section>
          <section className="bb-card">
            <h2 className="bb-card-title"><Icon name="route" /> Driver summary</h2>
            <div className="bb-kv"><span>Total trips</span><span>{counts?.total ?? '…'}</span></div>
            <div className="bb-kv"><span>Completed trips</span><span>{counts?.completed ?? '…'}</span></div>
            <div className="bb-kv"><span>Upcoming trips</span><span>{counts?.upcoming ?? '…'}</span></div>
            <div className="bb-kv"><span>Cancelled trips</span><span>{counts?.cancelled ?? '…'}</span></div>
          </section>
        </div>
      </div>

      {editing && me && <EditModal me={me} token={token} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); setNotice('Profile updated.'); refreshMe(); }} />}
      {reporting && <ReportIssueModal token={token} onClose={() => setReporting(false)} />}
    </>
  );
}

function LicenseTab({ d, token, onChanged, onError }: { d: any; token: string; onChanged: (m: string) => void; onError: (m: string) => void }) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const fileName = (d.license_url as string).split('/').pop() ?? '';

  async function view() {
    try { await viewLicense(token, fileName); } catch (e: any) { onError(e?.message ?? 'Could not open the license file.'); }
  }
  async function upload(file: File) {
    onError('');
    if (!/\.(pdf|jpe?g|png)$/i.test(file.name)) return onError('License must be a PDF, JPG or PNG.');
    if (file.size > 5 * 1024 * 1024) return onError('License file must be 5 MB or smaller.');
    setBusy(true);
    const form = new FormData();
    form.append('file', file);
    const up = await api(token, '/driver/license', { method: 'POST', form });
    if (!up.ok) { setBusy(false); return onError(errorOf(up)); }
    const r = await api(token, '/driver/me', { method: 'PATCH', body: { license_url: up.data.path } });
    setBusy(false);
    if (!r.ok) return onError(errorOf(r));
    onChanged('New license uploaded. An admin will review it.');
  }

  return (
    <section className="bb-card">
      <h2 className="bb-card-title"><Icon name="ticket" /> Driving license</h2>
      <div className="bb-kv"><span>Status</span><span><StatusChip status={d.status} /></span></div>
      <div className="bb-kv"><span>File</span><span>{fileName}</span></div>
      <div className="bb-row" style={{ marginTop: 12 }}>
        <button className="bb-btn bb-btn-ghost" onClick={view}><Icon name="eye" size={16} /> View license</button>
        <input ref={fileRef} type="file" style={{ display: 'none' }} accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ''; }} />
        <button className="bb-btn" onClick={() => fileRef.current?.click()} disabled={busy}>{busy ? <span className="bb-spinner" /> : 'Upload a new license'}</button>
      </div>
      <p className="bb-small bb-muted" style={{ marginBottom: 0 }}>A new license goes back to “Pending” until an admin verifies it. PDF, JPG or PNG, max 5 MB.</p>
    </section>
  );
}

function VehicleTab({ d, token, onSaved, onError }: { d: any; token: string; onSaved: () => void; onError: (m: string) => void }) {
  const [plate, setPlate] = useState(d.vehicle_plate ?? '');
  const [seats, setSeats] = useState(d.seats ? String(d.seats) : '');
  const [price, setPrice] = useState(d.price !== null && d.price !== undefined ? String(d.price) : '');
  const [route, setRoute] = useState(d.route ?? '');
  const [stops, setStops] = useState(d.stops ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function save() {
    onError('');
    const e: Record<string, string> = {};
    if (!plate.trim()) e.plate = 'Enter your vehicle plate';
    const n = Number(seats);
    if (!Number.isInteger(n) || n < 1 || n > 100) e.seats = 'Seats must be a whole number from 1 to 100';
    const p = Number(price);
    if (price === '' || !Number.isFinite(p) || p < 0) e.price = 'Enter a valid price';
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    const r = await api(token, '/driver/me', { method: 'PATCH', body: { vehicle_plate: plate.trim(), seats: n, price: p, route: route.trim() || null, stops: stops.trim() || null } });
    setBusy(false);
    if (!r.ok) return onError(errorOf(r));
    onSaved();
  }

  return (
    <section className="bb-card">
      <h2 className="bb-card-title"><Icon name="bus" /> Vehicle &amp; route</h2>
      <div className="bb-stack">
        <Field icon="bus" label="Vehicle plate" value={plate} onChange={setPlate} error={errors.plate} placeholder="e.g. B 123456" />
        <div className="bb-row" style={{ gap: 10, alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}><Field icon="seat" label="Seats" type="number" value={seats} onChange={setSeats} error={errors.seats} /></div>
          <div style={{ flex: 1 }}><Field icon="dollar" label="Default price per ride ($)" type="number" value={price} onChange={setPrice} error={errors.price} /></div>
        </div>
        <Field icon="route" label="Usual route (optional)" value={route} onChange={setRoute} placeholder="e.g. Jounieh - Kaslik - Campus" />
        <div>
          <label className="bb-label" htmlFor="v-stops">Usual stops (optional, one per line)</label>
          <textarea id="v-stops" className="bb-textarea" rows={3} value={stops} onChange={(e) => setStops(e.target.value)} />
        </div>
        <p className="bb-small bb-muted" style={{ margin: 0 }}>Seats and price are used as the defaults when you add a new trip.</p>
        <button className="bb-btn" onClick={save} disabled={busy}>{busy ? <span className="bb-spinner" /> : 'Save'}</button>
      </div>
    </section>
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
    const r = await api(token, '/driver/me', { method: 'PATCH', body: { name: name.trim(), phone: phone.trim() } });
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

export default function DriverProfilePage() {
  return <DriverShell><ProfileContent /></DriverShell>;
}
