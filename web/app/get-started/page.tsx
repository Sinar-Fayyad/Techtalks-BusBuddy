'use client';

import Link from 'next/link';
import ErrorMessage from '@/components/ErrorMessage';
import styles from './page.module.css';

export default function GetStartedPage() {
  return (
    <main className={styles.chooser}>
      <ErrorMessage message={null} />
      <div className={styles.chooserTop}>
        <div className={styles.brandIcon}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 21s7-6.5 7-11a7 7 0 1 0-14 0c0 4.5 7 11 7 11z" />
            <circle cx="12" cy="10" r="2.2" fill="currentColor" stroke="none" />
          </svg>
        </div>
        <h1 className={styles.title}>Let&apos;s find your role</h1>
        <p className={styles.tagline}>Pick where you fit in, then we&apos;ll get you signed in.</p>
      </div>

      <section className={styles.cards}>
        <Link className={styles.card} href="/driver/register">
          <div className={styles.cardIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="12" r="7" />
              <path d="M8.5 12l3.5 2.5L15 9.5" />
              <circle cx="15.5" cy="14.5" r="1.6" fill="currentColor" stroke="none" />
            </svg>
          </div>
          <h2 className={styles.cardName}>Driver</h2>
          <p className={styles.cardHint}>Pick up students, start/stop trips, share GPS</p>
        </Link>

        <Link className={styles.card} href="/student/home">
          <div className={styles.cardIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="8" r="3" />
              <path d="M3 20a7 7 0 0 1 14 0" />
              <path d="M9 12l3-3 2 2 4-4" />
              <circle cx="15" cy="6" r="2" fill="currentColor" stroke="none" />
            </svg>
          </div>
          <h2 className={styles.cardName}>Student</h2>
          <p className={styles.cardHint}>Join an active trip, watch the live map</p>
        </Link>

        <Link className={styles.card} href="/parent/home">
          <div className={styles.cardIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-6 8-11a8 8 0 1 0-16 0c0 5 8 11 8 11z" />
              <path d="M12 10v6" />
              <path d="M12 8h.01" />
              <circle cx="12" cy="16" r="1.6" fill="currentColor" stroke="none" />
            </svg>
          </div>
          <h2 className={styles.cardName}>Parent</h2>
          <p className={styles.cardHint}>Link your children, track their trips</p>
        </Link>
      </section>

      <div className={styles.nav}>
        <Link href="/login" className={styles.navLink}>Already have an account? Log in</Link>
      </div>
    </main>
  );
}
