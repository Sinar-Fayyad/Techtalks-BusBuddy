import { ReactNode } from 'react';
import Link from 'next/link';
import styles from './AuthShell.module.css';
import Icon from '@/components/ui/Icon';

// Full-page background (the logo is part of the picture, top-left) + glass card in the middle.
export default function AuthShell({
  children,
  badge,
  badgeIcon,
  wide,
  backHref = '/',
}: {
  children: ReactNode;
  badge?: string; // "Student" / "Parent" / "Driver"
  badgeIcon?: string;
  wide?: boolean;
  backHref?: string | null;
}) {
  return (
    <main className={`bb-auth-bg ${styles.page}`}>
      {backHref && (
        <Link href={backHref} className={styles.back}>
          <Icon name="back" size={18} /> Back
        </Link>
      )}
      <div className={styles.center}>
        {badge && (
          <div className={styles.badge}>
            <span className={styles.rule} />
            <span className={styles.badgeText}>
              {badgeIcon && <Icon name={badgeIcon} size={20} />} {badge}
            </span>
            <span className={styles.rule} />
          </div>
        )}
        <div className={`${styles.card} ${wide ? styles.wide : ''}`}>{children}</div>
      </div>
    </main>
  );
}
