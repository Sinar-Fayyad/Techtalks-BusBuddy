'use client';
import dynamic from 'next/dynamic';

// Leaflet touches `window`, so it can NEVER render on the server.
// next/dynamic with { ssr: false } throws if called from a Server Component —
// that's exactly why this file starts with 'use client'.
const LeafletMap = dynamic<LiveBusMapProps>(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: 320,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        border: '1px solid var(--bb-link)',
        color: 'var(--text-muted)',
        fontSize: 13,
      }}
    >
      Loading map…
    </div>
  ),
});

export type LiveBusMapProps = {
  latitude: number | null;
  longitude: number | null;
  locationUpdatedAt?: string | null;
  staleAfterMs?: number;
  height?: number;
};

// Public component. Import THIS one anywhere — never import LeafletMap directly.
export default function LiveBusMap(props: LiveBusMapProps) {
  return <LeafletMap {...props} />;
}
