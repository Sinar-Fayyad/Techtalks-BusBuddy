'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/app/auth-context';
import Button from '@/components/Button';
import ErrorMessage from '@/components/ErrorMessage';
import styles from './GpsShare.module.css';

const SEND_INTERVAL_MS = 10_000; // contract: max 1 ping per 10 s
const TICK_MS = 2_000; // how often we check if 10 s have passed

type Coords = { latitude: number; longitude: number };

export default function GpsShare({ tripActive }: { tripActive: boolean }) {
  const { token } = useAuth();

  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSent, setLastSent] = useState<string | null>(null);

  // Refs: changeable values that must NOT re-render the page
  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const coordsRef = useRef<Coords | null>(null); // newest fix, even between renders
  const lastSentAtRef = useRef(0); // when the last POST STARTED (ms timestamp)
  const inFlightRef = useRef(false); // a POST is running → never overlap
  const activeRef = useRef(false); // is this sharing session still alive?

  // If the trip stops (Stop button / 409), sync the button state back down
  useEffect(() => {
    if (!tripActive) setSharing(false);
  }, [tripActive]);

  const shouldShare = sharing && tripActive;

  useEffect(() => {
    if (!shouldShare || !token) return;

    if (!('geolocation' in navigator)) {
      setError('This browser does not support location sharing.');
      setSharing(false);
      return;
    }

    activeRef.current = true;
    setError(null);
    setLastSent(null);

    const send = async (force = false) => {
      if (!activeRef.current || inFlightRef.current) return;
      const now = Date.now();
      if (!force && now - lastSentAtRef.current < SEND_INTERVAL_MS) return;
      const coords = coordsRef.current;
      if (!coords) return; // no GPS fix yet

      lastSentAtRef.current = now; // window starts when the POST starts
      inFlightRef.current = true;
      try {
        const res = await fetch('/api/driver/trips/location', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(coords),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          console.error('Location ping failed:', res.status, data);
          if (res.status === 409) {
            setError('Your trip has ended. Location sharing stopped.');
            setSharing(false);
          } else if (res.status === 403) {
            setError('Only verified drivers can share location. Sharing stopped.');
            setSharing(false);
          } else if (res.status === 401) {
            setError('Session expired. Please log in again.');
            setSharing(false);
          } else {
            setError('Could not send location. Retrying automatically…');
          }
          return;
        }
        setLastSent(new Date().toLocaleTimeString());
        setError(null);
      } catch (e) {
        console.error('Location ping network error', e);
        setError('Network problem while sending location. Retrying automatically…');
      } finally {
        inFlightRef.current = false;
      }
    };

    const onSuccess = (pos: GeolocationPosition) => {
      if (!activeRef.current) return;
      coordsRef.current = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      };
      if (lastSentAtRef.current === 0) void send(true); // first fix → ping immediately
    };

    const onError = (err: GeolocationPositionError) => {
      if (!activeRef.current) return;
      console.error('Geolocation error:', err.code, err.message);
      if (err.code === err.PERMISSION_DENIED) {
        setError(
          'Location permission was denied. You can still start/stop your trip; enable location in your browser settings to share it.'
        );
        setSharing(false); // cleanup below stops everything
      } else {
        // TIMEOUT / POSITION_UNAVAILABLE = often temporary → keep trying
        setError('Trouble getting your position — still trying…');
      }
    };

    watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 15000,
    });
    timerRef.current = setInterval(() => void send(), TICK_MS);

    // CLEANUP — this is what makes "auto-stop on trip stop / unmount" work for free
    return () => {
      activeRef.current = false; // late callbacks/responses are ignored
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      if (timerRef.current !== null) clearInterval(timerRef.current);
      timerRef.current = null;
      coordsRef.current = null;
      lastSentAtRef.current = 0;
      inFlightRef.current = false;
    };
  }, [shouldShare, token]);

  const handleToggle = () => {
    if (sharing) {
      setSharing(false); // effect cleanup stops watcher + timer
      setError(null);
      setLastSent(null);
    } else {
      setSharing(true);
    }
  };

  if (!tripActive) return <p className={styles.hint}>Start a trip to share your location.</p>;

  return (
    <section>
      <Button onClick={handleToggle}>
        {sharing ? 'Stop sharing location' : 'Share location'}
      </Button>
      {sharing && (
        <p className={styles.status}>
          Sending your position every 10 s ·{' '}
          {lastSent ? `last ping ${lastSent}` : 'waiting for first fix…'}
        </p>
      )}
      {error && <ErrorMessage message={error} />}
    </section>
  );
}