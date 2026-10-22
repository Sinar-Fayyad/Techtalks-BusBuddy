'use client';
import { useState } from 'react';
import Modal from '@/components/Modal';
import { api, errorOf } from '@/lib/client-api';
import { localInputToIso, toLocalInput } from '@/lib/format';

export type TripDraft = {
  id?: number; origin: string; destination: string; scheduled_at: string; seats: number | string; price: number | string; stops: string | null;
};

// Add or edit a planned trip. `defaults` = driver profile values that prefill a NEW trip.
export default function TripFormModal({
  token, trip, defaults, onClose, onSaved,
}: {
  token: string; trip?: TripDraft; defaults?: { seats?: number | null; price?: string | number | null };
  onClose: () => void; onSaved: (msg: string) => void;
}) {
  const editing = !!trip?.id;
  const [origin, setOrigin] = useState(trip?.origin ?? '');
  const [destination, setDestination] = useState(trip?.destination ?? '');
  const [when, setWhen] = useState(trip ? toLocalInput(trip.scheduled_at) : '');
  const [seats, setSeats] = useState(String(trip?.seats ?? defaults?.seats ?? ''));
  const [price, setPrice] = useState(String(trip?.price ?? defaults?.price ?? ''));
  const [stops, setStops] = useState(trip?.stops ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  async function save() {
    const e: Record<string, string> = {};
    if (!origin.trim()) e.origin = 'Enter the starting point';
    if (!destination.trim()) e.destination = 'Enter the destination';
    if (!when) e.when = 'Pick a date and time';
    else if (new Date(when).getTime() < Date.now() - 60 * 60 * 1000) e.when = 'This time is in the past';
    const n = Number(seats);
    if (!Number.isInteger(n) || n < 1 || n > 100) e.seats = 'Seats must be a whole number from 1 to 100';
    const p = price === '' ? 0 : Number(price);
    if (!Number.isFinite(p) || p < 0) e.price = 'Enter a valid price';
    setErrors(e);
    if (Object.keys(e).length) return;

    setBusy(true);
    setFormError('');
    const body = { origin: origin.trim(), destination: destination.trim(), scheduled_at: localInputToIso(when), seats: n, price: p, stops: stops.trim() || (editing ? null : undefined) };
    const r = editing
      ? await api(token, `/driver/scheduled-trips/${trip!.id}`, { method: 'PATCH', body })
      : await api(token, '/driver/scheduled-trips', { method: 'POST', body });
    setBusy(false);
    if (!r.ok) {
      console.error('save trip failed:', r.status, r.data);
      return setFormError(errorOf(r));
    }
    onSaved(editing ? 'Trip updated.' : 'Trip created.');
    onClose();
  }

  const err = (k: string) => errors[k] && <p className="bb-field-error">{errors[k]}</p>;
  return (
    <Modal title={editing ? 'Edit trip' : 'Add a trip'} onClose={onClose}>
      <div className="bb-stack">
        <div className="bb-row" style={{ gap: 10, alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label className="bb-label" htmlFor="t-o">From</label>
            <input id="t-o" className="bb-input" value={origin} maxLength={150} onChange={(e) => setOrigin(e.target.value)} placeholder="e.g. Jounieh" />
            {err('origin')}
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label className="bb-label" htmlFor="t-d">To</label>
            <input id="t-d" className="bb-input" value={destination} maxLength={150} onChange={(e) => setDestination(e.target.value)} placeholder="e.g. University campus" />
            {err('destination')}
          </div>
        </div>
        <div>
          <label className="bb-label" htmlFor="t-w">Date and time</label>
          <input id="t-w" type="datetime-local" className="bb-input" value={when} onChange={(e) => setWhen(e.target.value)} />
          {err('when')}
        </div>
        <div className="bb-row" style={{ gap: 10, alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <label className="bb-label" htmlFor="t-s">Seats</label>
            <input id="t-s" type="number" min={1} max={100} className="bb-input" value={seats} onChange={(e) => setSeats(e.target.value)} />
            {err('seats')}
          </div>
          <div style={{ flex: 1 }}>
            <label className="bb-label" htmlFor="t-p">Price per ride ($)</label>
            <input id="t-p" type="number" min={0} step="0.5" className="bb-input" value={price} onChange={(e) => setPrice(e.target.value)} />
            {err('price')}
          </div>
        </div>
        <div>
          <label className="bb-label" htmlFor="t-st">Stops (optional, one per line, e.g. “Hamra 7:15”)</label>
          <textarea id="t-st" className="bb-textarea" rows={3} value={stops} onChange={(e) => setStops(e.target.value)} />
        </div>
        {formError && <div className="bb-alert bb-alert-error" role="alert">{formError}</div>}
        <div className="bb-row" style={{ justifyContent: 'flex-end' }}>
          <button className="bb-btn bb-btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="bb-btn" onClick={save} disabled={busy}>{busy ? <span className="bb-spinner" /> : editing ? 'Save changes' : 'Create trip'}</button>
        </div>
      </div>
    </Modal>
  );
}
