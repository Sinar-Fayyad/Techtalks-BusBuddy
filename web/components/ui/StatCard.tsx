import Icon from '@/components/ui/Icon';

const TONES: Record<string, string> = {
  cyan: 'var(--bb-cyan)', green: 'var(--bb-green)', amber: 'var(--bb-amber)', pink: 'var(--bb-pink)', violet: '#b08cff',
};

export default function StatCard({
  icon, value, label, tone = 'cyan', onClick,
}: { icon: string; value: number | string; label: string; tone?: keyof typeof TONES | string; onClick?: () => void }) {
  const color = TONES[tone] ?? TONES.cyan;
  const Tag: any = onClick ? 'button' : 'div';
  return (
    <Tag
      className="bb-card"
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', color: '#fff', cursor: onClick ? 'pointer' : 'default', width: '100%', font: 'inherit' }}
    >
      <span style={{ width: 48, height: 48, borderRadius: '50%', display: 'grid', placeItems: 'center', flex: 'none', color, background: 'rgba(255,255,255,0.08)', border: `1px solid ${color}` }}>
        <Icon name={icon} size={22} />
      </span>
      <span>
        <span style={{ display: 'block', fontSize: '1.7rem', fontWeight: 800, lineHeight: 1.1 }}>{value}</span>
        <span className="bb-small bb-muted">{label}</span>
      </span>
    </Tag>
  );
}
