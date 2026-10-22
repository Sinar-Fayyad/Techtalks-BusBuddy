'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './get-started.module.css';
import Icon from '@/components/ui/Icon';
import { useAuth, isLoggedIn, ROLE_HOME } from '@/app/auth-context';

const ROLES = [
  { href: '/student/register', icon: 'building', title: 'Student', text: 'Ride to campus and beyond' },
  { href: '/parent/register', icon: 'users', title: 'Parent', text: 'Keep your loved ones safe' },
  { href: '/driver/register', icon: 'bus', title: 'Driver', text: 'Drive. Earn. Make a difference' },
];

// Clicking a card goes straight to that role's sign-up (no "Continue" button).
export default function GetStartedPage() {
  const { token, role, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && isLoggedIn({ token, role })) router.replace(ROLE_HOME[role!]);
  }, [ready, token, role, router]);

  return (
    <main className={styles.page}>
      <Link href="/" className={styles.back}><Icon name="back" size={18} /> Back</Link>
      <h1>Choose Your Role</h1>
      <p className={styles.sub}>Select the role that best describes you</p>
      <div className={styles.cards}>
        {ROLES.map((r) => (
          <Link key={r.title} href={r.href} className={styles.card}>
            <span className={styles.circle}><Icon name={r.icon} size={38} /></span>
            <b>{r.title}</b>
            <span>{r.text}</span>
          </Link>
        ))}
      </div>
      <p className={styles.login}>
        Already have an account? <Link href="/login">Log in</Link>
      </p>
    </main>
  );
}
