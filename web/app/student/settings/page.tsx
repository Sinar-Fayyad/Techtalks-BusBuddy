'use client';
import { useRouter } from 'next/navigation';
import StudentShell from '@/components/StudentShell';
import { useMe } from '@/components/AppShell';
import ChangePasswordCard from '@/components/ChangePasswordCard';
import Icon from '@/components/ui/Icon';
import { useAuth } from '@/app/auth-context';

function SettingsContent() {
  const { token } = useMe();
  const { logout } = useAuth();
  const router = useRouter();
  return (
    <>
      <div className="bb-page-head">
        <span className="bb-page-icon"><Icon name="settings" size={26} /></span>
        <div>
          <h1>Sett<em>ings</em></h1>
          <p>Manage your account</p>
        </div>
      </div>
      <div className="bb-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', alignItems: 'start' }}>
        <ChangePasswordCard token={token} />
        <section className="bb-card">
          <h2 className="bb-card-title"><Icon name="logout" /> Session</h2>
          <p className="bb-muted bb-small" style={{ marginTop: 0 }}>Log out of BusBuddy on this device.</p>
          <button className="bb-btn bb-btn-danger" onClick={() => { logout(); router.replace('/login'); }}>
            <Icon name="logout" size={17} /> Log out
          </button>
        </section>
      </div>
    </>
  );
}

export default function StudentSettingsPage() {
  return (
    <StudentShell>
      <SettingsContent />
    </StudentShell>
  );
}
