import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Gradient used by the welcome / login / sign-up screens.
export default function AuthBg({ children }) {
  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#1de6f4', '#1e9df7', '#4a4df5', '#8b3ff0', '#c23ff0']}
        locations={[0, 0.2, 0.45, 0.75, 1]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}
