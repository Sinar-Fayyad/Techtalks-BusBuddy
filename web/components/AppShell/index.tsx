'use client';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import styles from './AppShell.module.css';
import Icon from '@/components/ui/Icon';
import Avatar from '@/components/ui/Avatar';
import NotificationBell from '@/components/NotificationBell';
import { Role, useRequireRole } from '@/app/auth-context';
import { api } from '@/lib/client-api';

export type NavItem = { href: string; label: string; icon: string };
export type Me = {
  id: number; name: string; email: string; phone: string | null; university: string | null; role: Role;
};

const MeContext = createContext<{ me: Me | null; token: string; refreshMe: () => Promise<void> } | null>(null);

// Pages inside the shell read the logged-in user + token from here.
export function useMe() {
  const ctx = useContext(MeContext);
  if (!ctx) throw new Error('useMe must be used inside AppShell');
  return ctx;
}

const ROLE_LABEL: Record<Role, string> = { student: 'Student', parent: 'Parent', driver: 'Driver', admin: 'Admin' };

// Sidebar + top bar (bell, avatar) for every logged-in area. Also guards the role.
export default function AppShell({ role, nav, children }: { role: Role; nav: NavItem[]; children: ReactNode }) {
  const { allowed, token, logout } = useRequireRole(role);
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);

  const refreshMe = useCallback(async () => {
    if (!token) return;
    const r = await api(token, '/auth/me');
    if (r.ok) setMe(r.data.user);
    else if (r.status === 401) {
      logout();
      router.replace('/login');
    }
  }, [token, logout, router]);

  useEffect(() => {
    if (allowed) refreshMe();
  }, [allowed, refreshMe]);

  if (!allowed || !token) {
    return (
      <div className="bb-app-bg" style={{ display: 'grid', placeItems: 'center' }}>
        <span className="bb-spinner" />
      </div>
    );
  }

  const doLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <MeContext.Provider value={{ me, token, refreshMe }}>
      <div className={`bb-app-bg ${styles.layout}`}>
        <aside className={styles.sidebar}>
          <Link href={nav[0]?.href ?? '/'} className={styles.brand}>
            <span className="bb-logo-badge"><Image src="/busbuddy-logo.png" alt="BusBuddy" width={34} height={34} /></span>
            <span>
              <b>Bus<em>Buddy</em></b>
              <small>Safe Rides. Connected Families.</small>
            </span>
          </Link>
          <nav className={styles.nav}>
            {nav.map((n) => {
              const active = pathname === n.href || pathname.startsWith(n.href + '/');
              return (
                <Link key={n.href} href={n.href} className={`${styles.link} ${active ? styles.active : ''}`}>
                  <Icon name={n.icon} size={21} />
                  <span>{n.label}</span>
                </Link>
              );
            })}
          </nav>
          <button className={styles.logout} onClick={doLogout}>
            <Icon name="logout" size={19} /> Log out
          </button>
        </aside>

        <div className={styles.main}>
          <header className={styles.top}>
            <div className={styles.topRight}>
              <NotificationBell token={token} />
              <div className={styles.user}>
                <Avatar name={me?.name} size={40} />
                <span className={styles.userText}>
                  <b>{me?.name ?? '…'}</b>
                  <small>{ROLE_LABEL[role]}</small>
                </span>
              </div>
            </div>
          </header>
          <div className={styles.content}>{children}</div>
        </div>
      </div>
    </MeContext.Provider>
  );
}
