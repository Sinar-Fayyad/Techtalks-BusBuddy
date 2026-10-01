'use client';
import { useEffect, useRef } from 'react';
import L from 'leaflet';

export type LeafletMapProps = {
  latitude: number | null;
  longitude: number | null;
  locationUpdatedAt?: string | null; // UTC string from the API, e.g. "2026-09-30 16:05:35.123"
  staleAfterMs?: number;             // how old before we call it "last known position"
  height?: number;
};

// Custom bus marker — avoids Leaflet's famous broken default marker image under bundlers.
const busIcon = L.divIcon({
  className: 'bb-bus-marker',
  html:
    '<div style="width:32px;height:32px;border-radius:50%;background:#2563eb;' +
    'color:#fff;display:flex;align-items:center;justify-content:center;' +
    'font-size:18px;box-shadow:0 2px 6px rgba(0,0,0,.35)">🚌</div>',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

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
  staleAfterMs = 120_000, // 2 minutes
  height = 320,
}: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const hasCoords =
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);

  const stale = hasCoords && isStale(locationUpdatedAt, staleAfterMs);

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

    if (!markerRef.current) {
      markerRef.current = L.marker(pos, { icon: busIcon }).addTo(map); // created once
    } else {
      markerRef.current.setLatLng(pos); // moved in place — no flicker, no new marker
    }
    map.panTo(pos);
  }, [hasCoords, latitude, longitude]);

  return (
    <div>
      <div
        ref={containerRef}
        style={{
          height,
          width: '100%',
          borderRadius: 12,
          border: '1px solid var(--bb-link)',
          overflow: 'hidden',
        }}
      />
      {!hasCoords && (
        <p className="mt-2" style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          Location unavailable — the driver hasn&apos;t shared a position yet.
        </p>
      )}
      {stale && (
        <p className="mt-2" style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          Last known position (updated {new Date(parseUtc(locationUpdatedAt!)).toLocaleString()}).
        </p>
      )}
    </div>
  );
}
