import React, { useEffect } from 'react';
import { View, Text, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useCameraPermissions } from 'expo-camera';
import { Screen, Card, Row, T, Btn, C } from '../ui';

// "Allow Permissions": drivers need location (to share the bus), students need the camera (to scan the QR).
// Parents need nothing and never see this screen. There is no "continue without permissions".
export default function PermissionsScreen({ role, onDone }) {
  const needsLoc = role === 'driver';
  const needsCam = role === 'student';
  const [loc, askLoc] = Location.useForegroundPermissions();
  const [cam, askCam] = useCameraPermissions();

  const locOk = !needsLoc || (loc && loc.granted);
  const camOk = !needsCam || (cam && cam.granted);
  useEffect(() => {
    if (!needsLoc && !needsCam) onDone();
    else if (locOk && camOk && (loc || cam)) onDone();
  }, [locOk, camOk, needsLoc, needsCam, loc, cam, onDone]);

  const blocked = (needsLoc && loc && !loc.granted && loc.canAskAgain === false) || (needsCam && cam && !cam.granted && cam.canAskAgain === false);

  async function allow() {
    if (needsLoc) await askLoc();
    if (needsCam) await askCam();
  }

  return (
    <Screen scroll={false}>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Card glow style={{ padding: 20 }}>
          <View style={{ alignItems: 'center', marginBottom: 14 }}>
            <Ionicons name={needsCam ? 'camera' : 'location'} size={54} color={C.cyan} />
            <Text style={{ color: '#fff', fontSize: 26, fontWeight: '800', marginTop: 8 }}>Allow Permissions</Text>
            <T dim style={{ textAlign: 'center', marginTop: 4 }}>To provide a safe and seamless experience, we need your permission to access:</T>
          </View>
          {needsCam ? (
            <Card style={{ padding: 12 }}>
              <Row gap={12}><Ionicons name="camera-outline" size={28} color={C.cyan} /><View style={{ flex: 1 }}><T bold>Camera</T><T dim small>Required to scan the driver’s QR code when you board and exit.</T></View></Row>
            </Card>
          ) : null}
          {needsLoc ? (
            <Card style={{ padding: 12 }}>
              <Row gap={12}><Ionicons name="location-outline" size={28} color={C.cyan} /><View style={{ flex: 1 }}><T bold>Location</T><T dim small>Required to share your bus live with students and parents during a trip.</T></View></Row>
            </Card>
          ) : null}
          {blocked ? <T small color="#ff8f8f" style={{ marginBottom: 10 }}>Permission is blocked. Open Settings, allow it for BusBuddy, then come back.</T> : null}
          {blocked ? <Btn title="Open Settings" onPress={() => Linking.openSettings()} /> : <Btn title="Allow" onPress={allow} />}
          <T dim small style={{ textAlign: 'center', marginTop: 10 }}>This permission is needed to use BusBuddy as a {role}.</T>
        </Card>
      </View>
    </Screen>
  );
}
