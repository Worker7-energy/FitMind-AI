import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export default function EmptyState({ title, text }: { title: string; text: string }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const bgColor = isDark ? '#1c2926' : '#f8faf8';
  const borderColor = isDark ? '#2d413b' : '#dce5df';
  const titleColor = isDark ? '#edf5f1' : '#17211f';
  const textColor = isDark ? '#9cafaa' : '#66736f';

  return (
    <View style={[styles.container, { backgroundColor: bgColor, borderColor }]}>
      <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
      <Text style={[styles.text, { color: textColor }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 150,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
    marginVertical: 12,
  },
  title: { fontWeight: '600', marginBottom: 4 },
  text: { textAlign: 'center' },
});