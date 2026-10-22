'use client';
import { useCallback, useEffect, useState } from 'react';
import { api, errorOf } from '@/lib/client-api';

export type LiveChild = {
  id: number; name: string; email: string; phone: string | null; university: string | null;
  status: 'idle' | 'waiting' | 'on_board' | 'arrived';
  trip: null | {
    id: number; driver_name: string; driver_phone: string | null; vehicle_plate: string | null;
    origin: string | null; destination: string | null; scheduled_at: string | null; start_time: string; end_time: string | null;
    latitude: string | null; longitude: string | null; location_updated_at: string | null;
    boarded_at: string | null; exited_at: string | null; phase: string;
  };
};

// One shared hook for the parent pages: all children + their ride status, refreshed
// every 10 s while somebody is travelling, every 30 s otherwise.
export function useLiveChildren(token: string) {
  const [children, setChildren] = useState<LiveChild[] | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const r = await api(token, '/parents/me/children/live');
    if (r.ok) { setChildren(r.data.children); setError(''); } else setError(errorOf(r));
  }, [token]);

  const travelling = (children ?? []).some((c) => c.status === 'on_board' || c.status === 'waiting');
  useEffect(() => {
    load();
    const id = setInterval(load, travelling ? 10_000 : 30_000);
    return () => clearInterval(id);
  }, [load, travelling]);

  return { children, error, reload: load };
}

export const CHILD_STATUS_LABEL: Record<string, string> = {
  idle: 'Not travelling', waiting: 'Waiting for the bus', on_board: 'On the bus', arrived: 'Arrived',
};
