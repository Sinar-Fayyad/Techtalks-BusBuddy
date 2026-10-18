import Link from 'next/link';
import styles from './page.module.css';

export default function HomePage() {
  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <section className={styles.copy}>
          <div className={styles.brand}>
            <div className={styles.brandIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 21s7-6.5 7-11a7 7 0 1 0-14 0c0 4.5 7 11 7 11z" />
                <circle cx="12" cy="10" r="2.2" fill="currentColor" stroke="none" />
                <circle cx="8.6" cy="14.5" r="1.4" fill="currentColor" stroke="none" />
                <circle cx="15.4" cy="14.5" r="1.4" fill="currentColor" stroke="none" />
              </svg>
            </div>
            <span className={styles.brandName}>
              <span className={styles.brandAccent}>Bus</span>Buddy
            </span>
          </div>

          <h1 className={styles.headline}>
            Safe Rides.
            <br />
            <span className={styles.gradientText}>Connected Families.</span>
          </h1>

          <p className={styles.lead}>
            We connect drivers to students and keep parents informed with real-time location tracking.
          </p>

          <div className={styles.features}>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="12" r="7" />
                  <path d="M8.5 12l3.5 2.5L15 9.5" />
                  <circle cx="15.5" cy="14.5" r="1.6" fill="currentColor" stroke="none" />
                </svg>
              </div>
              <p className={styles.featureName}>Drivers</p>
              <p className={styles.featureHint}>get organized</p>
            </div>

            <div className={styles.feature}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="8" r="3" />
                  <path d="M3 20a7 7 0 0 1 14 0" />
                  <path d="M9 12l3-3 2 2 4-4" />
                  <circle cx="15" cy="6" r="2" fill="currentColor" stroke="none" />
                </svg>
              </div>
              <p className={styles.featureName}>Students</p>
              <p className={styles.featureHint}>travel safely</p>
            </div>

            <div className={styles.feature}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-6 8-11a8 8 0 1 0-16 0c0 5 8 11 8 11z" />
                  <path d="M12 10v6" />
                  <path d="M12 8h.01" />
                  <circle cx="12" cy="16" r="1.6" fill="currentColor" stroke="none" />
                </svg>
              </div>
              <p className={styles.featureName}>Parents</p>
              <p className={styles.featureHint}>track in real-time</p>
            </div>
          </div>

          <div className={styles.actions}>
            <Link className={styles.getStarted} href="/get-started">
              Get Started →
            </Link>
            <p className={styles.loginText}>
              Already have an account?{' '}
              <Link className={styles.loginLink} href="/login">
                Log in
              </Link>
            </p>
          </div>
        </section>

        <section className={styles.art}>
          <img
            src="/busbuddy-illustration.jpg"
            alt="A BusBuddy bus approaching, with its live location shown on a phone"
          />
        </section>
      </div>
    </main>
  );
}