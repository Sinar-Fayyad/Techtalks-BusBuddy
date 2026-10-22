'use client';
import { ReactNode, useEffect } from 'react';
import styles from './Modal.module.css';
import Icon from '@/components/ui/Icon';

export default function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className={styles.backdrop} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`bb-card ${styles.box}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className={styles.head}>
          <h2>{title}</h2>
          <button className={styles.close} onClick={onClose} aria-label="Close">
            <Icon name="x" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
