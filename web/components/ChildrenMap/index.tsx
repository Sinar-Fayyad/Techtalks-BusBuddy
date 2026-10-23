'use client';
import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

export type MapChild = { id: number; name: string; latitude: number; longitude: number; updatedAt?: string | null };

// Map with one marker per child on a bus. Hover = name, click = select (parent sees the details).
export default function ChildrenMap({
  children, selectedId, onSelect, height = 420,
}: { children: MapChild[]; selectedId: number | null; onSelect: (id: number) => void; height?: number }) {
  const elRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const LRef = useRef<any>(null);
  const lastFitKey = useRef('');
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  // create the map once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelled || !elRef.current || mapRef.current) return;
      LRef.current = L;
      const map = L.map(elRef.current, { zoomControl: true }).setView([33.89, 35.5], 9);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);
      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      draw();
    })();
    return () => {
      cancelled = true;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function draw() {
    const L = LRef.current, map = mapRef.current, layer = layerRef.current;
    if (!L || !map || !layer) return;
    layer.clearLayers();
    children.forEach((c) => {
      const selected = c.id === selectedId;
      const initials = c.name.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
      const icon = L.divIcon({
        className: 'bb-bus-marker',
        html: `<div style="width:${selected ? 46 : 38}px;height:${selected ? 46 : 38}px;border-radius:50%;display:grid;place-items:center;font:800 ${selected ? 16 : 13}px sans-serif;color:#fff;background:linear-gradient(135deg,#00a3ff,#7a2cff 60%,#ff2bd6);border:3px solid ${selected ? '#00e5ff' : '#fff'};box-shadow:0 0 16px rgba(0,229,255,.8)">${initials}</div>`,
        iconSize: [selected ? 46 : 38, selected ? 46 : 38],
        iconAnchor: [selected ? 23 : 19, selected ? 23 : 19],
      });
      const m = L.marker([c.latitude, c.longitude], { icon, title: c.name }).addTo(layer);
      m.bindTooltip(c.name, { direction: 'top', offset: [0, -18] });
      m.on('click', () => onSelectRef.current(c.id));
    });

    const key = children.map((c) => c.id).sort().join(',');
    if (children.length > 0 && key !== lastFitKey.current) {
      lastFitKey.current = key;
      if (children.length === 1) map.setView([children[0].latitude, children[0].longitude], 15);
      else map.fitBounds(L.latLngBounds(children.map((c) => [c.latitude, c.longitude])), { padding: [60, 60], maxZoom: 16 });
    }
    if (children.length === 0) lastFitKey.current = '';
  }

  useEffect(draw, [children, selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  // centre on the selected child when the parent picks one
  useEffect(() => {
    const c = children.find((x) => x.id === selectedId);
    if (c && mapRef.current) mapRef.current.panTo([c.latitude, c.longitude]);
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ width: '100%', height, borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(0,229,255,0.45)', boxShadow: '0 0 18px rgba(0,229,255,0.12)' }}>
      <div ref={elRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
