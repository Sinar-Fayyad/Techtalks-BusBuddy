import Link from 'next/link';
import SiteShell from '@/components/SiteShell';

export default function AboutPage() {
  return (
    <SiteShell active="/about">
      <div style={{ flex: 1, display: 'grid', placeItems: 'center' }}>
        <div className="bb-card" style={{ maxWidth: 760, padding: '2rem' }}>
          <h1 style={{ marginTop: 0, fontSize: '2.2rem' }}>About BusBuddy</h1>
          <p style={{ lineHeight: 1.7, fontSize: '1.1rem', color: 'rgba(255,255,255,0.9)' }}>
            Many university students ride with independent drivers and have no easy way to find one, book a seat or let their family
            know they arrived safely. BusBuddy puts it all in one simple flow: students book a trip, scan a QR code when they board,
            and parents follow the live location only for the duration of the ride.
          </p>
          <Link href="/get-started" className="bb-btn">Get Started →</Link>
        </div>
      </div>
    </SiteShell>
  );
}
