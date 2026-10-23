import React, { useState } from 'react';
import { View } from 'react-native';
import { Screen, Title, Card, Row, T, Btn, Field, Notice, CardTitle, C } from '../ui';
import { useApp } from '../ctx';
import { call, errOf } from '../net';
import { EMAIL_RE } from '../format';
import { Text } from 'react-native';

const STEPS = [
  ['Ask your child for their email', 'It is the email they used to sign up for BusBuddy.'],
  ['Get the link code', 'They open Profile → Link a parent → Create link code. It has 6 digits and lasts 10 minutes.'],
  ['Enter both below', 'Type their email and the 6-digit code, then tap Link Student.'],
];

export default function ParentLink({ nav }) {
  const { token } = useApp();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [done, setDone] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setFormError('');
    const v = {};
    if (!EMAIL_RE.test(email.trim())) v.email = 'Enter your child’s email';
    if (!/^\d{6}$/.test(code)) v.code = 'The code has 6 digits';
    setErrors(v);
    if (Object.keys(v).length) return;
    setBusy(true);
    const r = await call(token, '/parents/me/children', { method: 'POST', body: { email: email.trim(), code } });
    setBusy(false);
    if (!r.ok) return setFormError(r.status === 404 ? 'That email and code do not match, or the code expired. Ask your child for a new code.' : errOf(r));
    setDone((r.data.child && r.data.child.name) || 'Your child');
  }

  return (
    <Screen>
      <Title title="Link Your" highlight="Student" sub="Enter your student’s email and link code" />
      <Card glow>
        {done ? (
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 44 }}>✅</Text>
            <T bold size={20} style={{ marginVertical: 6 }}>{done} is linked</T>
            <T dim style={{ textAlign: 'center', marginBottom: 12 }}>You will see their rides on the map while they are on the bus.</T>
            <Btn title="Go to Children" onPress={() => nav.go('children')} />
          </View>
        ) : (
          <>
            <Field icon="mail-outline" label="Student email" placeholder="student@university.edu" value={email} onChangeText={setEmail} error={errors.email} keyboardType="email-address" />
            <Field icon="link-outline" label="Link code" placeholder="6-digit code" value={code} onChangeText={(v) => setCode(v.replace(/\D/g, ''))} error={errors.code} keyboardType="number-pad" maxLength={6} />
            {formError ? <Notice kind="error">{formError}</Notice> : null}
            <Btn icon="link" title="Link Student" onPress={submit} busy={busy} />
            <T dim small style={{ textAlign: 'center', marginTop: 8 }}>For safety, only the student can create the code.</T>
          </>
        )}
      </Card>
      <Card>
        <CardTitle icon="shield-checkmark-outline">How to link your student</CardTitle>
        {STEPS.map(([t, d], i) => (
          <Row key={i} gap={12} style={{ alignItems: 'flex-start', marginBottom: 10 }}>
            <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: C.cyan, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#04153a', fontWeight: '800' }}>{i + 1}</Text></View>
            <View style={{ flex: 1 }}><T bold>{t}</T><T dim small>{d}</T></View>
          </Row>
        ))}
      </Card>
    </Screen>
  );
}
