'use client';
import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/ui/Icon';

const SEND_INTERVAL_MS = 10_000; // contract: max 1 ping per 10 s
const TICK_MS = 2_000;

// Shares the driver's GPS while a trip is running. Starts by itself (no extra button),
// can be paused. Same rules as before: max 1 ping / 10 s, never two requests at once.
export default function DriverGps({ token, tripActive }: { token: string; tripActive: boolean }) {
  const [paused, setPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSent, setLastSent] = useState<string | null>(null);
  const coordsRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const lastSentAtRef = useRef(0);
  const inFlightRef = useRef(false);
  const activeRef = useRef(false);

  const sharing = tripActive && !paused;

  useEffect(() => {
    if (!sharing) return;
    if (!('geolocation' in navigator)) {
      setError('This browser does not support location sharing.');
      return;
    }
    activeRef.current = true;
    setError(null);

    const send = async (force = false) => {
      if (!activeRef.current || inFlightRef.current) return;
      const now = Date.now();
      if (!force && now - lastSentAtRef.current < SEND_INTERVAL_MS) return;
      const coords = coordsRef.current;
      if (!coords) return;
      lastSentAtRef.current = now;
      inFlightRef.current = true;
      try {
        const res = await fetch('/api/driver/trips/location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(coords),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          console.error('Location ping failed:', res.status, data);
          if (res.status === 409) { setError('Your trip has ended. Location sharing stopped.'); setPaused(true); }
          else if (res.status === 403) { setError('Only verified drivers can share location.'); setPaused(true); }
          else if (res.status === 401) { setError('Session expired. Please log in again.'); setPaused(true); }
          else setError('Could not send location. Retrying…');
          return;
        }
        setLastSent(new Date().toLocaleTimeString());
        setError(null);
      } catch (e) {
        console.error('Location ping network error', e);
        setError('Network problem while sending location. Retrying…');
      } finally {
        inFlightRef.current = false;
      }
    };

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (!activeRef.current) return;
        coordsRef.current = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        if (lastSentAtRef.current === 0) void send(true);
      },
      (err) => {
        if (!activeRef.current) return;
        console.error('Geolocation error:', err.code, err.message);
        if (err.code === err.PERMISSION_DENIED) {
          setError('Location permission is blocked. Allow location for this site in your browser settings, then press Resume.');
          setPaused(true);
        } else setError('Trouble getting your position — still trying…');
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
    const timer = setInterval(() => void send(), TICK_MS);
    return () => {
      activeRef.current = false;
      navigator.geolocation.clearWatch(watchId);
      clearInterval(timer);
      coordsRef.current = null;
      lastSentAtRef.current = 0;
      inFlightRef.current = false;
    };
  }, [sharing, token]);

  if (!tripActive) return null;
  return (
    <div className="bb-alert" style={{ borderColor: error ? 'rgba(255,107,107,0.5)' : 'var(--bb-line)', background: error ? 'rgba(255,107,107,0.12)' : 'rgba(0,229,255,0.08)' }}>
      <div className="bb-row bb-between">
        <span className="bb-row" style={{ gap: 8 }}>
          <Icon name="pin" size={18} />
          {error ? error : paused ? 'Location sharing paused.' : lastSent ? `Sharing your location · last sent ${lastSent}` : 'Getting your position…'}
        </span>
        <button className="bb-btn bb-btn-sm bb-btn-ghost" onClick={() => { setPaused((p) => !p); setError(null); }}>
          {paused ? 'Resume' : 'Pause'}
        </button>
      </div>
    </div>
  );
}
