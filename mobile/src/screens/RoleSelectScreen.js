import React from 'react';
import { View, Text, Pressable, SafeAreaView, Platform, StatusBar as RNStatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AuthBg from './AuthBg';
import { Card, Row, T, Btn, C } from '../ui';

const ROLES = [
  { key: 'student', icon: 'school-outline', title: 'Student', blurb: 'Ride to campus and beyond', color: '#3b13b8' },
  { key: 'parent', icon: 'people-outline', title: 'Parent', blurb: 'Keep your loved ones safe', color: '#00e5ff' },
  { key: 'driver', icon: 'bus-outline', title: 'Driver', blurb: 'Drive. Earn. Make a difference', color: '#ff2bd6' },
];

// Role selection screen shown after "Get Started" on the Welcome screen.
// Tapping a role immediately proceeds to sign up for that role.
export default function RoleSelectScreen({ onContinue, onBack }) {
  const top = Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) : 0;

  return (
    <AuthBg>
      <SafeAreaView style={{ flex: 1, paddingTop: top, paddingHorizontal: 22, paddingBottom: 14 }}>
        <Pressable onPress={onBack} style={{ position: 'absolute', top: 8, left: 14, zIndex: 2 }} hitSlop={10}>
          <Ionicons name="chevron-back-circle-outline" size={36} color="#fff" />
        </Pressable>
        <View style={{ alignItems: 'center', marginBottom: 14 }}>
          <View style={{ width: 74, height: 74, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#00e5ff', shadowOpacity: 0.7, shadowRadius: 16, elevation: 8 }}>
            <Ionicons name="bus-outline" size={40} color="#3b13b8" />
          </View>
          <Text style={{ fontSize: 32, fontWeight: '800', marginTop: 6 }}>
            <Text style={{ color: '#3b13b8' }}>Bus</Text><Text style={{ color: '#fff' }}>Buddy</Text>
          </Text>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', marginTop: 2 }}>Safe Rides. Connected Families.</Text>
        </View>
        <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800' }}>Choose Your Role</Text>
        <Text style={{ color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginBottom: 20 }}>Select the role that best describes you</Text>
        <View style={{ gap: 14 }}>
          {ROLES.map((r) => (
            <Pressable
              key={r.key}
              onPress={() => onContinue(r.key)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                padding: 18,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: C.line,
                backgroundColor: 'rgba(255,255,255,0.06)',
              }}
            >
              <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={r.icon} size={26} color={r.color} />
              </View>
              <View style={{ flex: 1 }}>
                <T bold size={17}>{r.title}</T>
                <T small dim>{r.blurb}</T>
              </View>
              <Ionicons name="chevron-forward" size={20} color={C.dim} />
            </Pressable>
          ))}
        </View>
        <Pressable onPress={onBack} style={{ marginTop: 16, alignItems: 'center' }}>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>Back to welcome</Text>
        </Pressable>
      </SafeAreaView>
    </AuthBg>
  );
}