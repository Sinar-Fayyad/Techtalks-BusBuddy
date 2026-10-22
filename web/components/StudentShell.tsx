'use client';
import { ReactNode } from 'react';
import AppShell, { NavItem } from '@/components/AppShell';

// Scan is mobile-only (the phone camera), so the web student menu has no Scan entry.
const NAV: NavItem[] = [
  { href: '/student/home', label: 'Home', icon: 'home' },
  { href: '/student/bookings', label: 'Bookings', icon: 'bus' },
  { href: '/student/settings', label: 'Settings', icon: 'settings' },
  { href: '/student/profile', label: 'Profile', icon: 'user' },
];

export default function StudentShell({ children }: { children: ReactNode }) {
  return <AppShell role="student" nav={NAV}>{children}</AppShell>;
}
