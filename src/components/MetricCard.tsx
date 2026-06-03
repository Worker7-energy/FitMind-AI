import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export default function MetricCard({ title, value, caption }: { title: string; value: string; caption: string }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const cardBg = isDark ? '#17211f' : '#fff';
  const textColor = isDark ? '#edf5f1' : '#17211f';
  const mutedColor = isDark ? '#9cafaa' : '#66736f';
  const borderColor = isDark ? '#2d413b' : '#dce5df';

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
      <Text style={[styles.title, { color: mutedColor }]}>{title}</Text>
      <Text style={[styles.value, { color: textColor }]}>{value}</Text>
      <Text style={[styles.caption, { color: mutedColor }]}>{caption}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    flex: 1,
  },
  title: { fontSize: 12, marginBottom: 2 },
  value: { fontSize: 18, fontWeight: '700' },
  caption: { fontSize: 10, marginTop: 2 },
});