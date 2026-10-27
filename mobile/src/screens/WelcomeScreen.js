import React from 'react';
import { View, Text, Image, Pressable, SafeAreaView, Platform, StatusBar as RNStatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AuthBg from './AuthBg';

const FEATURES = [
  { icon: 'bus-outline', label: 'Drivers', sub: 'get organized' },
  { icon: 'people-outline', label: 'Students', sub: 'travel safely' },
  { icon: 'shield-checkmark-outline', label: 'Parents', sub: 'track in real time' },
];

// One fixed screen: it always fits the phone (no scrolling). The picture in the middle takes the free space.
export default function WelcomeScreen({ onGetStarted, onLogin }) {
  const top = Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) : 0;
  return (
    <AuthBg>
      <SafeAreaView style={{ flex: 1, paddingTop: top, paddingHorizontal: 22, paddingBottom: 14 }}>
        <View style={{ alignItems: 'center', marginTop: 6 }}>
          <View style={{ width: 74, height: 74, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#00e5ff', shadowOpacity: 0.7, shadowRadius: 16, elevation: 8 }}>
            <Image source={require('../../assets/busbuddy-logo.png')} style={{ width: 54, height: 54 }} resizeMode="contain" />
          </View>
          <Text style={{ fontSize: 36, fontWeight: '800', marginTop: 6 }}>
            <Text style={{ color: '#3b13b8' }}>Bus</Text><Text style={{ color: '#fff' }}>Buddy</Text>
          </Text>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', marginTop: 2 }}>Safe Rides. Connected Families.</Text>
          <Text style={{ color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginTop: 8, fontSize: 14 }}>
            We connect drivers to students and keep parents informed with real-time location tracking.
          </Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 14 }}>
          {FEATURES.map((f) => (
            <View key={f.label} style={{ alignItems: 'center' }}>
              <Ionicons name={f.icon} size={26} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '800', marginTop: 2 }}>{f.label}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11 }}>{f.sub}</Text>
            </View>
          ))}
        </View>

        <View style={{ flex: 1, marginVertical: 14, borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' }}>
          <Image source={require('../../assets/Welcome.png')} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        </View>

        <Pressable onPress={onGetStarted}>
          <LinearGradient colors={['#25f0e0', '#5a4ff0', '#c22ff0']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ borderRadius: 999, paddingVertical: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>Get Started</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </LinearGradient>
        </Pressable>
        <Pressable onPress={onLogin} style={{ marginTop: 12 }}>
          <Text style={{ color: '#fff', textAlign: 'center' }}>Already have an account? <Text style={{ color: '#0b1a6b', fontWeight: '800' }}>Sign in</Text></Text>
        </Pressable>
      </SafeAreaView>
    </AuthBg>
  );
}
