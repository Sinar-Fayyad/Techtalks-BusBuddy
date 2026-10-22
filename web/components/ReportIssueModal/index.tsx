'use client';
import { useState } from 'react';
import Modal from '@/components/Modal';
import { api, errorOf } from '@/lib/client-api';

const CATS = [
  { v: 'breakdown', l: 'Breakdown' },
  { v: 'accident', l: 'Accident' },
  { v: 'delay', l: 'Delay' },
  { v: 'other', l: 'Other' },
];

// "Report vehicle issue": notifies parents of the students on board, nearby buses and the admins.
export default function ReportIssueModal({ token, onClose }: { token: string; onClose: () => void }) {
  const [category, setCategory] = useState('breakdown');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<{ parents: number; drivers: number; admins: number } | null>(null);

  async function send() {
    setBusy(true);
    setError('');
    const r = await api(token, '/driver/issues', { method: 'POST', body: { category, message: message.trim() || undefined } });
    setBusy(false);
    if (!r.ok) {
      console.error('report issue failed:', r.status, r.data);
      return setError(errorOf(r));
    }
    setDone(r.data.notified);
  }

  return (
    <Modal title="Report vehicle issue" onClose={onClose}>
      {done ? (
        <div className="bb-stack">
          <div className="bb-alert bb-alert-ok">
            Reported. Notified: {done.parents} parent{done.parents === 1 ? '' : 's'}, {done.drivers} nearby bus{done.drivers === 1 ? '' : 'es'}, {done.admins} admin{done.admins === 1 ? '' : 's'}.
          </div>
          <button className="bb-btn" onClick={onClose}>Close</button>
        </div>
      ) : (
        <div className="bb-stack">
          <p className="bb-muted bb-small" style={{ margin: 0 }}>
            Parents of the students on your bus, drivers of buses near you and the admins will be notified right away.
          </p>
          <div>
            <label className="bb-label" htmlFor="cat">What happened?</label>
            <select id="cat" className="bb-select" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATS.map((c) => <option key={c.v} value={c.v}>{c.l}</option>)}
            </select>
          </div>
          <div>
            <label className="bb-label" htmlFor="msg">Details (optional)</label>
            <textarea id="msg" className="bb-textarea" rows={3} maxLength={500} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="e.g. Flat tire near Jounieh, 15 min delay" />
          </div>
          {error && <div className="bb-alert bb-alert-error" role="alert">{error}</div>}
          <div className="bb-row" style={{ justifyContent: 'flex-end' }}>
            <button className="bb-btn bb-btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
            <button className="bb-btn bb-btn-danger" onClick={send} disabled={busy}>{busy ? <span className="bb-spinner" /> : 'Send report'}</button>
          </div>
        </div>
      )}
    </Modal>
  );
}
