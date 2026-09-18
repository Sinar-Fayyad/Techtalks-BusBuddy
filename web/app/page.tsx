'use client';

import { useRouter } from 'next/navigation';
import Button from '@/components/Button';

export default function HomePage() {
  const router = useRouter();

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        backgroundColor: 'var(--grey)',
      }}
    >
      <section style={{ textAlign: 'center' }}>
        <h1
          style={{
            color: 'var(--navy)',
            fontSize: '2rem',
            marginBottom: '0.75rem',
          }}
        >
          BusBuddy
        </h1>

        <p
          style={{
            color: 'var(--text-muted)',
            marginBottom: '1.5rem',
          }}
        >
          Safe Rides, Connected Families
        </p>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          <Button color="primary" onClick={() => router.push('/login')}>
            Log in
          </Button>

          <Button
            color="success"
            onClick={() => router.push('/driver/register')}
          >
            Driver registration
          </Button>
        </div>
      </section>
    </main>
  );
}