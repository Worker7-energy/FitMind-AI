import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function MoreScreen() {
  const navigation = useNavigation<any>();
  const { logout, session } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? '#111816' : '#f4f6f4' }]}>
      <TouchableOpacity 
        style={styles.item} 
        onPress={() => navigation.navigate('Profile')}
      >
        <Ionicons name="person-circle-outline" size={24} color={isDark ? '#edf5f1' : '#17211f'} />
        <View style={styles.itemContent}>
          <Text style={[styles.itemText, { color: isDark ? '#edf5f1' : '#17211f' }]}>Профиль</Text>
          <Text style={[styles.itemEmail, { color: isDark ? '#9cafaa' : '#66736f' }]}>{session?.email}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('Settings')}>
        <Ionicons name="settings-outline" size={24} color={isDark ? '#edf5f1' : '#17211f'} />
        <Text style={[styles.itemText, { color: isDark ? '#edf5f1' : '#17211f' }]}>Настройки</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.item} onPress={logout}>
        <Ionicons name="log-out-outline" size={24} color="#b94a35" />
        <Text style={[styles.itemText, { color: '#b94a35' }]}>Выйти</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  item: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: '#dce5df', 
    gap: 12 
  },
  itemContent: { flex: 1 },
  itemText: { fontSize: 16, fontWeight: '500' },
  itemEmail: { fontSize: 12, marginTop: 2 },
});