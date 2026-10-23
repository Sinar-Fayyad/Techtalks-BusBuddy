'use client';
import { useEffect, useMemo, useState } from 'react';
import ParentShell from '@/components/ParentShell';
import { useMe } from '@/components/AppShell';
import { useLiveChildren, LiveChild } from '@/components/useLiveChildren';
import ChildrenMap, { MapChild } from '@/components/ChildrenMap';
import PageHead from '@/components/ui/PageHead';
import StatusChip from '@/components/ui/StatusChip';
import Avatar from '@/components/ui/Avatar';
import Icon from '@/components/ui/Icon';
import { fmtTime, timeAgo } from '@/lib/format';

function MapContent() {
  const { token } = useMe();
  const { children, error } = useLiveChildren(token);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    const c = Number(new URLSearchParams(window.location.search).get('child'));
    if (c) setSelected(c);
  }, []);

  const all = children ?? [];
  const onBoard = all.filter((c) => c.status === 'on_board' && c.trip?.latitude && c.trip?.longitude);
  const markers: MapChild[] = useMemo(
    () => onBoard.map((c) => ({ id: c.id, name: c.name, latitude: Number(c.trip!.latitude), longitude: Number(c.trip!.longitude), updatedAt: c.trip!.location_updated_at })),
    [children] // eslint-disable-line react-hooks/exhaustive-deps
  );
  // default selection: the requested child, else the first child on the bus, else the first child
  const sel: LiveChild | undefined = all.find((c) => c.id === selected) ?? all.find((c) => c.status === 'on_board') ?? all[0];

  return (
    <>
      <PageHead icon="pin" highlight="Live Map" title="" subtitle="Track your child’s bus in real time" />
      {error && <div className="bb-alert bb-alert-error" style={{ marginBottom: '1rem' }} role="alert">{error}</div>}

      {children === null ? <div className="bb-skeleton" style={{ height: 300 }} /> : all.length === 0 ? (
        <div className="bb-card bb-empty"><span className="bb-emoji">🔗</span>Link a student first to see their rides on the map.</div>
      ) : (
        <>
          <div className="bb-row" style={{ marginBottom: '1rem' }}>
            {all.map((c) => (
              <button key={c.id} className="bb-tab" aria-selected={sel?.id === c.id} onClick={() => setSelected(c.id)}>
                {c.name.split(' ')[0]} · {c.status === 'on_board' ? 'on the bus' : c.status === 'waiting' ? 'waiting' : c.status === 'arrived' ? 'arrived' : 'not travelling'}
              </button>
            ))}
          </div>
          <div className="bb-grid" style={{ gridTemplateColumns: 'minmax(0, 2fr) minmax(260px, 1fr)', alignItems: 'start' }}>
            <div>
              <ChildrenMap children={markers} selectedId={sel?.id ?? null} onSelect={setSelected} height={470} />
              {markers.length === 0 && (
                <div className="bb-alert bb-alert-info" style={{ marginTop: 10 }}>No child is on a bus right now. The map shows a child only while they are on board.</div>
              )}
            </div>

            {sel && (
              <aside className="bb-stack">
                <section className="bb-card bb-card-glow">
                  <div className="bb-row" style={{ gap: 12, flexWrap: 'nowrap' }}>
                    <Avatar name={sel.name} size={64} />
                    <div>
                      <h2 style={{ margin: 0 }}>{sel.name}</h2>
                      <div className="bb-muted bb-small">{sel.university ?? 'Student'}</div>
                      <div style={{ marginTop: 4 }}><StatusChip status={sel.status} /></div>
                    </div>
                  </div>
                </section>

                {sel.status === 'on_board' && sel.trip && (
                  <>
                    <section className="bb-card">
                      <h2 className="bb-card-title"><Icon name="route" /> Trip details</h2>
                      <div className="bb-kv"><span>Route</span><span>{sel.trip.origin ? `${sel.trip.origin} → ${sel.trip.destination}` : '—'}</span></div>
                      <div className="bb-kv"><span>Boarded</span><span>{fmtTime(sel.trip.boarded_at)}</span></div>
                      <div className="bb-kv"><span>Last update</span><span>{sel.trip.location_updated_at ? timeAgo(sel.trip.location_updated_at) : 'Waiting for GPS'}</span></div>
                    </section>
                    <section className="bb-card">
                      <h2 className="bb-card-title"><Icon name="bus" /> Driver</h2>
                      <div className="bb-row bb-between">
                        <div>
                          <b>{sel.trip.driver_name}</b>
                          {sel.trip.vehicle_plate && <div className="bb-small bb-muted">Bus {sel.trip.vehicle_plate}</div>}
                        </div>
                        {sel.trip.driver_phone && <a className="bb-btn bb-btn-sm" href={`tel:${sel.trip.driver_phone}`}><Icon name="phone" size={15} /> Call</a>}
                      </div>
                    </section>
                  </>
                )}
                {sel.status === 'waiting' && (
                  <div className="bb-alert bb-alert-info">The trip has started, but {sel.name.split(' ')[0]} has not boarded yet. You will see the bus as soon as they scan in.</div>
                )}
                {sel.status === 'arrived' && sel.trip && (
                  <div className="bb-alert bb-alert-ok">Arrived at {fmtTime(sel.trip.exited_at ?? sel.trip.end_time)}. Location sharing has stopped.</div>
                )}
                {sel.status === 'idle' && <div className="bb-alert bb-alert-info">{sel.name.split(' ')[0]} is not on a trip right now.</div>}

                <div className="bb-alert bb-alert-info"><Icon name="shield" size={15} /> Your child’s location is shared with you for this trip only.</div>
              </aside>
            )}
          </div>
        </>
      )}
    </>
  );
}

export default function ParentMapPage() {
  return <ParentShell><MapContent /></ParentShell>;
}
