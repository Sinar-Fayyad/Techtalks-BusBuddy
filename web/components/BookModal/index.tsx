'use client';
import { useState } from 'react';
import Modal from '@/components/Modal';
import { AvailableTrip } from '@/components/TripCard';
import { api, errorOf } from '@/lib/client-api';
import { fmtDay, fmtTime, money, parseStops } from '@/lib/format';

// Confirm a booking. The pickup stop is optional (free text, or tap one of the driver's stops).
export default function BookModal({
  trip, token, onClose, onBooked,
}: { trip: AvailableTrip; token: string; onClose: () => void; onBooked: () => void }) {
  const [pickup, setPickup] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const stops = parseStops(trip.stops);

  async function confirm() {
    setBusy(true);
    setError('');
    const r = await api(token, '/bookings', { method: 'POST', body: { scheduledTripId: trip.id, pickup: pickup.trim() || undefined } });
    setBusy(false);
    if (!r.ok) {
      console.error('booking failed:', r.status, r.data);
      setError(errorOf(r));
      if (r.status === 409) setTimeout(onBooked, 1500); // trip changed meanwhile -> refresh the list
      return;
    }
    onBooked();
    onClose();
  }

  return (
    <Modal title="Book this ride" onClose={onClose}>
      <div className="bb-stack">
        <div>
          <b style={{ fontSize: '1.1rem' }}>{trip.origin} → {trip.destination}</b>
          <div className="bb-muted bb-small">{fmtDay(trip.scheduled_at)} · {fmtTime(trip.scheduled_at)} · {money(trip.price)} per ride</div>
          <div className="bb-muted bb-small">Driver: {trip.driver_name}{trip.vehicle_plate ? ` · Bus ${trip.vehicle_plate}` : ''}</div>
        </div>
        <div>
          <label className="bb-label" htmlFor="pickup">Pickup stop (optional)</label>
          <input id="pickup" className="bb-input" placeholder="Where should the driver pick you up?" value={pickup} maxLength={255} onChange={(e) => setPickup(e.target.value)} />
          {stops.length > 0 && (
            <div className="bb-row" style={{ marginTop: 8, gap: 6 }}>
              {stops.map((s, i) => (
                <button key={i} type="button" className="bb-chip bb-chip-cyan" style={{ cursor: 'pointer' }} onClick={() => setPickup(s.name)}>
                  {s.name}
                </button>
              ))}
            </div>
          )}
        </div>
        {error && <div className="bb-alert bb-alert-error" role="alert">{error}</div>}
        <div className="bb-row" style={{ justifyContent: 'flex-end' }}>
          <button className="bb-btn bb-btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="bb-btn" onClick={confirm} disabled={busy}>{busy ? <span className="bb-spinner" /> : 'Confirm booking'}</button>
        </div>
      </div>
    </Modal>
  );
}
