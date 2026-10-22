'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

export type Role = 'admin' | 'driver' | 'student' | 'parent';
const ROLES: Role[] = ['admin', 'driver', 'student', 'parent'];

export const ROLE_HOME: Record<Role, string> = {
  admin: '/admin/home',
  driver: '/driver/home',
  student: '/student/home',
  parent: '/parent/home',
};

type AuthState = {
  token: string | null;
  role: Role | null;
  ready: boolean; // false until we've read storage (avoids a flash of "logged out")
  login: (token: string, role: Role, remember?: boolean) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

// kept for older pages that still import it
export function isLoggedIn(scope: Pick<AuthState, 'token' | 'role'>): boolean {
  return scope.token !== null && scope.role !== null;
}

// "Remember me" ON  -> localStorage (stays after the browser closes)
// "Remember me" OFF -> sessionStorage (gone when the tab/browser closes)
function readStored(): { token: string | null; role: Role | null } {
  for (const store of [localStorage, sessionStorage]) {
    const t = store.getItem('bb_token');
    const r = store.getItem('bb_role');
    if (t && r && ROLES.includes(r as Role)) return { token: t, role: r as Role };
  }
  return { token: null, role: null };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const s = readStored();
    setToken(s.token);
    setRole(s.role);
    setReady(true);
  }, []);

  const clearStores = () => {
    for (const store of [localStorage, sessionStorage]) {
      store.removeItem('bb_token');
      store.removeItem('bb_role');
    }
  };

  const login = (t: string, r: Role, remember = true) => {
    clearStores();
    const store = remember ? localStorage : sessionStorage;
    store.setItem('bb_token', t);
    store.setItem('bb_role', r);
    setToken(t);
    setRole(r);
  };

  const logout = () => {
    clearStores();
    setToken(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ token, role, ready, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

// Page guard: signed out -> /login · wrong role -> that user's own home.
export function useRequireRole(expected: Role) {
  const { token, role, ready, logout } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!ready) return;
    if (!token || !role) router.replace('/login');
    else if (role !== expected) router.replace(ROLE_HOME[role]);
  }, [ready, token, role, expected, router]);
  const allowed = ready && !!token && role === expected;
  return { allowed, token, role, ready, logout };
}
