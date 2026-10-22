import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';
import Icon from '@/components/ui/Icon';

const FEATURES = [
  { icon: 'ticket', title: 'Book a trip', text: 'Browse trips from verified drivers, pick your stop and book a seat in seconds.' },
  { icon: 'qr', title: 'Scan to board', text: 'Scan the driver’s QR code when you board and again when you get off.' },
  { icon: 'pin', title: 'Live tracking', text: 'Students see the bus coming. Parents see their child only while the ride is on.' },
  { icon: 'shield', title: 'Verified drivers', text: 'Every driver’s license is checked by an admin before they can offer trips.' },
];

export default function HomePage() {
  return (
    <main className={styles.page}>
      <header className={styles.nav} id="home">
        <Link href="/" className={styles.brand}>
          <span className="bb-logo-badge"><Image src="/busbuddy-logo.png" alt="" width={34} height={34} /></span>
          <span>
            <span className={styles.brandAccent}>Bus</span>Buddy
          </span>
        </Link>
        <nav className={styles.links} aria-label="Main">
          <a href="#home" className={styles.activeLink}>Home</a>
          <a href="#about">About</a>
          <a href="#features">Features</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <div className={styles.inner}>
        <section className={styles.copy}>
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
              <div className={styles.featureIcon}><Icon name="bus" size={26} /></div>
              <p className={styles.featureName}>Drivers</p>
              <p className={styles.featureHint}>get organized</p>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}><Icon name="users" size={26} /></div>
              <p className={styles.featureName}>Students</p>
              <p className={styles.featureHint}>travel safely</p>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}><Icon name="shield" size={26} /></div>
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

      <section className={styles.section} id="about">
        <h2>About BusBuddy</h2>
        <p>
          Many university students ride with independent drivers and have no easy way to find one, book a seat or
          let their family know they arrived safely. BusBuddy puts all of it in one simple flow: students book a trip,
          scan a QR code when they board, and parents follow the live location only for the duration of the ride.
        </p>
      </section>

      <section className={styles.section} id="features">
        <h2>Features</h2>
        <div className={styles.cards}>
          {FEATURES.map((f) => (
            <div key={f.title} className={styles.card}>
              <span className={styles.cardIcon}><Icon name={f.icon} size={24} /></span>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section} id="contact">
        <h2>Contact</h2>
        <p>BusBuddy is a TechTalks Summer Internship 2026 project, built by the BusBuddy team.</p>
        <Link className={styles.getStarted} href="/get-started">Get Started →</Link>
      </section>
    </main>
  );
}
