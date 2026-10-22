import { initials } from '@/lib/format';

// No photos in this app: a gradient circle with the person's initials.
export default function Avatar({ name, size = 44 }: { name: string | null | undefined; size?: number }) {
  return (
    <span
      aria-label={name ?? 'user'}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'inline-grid',
        placeItems: 'center',
        flex: 'none',
        fontWeight: 800,
        fontSize: Math.round(size * 0.38),
        color: '#fff',
        background: 'linear-gradient(135deg, #00a3ff, #7a2cff 60%, #ff2bd6)',
        border: '2px solid rgba(0,229,255,0.6)',
        boxShadow: '0 0 14px rgba(0,229,255,0.3)',
      }}
    >
      {initials(name)}
    </span>
  );
}
