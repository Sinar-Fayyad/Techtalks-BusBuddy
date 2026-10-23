import Link from 'next/link';
import SiteShell from '@/components/SiteShell';

export default function ContactPage() {
  return (
    <SiteShell active="/contact">
      <div style={{ flex: 1, display: 'grid', placeItems: 'center' }}>
        <div className="bb-card" style={{ maxWidth: 620, padding: '2rem', textAlign: 'center' }}>
          <h1 style={{ marginTop: 0, fontSize: '2.2rem' }}>Contact</h1>
          <p style={{ lineHeight: 1.7, fontSize: '1.1rem', color: 'rgba(255,255,255,0.9)' }}>
            BusBuddy is a TechTalks Summer Internship 2026 project, built by the BusBuddy team.
          </p>
          <Link href="/get-started" className="bb-btn">Get Started →</Link>
        </div>
      </div>
    </SiteShell>
  );
}
