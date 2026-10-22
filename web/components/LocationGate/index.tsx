'use client';
import { useState } from 'react';
import Modal from '@/components/Modal';
import Icon from '@/components/ui/Icon';

// Asks the browser for location BEFORE the first Start Trip. Location is required to share the
// bus position, so there is no "continue without permissions" option.
export default function LocationGate({ onGranted, onClose }: { onGranted: () => void; onClose: () => void }) {
  const [state, setState] = useState<'ask' | 'asking' | 'blocked'>('ask');

  function request() {
    if (!('geolocation' in navigator)) return setState('blocked');
    setState('asking');
    navigator.geolocation.getCurrentPosition(
      () => onGranted(),
      (err) => {
        console.error('permission gate:', err.code, err.message);
        setState('blocked');
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  return (
    <Modal title="Allow permissions" onClose={onClose}>
      <div className="bb-stack">
        <div className="bb-card" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span className="bb-page-icon" style={{ width: 46, height: 46 }}><Icon name="pin" size={22} /></span>
          <div>
            <b>Location</b>
            <div className="bb-small bb-muted">Required for GPS tracking: students and parents see your bus live while a trip is running.</div>
          </div>
        </div>
        {state === 'blocked' && (
          <div className="bb-alert bb-alert-error" role="alert">
            Location is blocked. Click the lock icon next to the address bar, set Location to <b>Allow</b>, then try again.
          </div>
        )}
        <button className="bb-btn bb-btn-block" onClick={request} disabled={state === 'asking'}>
          {state === 'asking' ? <span className="bb-spinner" /> : state === 'blocked' ? 'Try again' : 'Allow location'}
        </button>
      </div>
    </Modal>
  );
}
