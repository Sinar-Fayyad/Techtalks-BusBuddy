import { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './SiteShell.module.css';

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/features', label: 'Features' },
  { href: '/contact', label: 'Contact' },
];

// Public pages (landing, About, Features, Contact): same header, each page is its own screen.
export default function SiteShell({ active, children }: { active: string; children: ReactNode }) {
  return (
    <main className={styles.page}>
      <header className={styles.nav}>
        <Link href="/" className={styles.brand}>
          <span className="bb-logo-badge"><Image src="/busbuddy-logo.png" alt="" width={34} height={34} /></span>
          <span><span className={styles.accent}>Bus</span>Buddy</span>
        </Link>
        <nav className={styles.links} aria-label="Main">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={l.href === active ? styles.activeLink : undefined}>{l.label}</Link>
          ))}
        </nav>
      </header>
      {children}
    </main>
  );
}
