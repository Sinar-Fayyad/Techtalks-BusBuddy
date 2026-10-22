'use client';
import { useEffect, useState } from 'react';
import AdminShell from '@/components/AdminShell';
import { useMe } from '@/components/AppShell';
import PageHead from '@/components/ui/PageHead';
import Avatar from '@/components/ui/Avatar';
import Icon from '@/components/ui/Icon';
import { api, errorOf } from '@/lib/client-api';
import { fmtDate } from '@/lib/format';

function UsersContent() {
  const { token } = useMe();
  const [role, setRole] = useState<'student' | 'parent'>('student');
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<any[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('role') === 'parent') setRole('parent');
  }, []);

  useEffect(() => {
    setRows(null);
    const id = setTimeout(async () => {
      const r = await api(token, `/admin/users?role=${role}${q.trim() ? `&q=${encodeURIComponent(q.trim())}` : ''}`);
      if (r.ok) { setRows(r.data.users); setError(''); } else setError(errorOf(r));
    }, 250);
    return () => clearTimeout(id);
  }, [token, role, q]);

  return (
    <>
      <PageHead icon="users" highlight="Users" subtitle="Students and parents on BusBuddy" />
      {error && <div className="bb-alert bb-alert-error" style={{ marginBottom: '1rem' }} role="alert">{error}</div>}
      <div className="bb-row" style={{ marginBottom: '1rem' }}>
        <div className="bb-tabs" role="tablist">
          <button className="bb-tab" role="tab" aria-selected={role === 'student'} onClick={() => setRole('student')}>Students</button>
          <button className="bb-tab" role="tab" aria-selected={role === 'parent'} onClick={() => setRole('parent')}>Parents</button>
        </div>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--bb-cyan)', display: 'flex' }}><Icon name="search" size={19} /></span>
          <input className="bb-input" style={{ borderRadius: 999, paddingLeft: 44 }} placeholder="Search name, email, phone or university…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>
      {rows === null ? <div className="bb-skeleton" /> : rows.length === 0 ? (
        <div className="bb-card bb-empty"><span className="bb-emoji">🔎</span>No {role}s found.</div>
      ) : (
        <div className="bb-table-wrap">
          <table className="bb-table">
            <thead><tr><th>Name</th><th>Phone</th>{role === 'student' && <th>University</th>}<th>{role === 'student' ? 'Linked parents' : 'Children'}</th>{role === 'student' && <th>Bookings</th>}<th>Joined</th></tr></thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id}>
                  <td><div className="bb-row" style={{ gap: 10, flexWrap: 'nowrap' }}><Avatar name={u.name} size={38} /><div><b>{u.name}</b><div className="bb-small bb-muted">{u.email}</div></div></div></td>
                  <td>{u.phone ?? '—'}</td>
                  {role === 'student' && <td>{u.university ?? '—'}</td>}
                  <td>{u.links}</td>
                  {role === 'student' && <td>{u.bookings}</td>}
                  <td className="bb-small bb-muted">{fmtDate(u.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default function AdminUsersPage() {
  return <AdminShell><UsersContent /></AdminShell>;
}
