import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function HomeScreen({ role, onLogout }) {
  return (
    <View style={s.container}>
      <Text style={s.title}>BusBuddy</Text>
      <Text style={s.msg}>✅ Logged in{role ? ` as ${role}` : ''}.</Text>
      <TouchableOpacity style={s.btn} onPress={onLogout}>
        <Text style={s.btnText}>Log out</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { color: '#fff', fontSize: 32, fontWeight: '700', marginBottom: 12 },
  msg: { color: '#4ade80', fontSize: 16, marginBottom: 24 },
  btn: { backgroundColor: '#ef4444', borderRadius: 24, paddingVertical: 12, paddingHorizontal: 40 },
  btnText: { color: '#fff', fontWeight: '700' },
});
