import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import NoticeBox from '../components/NoticeBox';
import ApiConfigModal from '../components/ApiConfigModal';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function AuthScreen() {
  const { session, login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [notice, setNotice] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [configModalVisible, setConfigModalVisible] = useState(false);

  useEffect(() => {
    if (session) {
    }
  }, [session]);

  async function handleSubmit() {
    if (!email.trim() || !password) {
      setNotice({ type: 'error', text: 'Заполните все поля' });
      return;
    }
    setNotice(null);
    setLoading(true);
    try {
      if (mode === 'login') await login(email.trim(), password);
      else await register(email.trim(), password);
    } catch (e: any) {
      setNotice({ type: 'error', text: e.message || 'Ошибка' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerPlaceholder} />
          <Text style={styles.title}>FitMind AI</Text>
          <TouchableOpacity onPress={() => setConfigModalVisible(true)} style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={24} color="#17211f" />
          </TouchableOpacity>
        </View>
        <View style={styles.card}>
          <View style={styles.segmented}>
            <TouchableOpacity
              style={[styles.segmentBtn, mode === 'login' && styles.segmentActive]}
              onPress={() => setMode('login')}
            >
              <Text style={[styles.segmentText, mode === 'login' && styles.segmentTextActive]}>Вход</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segmentBtn, mode === 'register' && styles.segmentActive]}
              onPress={() => setMode('register')}
            >
              <Text style={[styles.segmentText, mode === 'register' && styles.segmentTextActive]}>Регистрация</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Пароль"
            placeholderTextColor="#999"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <NoticeBox notice={notice} />
          <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{mode === 'login' ? 'Войти' : 'Создать аккаунт'}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
      <ApiConfigModal
        visible={configModalVisible}
        onClose={() => setConfigModalVisible(false)}
        onSave={() => {
          setNotice({ type: 'success', text: 'Настройки API обновлены' });
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f4f6f4', padding: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  headerPlaceholder: { width: 32 },
  title: { fontSize: 28, fontWeight: '700', color: '#17211f' },
  settingsButton: { padding: 8 },
  card: { width: '100%', maxWidth: 400, backgroundColor: '#fff', borderRadius: 8, padding: 24, borderWidth: 1, borderColor: '#dce5df' },
  segmented: { flexDirection: 'row', backgroundColor: '#e9f3ee', borderRadius: 8, marginBottom: 16 },
  segmentBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  segmentActive: { backgroundColor: '#fff' },
  segmentText: { color: '#66736f', fontWeight: '600' },
  segmentTextActive: { color: '#17211f' },
  input: { borderWidth: 1, borderColor: '#dce5df', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16, color: '#17211f' },
  button: { backgroundColor: '#2f7d68', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 12 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});