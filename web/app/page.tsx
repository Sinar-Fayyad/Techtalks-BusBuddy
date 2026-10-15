'use client';

import Link from 'next/link';
import ErrorMessage from '@/components/ErrorMessage';
import styles from './page.module.css';

export default function HomePage() {
  return (
    <main className={styles.page}>
      <ErrorMessage message={null} />

      <div className={styles.logo}>
        <div className={styles.brandIcon}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 21s7-6.5 7-11a7 7 0 1 0-14 0c0 4.5 7 11 7 11z" />
            <circle cx="12" cy="10" r="2.2" fill="currentColor" stroke="none" />
            <circle cx="8.6" cy="14.5" r="1.4" fill="currentColor" stroke="none" />
            <circle cx="15.4" cy="14.5" r="1.4" fill="currentColor" stroke="none" />
          </svg>
        </div>
        <h1 className={styles.logoText}>
          <span className={styles.logoTextAccent}>Bus</span>Buddy
        </h1>
        <p className={styles.tagline}>Safe Rides. Connected Families.</p>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Sign In</h2>
        <p className={styles.cardSubtitle}>
          Enter your details to access
          <br />
          your student account.
        </p>

        <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
          <div className={styles.field}>
            <div className={styles.fieldInner}>
              <span className={styles.icon} aria-hidden>👤</span>
              <input
                className={styles.input}
                type="text"
                placeholder="Full Name"
                aria-label="Full Name"
              />
            </div>
          </div>

          <div className={styles.field}>
            <div className={styles.fieldInner}>
              <span className={styles.icon} aria-hidden>🏫</span>
              <input
                className={styles.input}
                type="text"
                placeholder="University Name"
                aria-label="University Name"
              />
            </div>
          </div>

          <div className={styles.field}>
            <div className={styles.fieldInner}>
              <span className={styles.icon} aria-hidden>📱</span>
              <input
                className={styles.input}
                type="tel"
                placeholder="Phone Number"
                aria-label="Phone Number"
              />
              <span className={styles.inputHint}>+961 71 234 567</span>
            </div>
          </div>

          <button type="button" className={styles.submit}>
            Sign In →
          </button>
        </form>

        <div className={styles.orDivider}>
          <span className={styles.orLine} />
          <span className={styles.orText}>OR</span>
          <span className={styles.orLine} />
        </div>

        <button type="button" className={styles.secondary}>
          <span className={styles.secondaryIcon}>G</span>
          Continue with Google
        </button>

        <p className={styles.footer}>
          Don&apos;t have an account?{' '}
          <Link href="/student/register" className={styles.footerLink}>
            Sign up
          </Link>
        </p>
      </div>

      <div className={styles.footerNav}>
        <Link href="/get-started" className={styles.getStarted}>
          Get Started →
        </Link>
      </div>
    </main>
  );
}
