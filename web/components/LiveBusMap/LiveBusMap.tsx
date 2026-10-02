'use client';
import dynamic from 'next/dynamic';
import type { LeafletMapProps } from '../LeafletMap/LeafletMap';
import styles from './LiveBusMap.module.css';

// Leaflet touches `window`, so it can NEVER render on the server.
// next/dynamic with { ssr: false } throws if called from a Server Component —
// that's exactly why this file starts with 'use client'.
const LeafletMap = dynamic<LeafletMapProps>(() => import('../LeafletMap/LeafletMap'), {
  ssr: false,
  loading: () => <div className={styles.loadingBox}>Loading map…</div>,
});

export type LiveBusMapProps = LeafletMapProps;

// Public component. Import THIS one anywhere ('@/components/LiveBusMap') —
// never import LeafletMap directly. index.tsx keeps the old import path working,
// so no page edits were needed for the folder move (T12).
export default function LiveBusMap(props: LiveBusMapProps) {
  return <LeafletMap {...props} />;
}
