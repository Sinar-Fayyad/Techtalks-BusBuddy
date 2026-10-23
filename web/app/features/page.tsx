import SiteShell from '@/components/SiteShell';
import Icon from '@/components/ui/Icon';

const FEATURES = [
  { icon: 'ticket', title: 'Book a trip', text: 'Browse trips from verified drivers, pick your stop and book a seat in seconds.' },
  { icon: 'qr', title: 'Scan to board', text: 'Scan the driver’s QR code when you board and again when you get off.' },
  { icon: 'pin', title: 'Live tracking', text: 'Students see the bus coming. Parents see their child only while the ride is on.' },
  { icon: 'shield', title: 'Verified drivers', text: 'Every driver’s license is checked by an admin before they can offer trips.' },
];

export default function FeaturesPage() {
  return (
    <SiteShell active="/features">
      <div style={{ flex: 1, display: 'grid', placeItems: 'center' }}>
        <div style={{ width: '100%', maxWidth: 1000 }}>
          <h1 style={{ fontSize: '2.2rem', textAlign: 'center', margin: '0 0 1.4rem' }}>Features</h1>
          <div className="bb-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            {FEATURES.map((f) => (
              <div key={f.title} className="bb-card">
                <span style={{ color: 'var(--bb-cyan)' }}><Icon name={f.icon} size={28} /></span>
                <h3 style={{ margin: '0.6rem 0 0.3rem' }}>{f.title}</h3>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
