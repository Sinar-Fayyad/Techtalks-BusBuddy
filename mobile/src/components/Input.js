import React from 'react';
import { TextInput, StyleSheet } from 'react-native';

export default function Input({
  value,
  onChangeText,
  placeholder,
  placeholderTextColor,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  style,
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={placeholderTextColor}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      style={[styles.base, style]}
      multiline={false}
    />
  );

}

// Layout-only base — screen styles win via array merge order
const styles = StyleSheet.create({
  base: {},
});