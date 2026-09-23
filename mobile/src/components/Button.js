import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';

export default function Button({
  label,
  onPress,
  loading = false,
  disabled = false,
  style,
  textStyle,
  activityIndicatorColor = '#fff',
}) {
  return (
    <TouchableOpacity
      style={[styles.base, style]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading
        ? <ActivityIndicator color={activityIndicatorColor} />
        : <Text style={[styles.baseText, textStyle]}>{label}</Text>}
    </TouchableOpacity>
  );
}

// Layout-only base — screens keep full control of the look (zero-visual-change rule)
const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  baseText: { textAlign: 'center' },
});
