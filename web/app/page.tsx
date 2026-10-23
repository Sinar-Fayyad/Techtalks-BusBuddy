import Link from 'next/link';
import styles from './page.module.css';
import SiteShell from '@/components/SiteShell';
import Icon from '@/components/ui/Icon';

// The landing page is ONE screen (no scrolling sections). About / Features / Contact are their own pages.
export default function HomePage() {
  return (
    <SiteShell active="/">
      <div className={styles.inner}>
        <section className={styles.copy}>
          <h1 className={styles.headline}>
            Safe Rides.
            <br />
            <span className={styles.gradientText}>Connected Families.</span>
          </h1>
          <p className={styles.lead}>We connect drivers to students and keep parents informed with real-time location tracking.</p>
          <div className={styles.features}>
            <div className={styles.feature}><div className={styles.featureIcon}><Icon name="bus" size={26} /></div><p className={styles.featureName}>Drivers</p><p className={styles.featureHint}>get organized</p></div>
            <div className={styles.feature}><div className={styles.featureIcon}><Icon name="users" size={26} /></div><p className={styles.featureName}>Students</p><p className={styles.featureHint}>travel safely</p></div>
            <div className={styles.feature}><div className={styles.featureIcon}><Icon name="shield" size={26} /></div><p className={styles.featureName}>Parents</p><p className={styles.featureHint}>track in real-time</p></div>
          </div>
          <div className={styles.actions}>
            <Link className={styles.getStarted} href="/get-started">Get Started →</Link>
            <p className={styles.loginText}>Already have an account? <Link className={styles.loginLink} href="/login">Log in</Link></p>
          </div>
        </section>
        <section className={styles.art}>
          <img src="/busbuddy-illustration.jpg" alt="A BusBuddy bus approaching, with its live location shown on a phone" />
        </section>
      </div>
    </SiteShell>
  );
}
