'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

// T13 dry-run fix: student/parent were restored as null after a refresh
// (silent "Access denied" on /student/home) — all four roles now round-trip.
type Role = 'admin' | 'driver' | 'student' | 'parent';

interface AuthState {
  token: string | null;
  role: Role | null;
  ready: boolean;
  login: (token: string, role: Role) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [ready, setReady] = useState(false);

  // Runs once, in the browser only: restore the session after a refresh
  useEffect(() => {
    const savedToken = localStorage.getItem('bb_token');
    const savedRole = localStorage.getItem('bb_role');
    if (savedToken) setToken(savedToken);
    if (savedRole === 'admin' || savedRole === 'driver' || savedRole === 'student' || savedRole === 'parent') {
      setRole(savedRole);
    }
    setReady(true);
  }, []);

  const login = (newToken: string, newRole: Role) => {
    localStorage.setItem('bb_token', newToken);
    localStorage.setItem('bb_role', newRole);
    setToken(newToken);
    setRole(newRole);
  };

  const logout = () => {
    localStorage.removeItem('bb_token');
    localStorage.removeItem('bb_role');
    setToken(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ token, role, ready, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
