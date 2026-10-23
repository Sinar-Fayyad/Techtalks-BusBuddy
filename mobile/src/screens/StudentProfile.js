import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Card, Row, T, Btn, Chip, Avatar, CardTitle, Notice, Title, Skeleton, C } from '../ui';
import { EditProfileSheet } from '../parts';
import { useApp } from '../ctx';
import { call, errOf } from '../net';
import { parseUtc } from '../format';

export default function StudentProfile() {
  const { token, me, refreshMe } = useApp();
  const [editing, setEditing] = useState(false);
  const [parents, setParents] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [code, setCode] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);

  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  const left = expiresAt ? Math.max(0, Math.floor((expiresAt - now) / 1000)) : 0;
  const valid = !!code && left > 0;

  async function generate() {
    setBusy(true); setError('');
    const r = await call(token, '/students/me/link-code', { method: 'POST' });
    setBusy(false);
    if (!r.ok) return setError(errOf(r));
    setCode(r.data.code);
    setExpiresAt(parseUtc(r.data.expires_at)?.getTime() || Date.now() + 600000);
    setNow(Date.now());
  }
  const loadParents = useCallback(async () => {
    const r = await call(token, '/students/me/parents');
    if (r.ok) setParents(r.data.parents); else setError(errOf(r));
  }, [token]);
  useEffect(() => { loadParents(); }, [loadParents]);

  function removeParent(p) {
    Alert.alert('Remove parent', `Remove ${p.name}? They will no longer see your location.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        const r = await call(token, `/students/me/parents/${p.id}`, { method: 'DELETE' });
        if (!r.ok) return setError(errOf(r));
        setNotice(`${p.name} was removed.`); loadParents();
      } },
    ]);
  }

  return (
    <Screen>
      <Title title="Pro" highlight="file" sub="Your account and information" />
      {error ? <Notice kind="error">{error}</Notice> : null}
      {notice ? <Notice kind="ok">{notice}</Notice> : null}

      <Card glow>
        <Row gap={14}>
          <Avatar name={me.name} size={72} />
          <View style={{ flex: 1 }}>
            <T bold size={21}>{me.name}</T>
            <Chip label="🎓 Student" />
            <T dim small style={{ marginTop: 6 }}>✉️ {me.email}</T>
            <T dim small>📞 {me.phone || '—'}</T>
            <T dim small>🏛️ {me.university || '—'}</T>
          </View>
        </Row>
        <View style={{ marginTop: 12 }}><Btn small kind="ghost" icon="pencil" title="Edit profile" onPress={() => setEditing(true)} /></View>
      </Card>

      <Card>
        <CardTitle icon="link-outline">Link a parent</CardTitle>
        <T dim small style={{ marginBottom: 10 }}>Create a code and give it to your parent. In their BusBuddy account they enter your email and this code. It works once and expires after 10 minutes.</T>
        {valid ? (
          <View style={{ alignItems: 'center', marginBottom: 10 }}>
            <Row gap={8}>
              {code.split('').map((d, i) => (
                <View key={i} style={{ width: 40, height: 52, borderRadius: 12, borderWidth: 1, borderColor: C.cyan, backgroundColor: 'rgba(0,229,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontSize: 26, fontWeight: '800' }}>{d}</Text>
                </View>
              ))}
            </Row>
            <T dim small style={{ marginTop: 8 }}>Expires in {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')} · email: {me.email}</T>
          </View>
        ) : code ? <Notice>This code expired. Create a new one.</Notice> : null}
        <Btn title={valid ? 'Create a new code' : 'Create link code'} onPress={generate} busy={busy} />
      </Card>

      <Card>
        <CardTitle icon="people-outline">Linked parents</CardTitle>
        {parents === null ? <Skeleton /> : parents.length === 0 ? <T dim small>No parent is linked yet. Parents only see your location while you are on a trip.</T> : parents.map((p) => (
          <Row key={p.id} between style={{ marginBottom: 8 }}>
            <Row gap={10} style={{ flex: 1 }}><Avatar name={p.name} size={38} /><View style={{ flex: 1 }}><T bold>{p.name}</T><T dim small numberOfLines={1}>{p.email}</T></View></Row>
            <Btn small kind="danger" icon="trash-outline" title="Remove" onPress={() => removeParent(p)} />
          </Row>
        ))}
      </Card>
      {editing ? <EditProfileSheet me={me} token={token} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); setNotice('Profile updated.'); refreshMe(); }} /> : null}
    </Screen>
  );
}
