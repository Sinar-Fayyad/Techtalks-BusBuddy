'use client';
import { ReactNode } from 'react';
import AppShell, { NavItem } from '@/components/AppShell';

const NAV: NavItem[] = [
  { href: '/driver/home', label: 'Home', icon: 'home' },
  { href: '/driver/trips', label: 'Trips', icon: 'bus' },
  { href: '/driver/students', label: 'Students', icon: 'users' },
  { href: '/driver/profile', label: 'Profile', icon: 'user' },
];
export default function DriverShell({ children }: { children: ReactNode }) {
  return <AppShell role="driver" nav={NAV}>{children}</AppShell>;
}
