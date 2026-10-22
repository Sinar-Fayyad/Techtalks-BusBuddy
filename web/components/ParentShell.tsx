'use client';
import { ReactNode } from 'react';
import AppShell, { NavItem } from '@/components/AppShell';

const NAV: NavItem[] = [
  { href: '/parent/home', label: 'Home', icon: 'home' },
  { href: '/parent/children', label: 'Children', icon: 'users' },
  { href: '/parent/map', label: 'Live Map', icon: 'pin' },
  { href: '/parent/profile', label: 'Profile', icon: 'user' },
];
export default function ParentShell({ children }: { children: ReactNode }) {
  return <AppShell role="parent" nav={NAV}>{children}</AppShell>;
}
