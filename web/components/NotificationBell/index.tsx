'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './NotificationBell.module.css';
import Icon from '@/components/ui/Icon';
import { api } from '@/lib/client-api';
import { timeAgo } from '@/lib/format';

type Notif = { id: number; type: string; title: string; body: string; created_at: string; read_at: string | null };

const EMOJI: Record<string, string> = {
  boarded: '🚌', exited: '🏁', trip_started: '🟢', booking: '🎟️', cancelled: '⚠️',
  issue: '🚨', linked: '🔗', driver_status: '🪪',
};

// The bell in the top bar. Polls every 30s; click opens the list.
export default function NotificationBell({ token }: { token: string }) {
  const [items, setItems] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    const r = await api(token, '/notifications');
    if (r.ok) {
      setItems(r.data.notifications ?? []);
      setUnread(r.data.unread_count ?? 0);
    }
  }, [token]);

  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const markAll = async () => {
    await api(token, '/notifications/read', { method: 'POST', body: {} });
    load();
  };
  const markOne = async (n: Notif) => {
    if (n.read_at) return;
    await api(token, '/notifications/read', { method: 'POST', body: { id: n.id } });
    load();
  };

  return (
    <div className={styles.wrap} ref={boxRef}>
      <button className={styles.bell} onClick={() => { setOpen((o) => !o); if (!open) load(); }} aria-label="Notifications">
        <Icon name="bell" size={22} />
        {unread > 0 && <span className={styles.badge}>{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div className={`bb-card ${styles.panel}`}>
          <div className="bb-row bb-between" style={{ marginBottom: 8 }}>
            <strong>Notifications</strong>
            {unread > 0 && (
              <button className={styles.link} onClick={markAll}>Mark all read</button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="bb-muted bb-small" style={{ margin: '1rem 0', textAlign: 'center' }}>No notifications yet.</p>
          ) : (
            <ul className={styles.list}>
              {items.map((n) => (
                <li key={n.id} className={n.read_at ? styles.read : styles.unread} onClick={() => markOne(n)}>
                  <span className={styles.emoji}>{EMOJI[n.type] ?? '🔔'}</span>
                  <div>
                    <div className={styles.title}>{n.title}</div>
                    <div className={styles.body}>{n.body}</div>
                    <div className={styles.time}>{timeAgo(n.created_at)}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
