import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import { Screen, Title, Card, Row, T, Btn, Chip, Avatar, CardTitle, Notice, Skeleton } from '../ui';
import { ChangePasswordCard, EditProfileSheet } from '../parts';
import { useLiveChildren } from '../live';
import { useApp } from '../ctx';
import { call, errOf } from '../net';

export default function ParentProfile({ nav }) {
  const { token, me, refreshMe, logout } = useApp();
  const { children, reload } = useLiveChildren(token);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  function unlink(c) {
    Alert.alert('Unlink', `Unlink ${c.name}? You will stop seeing their rides.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Unlink', style: 'destructive', onPress: async () => {
        const r = await call(token, `/parents/me/children/${c.id}`, { method: 'DELETE' });
        if (!r.ok) return setError(errOf(r));
        setNotice(`${c.name} was unlinked.`); reload();
      } },
    ]);
  }
  return (
    <Screen>
      <Title title="My" highlight="Profile" sub="Manage your account and family" />
      {error ? <Notice kind="error">{error}</Notice> : null}
      {notice ? <Notice kind="ok">{notice}</Notice> : null}
      <Card glow>
        <Row gap={14}>
          <Avatar name={me.name} size={70} />
          <View style={{ flex: 1 }}><T bold size={21}>{me.name}</T><Chip label="Parent account" /><T dim small style={{ marginTop: 6 }}>✉️ {me.email}</T><T dim small>📞 {me.phone || '—'}</T></View>
        </Row>
        <View style={{ marginTop: 12 }}><Btn small kind="ghost" icon="pencil" title="Edit profile" onPress={() => setEditing(true)} /></View>
      </Card>
      <Card>
        <CardTitle icon="people-outline" right={<Btn small icon="add" title="Link" onPress={() => nav.push('link')} />}>Connected students</CardTitle>
        {children === null ? <Skeleton /> : children.length === 0 ? <T dim small>No student is linked yet.</T> : children.map((c) => (
          <Row key={c.id} between style={{ marginBottom: 8 }}>
            <Row gap={10} style={{ flex: 1 }}><Avatar name={c.name} size={38} /><View style={{ flex: 1 }}><T bold>{c.name}</T><T dim small>{c.university || 'Student'}</T></View></Row>
            <Btn small kind="danger" icon="trash-outline" title="Unlink" onPress={() => unlink(c)} />
          </Row>
        ))}
      </Card>
      <ChangePasswordCard token={token} />
      <Card>
        <T dim small style={{ marginBottom: 10 }}>You only see a child’s location between the moment they scan in and the moment they scan out.</T>
        <Btn kind="danger" icon="log-out-outline" title="Log out" onPress={() => Alert.alert('Log out', 'Do you want to log out?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Log out', style: 'destructive', onPress: logout }])} />
      </Card>
      {editing ? <EditProfileSheet me={me} token={token} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); setNotice('Profile updated.'); refreshMe(); }} /> : null}
    </Screen>
  );
}
