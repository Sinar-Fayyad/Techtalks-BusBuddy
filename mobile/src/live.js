import { useCallback, useEffect, useState } from 'react';
import { call, errOf } from './net';

// All children of a parent + ride status in one call; refresh every 10 s while someone travels, else 30 s.
export function useLiveChildren(token) {
  const [children, setChildren] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    const r = await call(token, '/parents/me/children/live');
    if (r.ok) { setChildren(r.data.children); setError(''); } else setError(errOf(r));
  }, [token]);
  const travelling = (children || []).some((c) => c.status === 'on_board' || c.status === 'waiting');
  useEffect(() => {
    load();
    const id = setInterval(load, travelling ? 10000 : 30000);
    return () => clearInterval(id);
  }, [load, travelling]);
  return { children, error, reload: load };
}
