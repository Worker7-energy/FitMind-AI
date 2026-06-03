import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CheckCircle2, AlertCircle, Sparkles } from 'lucide-react-native';

type Notice = { type: 'success' | 'error' | 'info'; text: string } | null;

export default function NoticeBox({ notice }: { notice: Notice }) {
  if (!notice) return null;
  const Icon = notice.type === 'success' ? CheckCircle2 : notice.type === 'error' ? AlertCircle : Sparkles;
  const color = notice.type === 'success' ? '#2f7d68' : notice.type === 'error' ? '#b94a35' : '#2d5f9a';
  const bg = notice.type === 'success' ? '#e6f4ec' : notice.type === 'error' ? '#fde8e4' : '#e8f0fa';
  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <Icon size={17} color={color} />
      <Text style={[styles.text, { color }]}>{notice.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    gap: 8,
  },
  text: {
    flex: 1,
    fontSize: 14,
  },
});