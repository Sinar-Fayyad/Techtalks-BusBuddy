'use client';
import { ReactNode } from 'react';
import AppShell, { NavItem } from '@/components/AppShell';

const NAV: NavItem[] = [
  { href: '/admin/home', label: 'Home', icon: 'home' },
  { href: '/admin/drivers', label: 'Drivers', icon: 'bus' },
  { href: '/admin/users', label: 'Users', icon: 'users' },
  { href: '/admin/trips', label: 'Trips', icon: 'calendar' },
  { href: '/admin/issues', label: 'Issues', icon: 'alert' },
];
export default function AdminShell({ children }: { children: ReactNode }) {
  return <AppShell role="admin" nav={NAV}>{children}</AppShell>;
}
