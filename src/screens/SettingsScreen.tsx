import React, { useState, useEffect } from 'react';
import { View, Text, Switch, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../auth/AuthContext';
import { getCurrentConfig, saveApiConfig } from '../api/apiConfig';
import NoticeBox from '../components/NoticeBox';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { theme, toggleTheme } = useTheme();
  const { session, logout } = useAuth();

  const isDark = theme === 'dark';
  const [authUrl, setAuthUrl] = useState('');
  const [mainUrl, setMainUrl] = useState('');
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const { authBase, mainBase } = getCurrentConfig();
    setAuthUrl(authBase);
    setMainUrl(mainBase);
  }, []);

  const validateUrl = (url: string): boolean => {
    return url.startsWith('http://') || url.startsWith('https://');
  };

  const handleSave = async () => {
    if (!validateUrl(authUrl)) {
      setNotice({ type: 'error', text: 'Auth URL должен начинаться с http:// или https://' });
      return;
    }
    if (!validateUrl(mainUrl)) {
      setNotice({ type: 'error', text: 'Main URL должен начинаться с http:// или https://' });
      return;
    }
    try {
      await saveApiConfig(authUrl, mainUrl);
      setNotice({ type: 'success', text: 'Настройки сохранены. Для применения изменений необходимо перезайти.' });

      Alert.alert(
        'Требуется перезаход',
        'Для применения новых адресов сервера необходимо выйти из аккаунта и войти снова. Сделать это сейчас?',
        [
          { text: 'Позже', style: 'cancel' },
          {
            text: 'Выйти',
            style: 'destructive',
            onPress: () => logout(),
          },
        ]
      );
    } catch (error) {
      setNotice({ type: 'error', text: 'Не удалось сохранить настройки' });
    }
  };

  const bgColor = isDark ? '#111816' : '#f4f6f4';
  const cardBg = isDark ? '#17211f' : '#fff';
  const textColor = isDark ? '#edf5f1' : '#17211f';
  const mutedColor = isDark ? '#9cafaa' : '#66736f';
  const borderColor = isDark ? '#2d413b' : '#dce5df';

  return (
    <ScrollView style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.header, { color: textColor }]}>Настройки</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Внешний вид</Text>
        <View style={styles.row}>
          <Text style={[styles.label, { color: textColor }]}>Тёмная тема</Text>
          <Switch value={isDark} onValueChange={toggleTheme} trackColor={{ false: '#dce5df', true: '#2f7d68' }} />
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>API серверы</Text>
        <View style={styles.field}>
          <Text style={[styles.label, { color: mutedColor }]}>Auth модуль (порт 8080)</Text>
          <TextInput
            style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]}
            value={authUrl}
            onChangeText={setAuthUrl}
            placeholder="http://10.0.2.2:8080"
            placeholderTextColor={mutedColor}
            autoCapitalize="none"
          />
        </View>
        <View style={styles.field}>
          <Text style={[styles.label, { color: mutedColor }]}>Main модуль (порт 8081)</Text>
          <TextInput
            style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]}
            value={mainUrl}
            onChangeText={setMainUrl}
            placeholder="http://10.0.2.2:8081"
            placeholderTextColor={mutedColor}
            autoCapitalize="none"
          />
        </View>
        <NoticeBox notice={notice} />
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Сохранить</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Аккаунт</Text>
        <Text style={[styles.text, { color: mutedColor }]}>Email: {session?.email}</Text>
      </View>

      <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>О приложении</Text>
        <Text style={[styles.text, { color: mutedColor }]}>FitMind AI v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: { padding: 4 },
  header: { fontSize: 28, fontWeight: '700', textAlign: 'center', flex: 1 },
  placeholder: { width: 32 },
  section: { borderRadius: 8, borderWidth: 1, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 16 },
  field: { marginBottom: 12 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16 },
  saveButton: { backgroundColor: '#2f7d68', borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 8 },
  saveButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  text: { fontSize: 14 },
});