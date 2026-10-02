'use client';
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import styles from './LeafletMap.module.css';

export type LeafletMapProps = {
  latitude: number | null;
  longitude: number | null;
  locationUpdatedAt?: string | null; // UTC string from the API, e.g. "2026-09-30 16:05:35.123"
  staleAfterMs?: number;             // how old before we call it "last known position"
  height?: number;
};

// T12: one icon factory, two colors — fresh (T6's blue) and stale (grey).
const makeBusIcon = (background: string) =>
  L.divIcon({
    className: 'bb-bus-marker',
    html:
      '<div style="width:32px;height:32px;border-radius:50%;background:' + background +
      ';color:#fff;display:flex;align-items:center;justify-content:center;' +
      'font-size:18px;box-shadow:0 2px 6px rgba(0,0,0,.35)">🚌</div>',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

const busIcon = makeBusIcon('#2563eb');
const busIconStale = makeBusIcon('#9ca3af');

// DB stores UTC but the API returns "YYYY-MM-DD HH:MM:SS.mmm" with NO timezone —
// so we force UTC before parsing, otherwise the age is off by the local offset.
function parseUtc(value: string): number {
  let s = value.trim().replace(' ', 'T');
  if (!/(Z|[+-]\d{2}:?\d{2})$/.test(s)) s += 'Z';
  return Date.parse(s);
}

function isStale(updatedAt: string | null | undefined, staleAfterMs: number): boolean {
  if (!updatedAt) return false;
  const t = parseUtc(updatedAt);
  if (Number.isNaN(t)) return false;
  return Date.now() - t > staleAfterMs;
}

export default function LeafletMap({
  latitude,
  longitude,
  locationUpdatedAt = null,
  staleAfterMs = 120_000, // 2 minutes default; the student page passes 30s (T12)
  height = 320,
}: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // T12: ticking clock for the live "Updated Xs ago" text.
  // Starts null and is set inside useEffect (hydration lesson from T6's log —
  // never initialize state with a time value during render).
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const hasCoords =
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);

  const stale = hasCoords && isStale(locationUpdatedAt, staleAfterMs);

  // T12: live age in whole seconds (null when we have nothing to measure).
  const ageSeconds =
    now !== null && locationUpdatedAt && !Number.isNaN(parseUtc(locationUpdatedAt))
      ? Math.max(0, Math.floor((now - parseUtc(locationUpdatedAt)) / 1000))
      : null;

  // --- 1. Create the map ONCE. Deps are empty on purpose: coordinates must
  //        never recreate the map (that's the jank we're avoiding).
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current).setView(
      hasCoords ? [latitude as number, longitude as number] : [33.8938, 35.5018],
      hasCoords ? 15 : 8
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    // Cleanup runs on unmount — and Strict Mode runs it once in dev, so this
    // is what stops a duplicate map/marker from piling up.
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- 2. Move ONE marker in place. Never re-create it — just setLatLng().
  //        T12: also swap the icon (grey) when the position goes stale —
  //        `stale` is a dependency so setIcon runs only when it FLIPS.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!hasCoords) {
      // No coordinates: remove the marker so nothing points at a wrong place.
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      return;
    }

    const pos: L.LatLngExpression = [latitude as number, longitude as number];
    const icon = stale ? busIconStale : busIcon;

    if (!markerRef.current) {
      markerRef.current = L.marker(pos, { icon }).addTo(map); // created once
    } else {
      markerRef.current.setLatLng(pos); // moved in place — no flicker, no new marker
      markerRef.current.setIcon(icon);  // T12: grey when stale, blue when fresh
    }
    map.panTo(pos);
  }, [hasCoords, latitude, longitude, stale]);

  return (
    <div>
      <div
        ref={containerRef}
        className={styles.mapFrame}
        style={{ height }}
      />
      {!hasCoords && (
        <p className={styles.statusLine}>
          Location unavailable — the driver hasn&apos;t shared a position yet.
        </p>
      )}
      {hasCoords && ageSeconds !== null && (stale ? (
        <p className={styles.statusStale}>
          ⚠️ Last known position — updated {ageSeconds}s ago (no fresh GPS from the driver).
        </p>
      ) : (
        <p className={styles.statusLine}>
          Updated {ageSeconds}s ago
        </p>
      ))}
    </div>
  );
}
