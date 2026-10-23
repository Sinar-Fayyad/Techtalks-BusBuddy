import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Screen, Card, T, Btn, Segmented, C } from '../ui';
import { useApp } from '../ctx';
import { call, errOf } from '../net';
import { fmtTime } from '../format';

// Scan the driver's QR: "Boarding" starts sharing your location with your parents, "Exit" stops it.
export default function StudentScan({ params }) {
  const { token } = useApp();
  const [mode, setMode] = useState(params && params.mode === 'exit' ? 'exit' : 'board');
  const [perm, askPerm] = useCameraPermissions();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null); // { ok, text }

  async function onScan({ data }) {
    if (busy || result) return;
    setBusy(true);
    const r = await call(token, mode === 'board' ? '/trips/board' : '/trips/exit', { method: 'POST', body: { code: String(data) } });
    setBusy(false);
    if (r.ok) {
      setResult({ ok: true, text: mode === 'board' ? `You are on board (${fmtTime(r.data.boarded_at)}). Your parents can now see the live location.` : `You got off at ${fmtTime(r.data.exited_at)}. Location sharing has stopped.` });
    } else {
      const wrongKind = r.status === 400 ? (mode === 'board' ? 'That is not a boarding code. Use the Boarding code.' : 'That is not an exit code. Use the Exit code.') : null;
      setResult({ ok: false, text: wrongKind && r.data.error === 'Invalid or expired code' ? wrongKind : errOf(r) });
    }
  }

  if (!perm) return <Screen><T dim>Checking camera permission…</T></Screen>;
  if (!perm.granted) {
    return (
      <Screen>
        <Card glow style={{ alignItems: 'center', padding: 22 }}>
          <Ionicons name="camera-outline" size={52} color={C.cyan} />
          <T bold size={20} style={{ marginVertical: 8 }}>Camera needed</T>
          <T dim style={{ textAlign: 'center', marginBottom: 14 }}>BusBuddy uses the camera only to scan the driver’s QR code.</T>
          <Btn title="Allow camera" onPress={askPerm} />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={{ color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 12 }}>Scan <Text style={{ color: C.cyan }}>QR</Text></Text>
      <Segmented value={mode} onChange={(m) => { setMode(m); setResult(null); }} items={[{ value: 'board', label: 'Boarding' }, { value: 'exit', label: 'Exit' }]} />
      <View style={{ height: 330, borderRadius: 24, overflow: 'hidden', borderWidth: 2, borderColor: C.cyan, marginBottom: 12 }}>
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={busy || result ? undefined : onScan}
        />
        <View pointerEvents="none" style={{ position: 'absolute', top: 40, left: 40, right: 40, bottom: 40, borderWidth: 3, borderColor: 'rgba(0,229,255,0.9)', borderRadius: 20 }} />
      </View>
      <T bold style={{ textAlign: 'center' }}>{mode === 'board' ? 'Scan the driver’s QR code when you board' : 'Scan the exit QR code when you get off'}</T>
      <T dim small style={{ textAlign: 'center', marginBottom: 12 }}>Make sure it’s the correct bus and driver.</T>
      {busy ? <T dim style={{ textAlign: 'center' }}>Checking…</T> : null}
      {result ? (
        <Card glow style={{ borderColor: result.ok ? C.green : C.pink }}>
          <T bold size={17} color={result.ok ? C.green : '#ff8f8f'}>{result.ok ? 'Done ✓' : 'Could not scan'}</T>
          <T style={{ marginVertical: 6 }}>{result.text}</T>
          <Btn small kind="ghost" title="Scan again" onPress={() => setResult(null)} />
        </Card>
      ) : null}
    </Screen>
  );
}
