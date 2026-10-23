import React from 'react';
import { Alert } from 'react-native';
import { Screen, Title, Card, Btn, T } from '../ui';
import { ChangePasswordCard } from '../parts';
import { useApp } from '../ctx';

export default function SettingsScreen() {
  const { token, logout } = useApp();
  return (
    <Screen>
      <Title highlight="Settings" sub="Manage your account" />
      <ChangePasswordCard token={token} />
      <Card>
        <T bold size={16} style={{ marginBottom: 4 }}>Session</T>
        <T dim small style={{ marginBottom: 10 }}>Log out of BusBuddy on this phone.</T>
        <Btn kind="danger" icon="log-out-outline" title="Log out" onPress={() => Alert.alert('Log out', 'Do you want to log out?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Log out', style: 'destructive', onPress: logout }])} />
      </Card>
    </Screen>
  );
}
