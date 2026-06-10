import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import NoticeBox from '../components/NoticeBox';
import ApiConfigModal from '../components/ApiConfigModal';
import OAuthWebView from './OAuthWebView';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function AuthScreen() {
  const { session, login, register } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [notice, setNotice] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [oauthModalVisible, setOauthModalVisible] = useState(false);
  const [oauthProvider, setOauthProvider] = useState<'google' | 'yandex'>('google');

  useEffect(() => {
    if (session) {
      // navigation will handle
    }
  }, [session]);

  async function handleSubmit() {
    if (!email.trim() || !password) {
      setNotice({ type: 'error', text: 'Заполните все поля' });
      return;
    }
    if (password.length < 8) {
      setNotice({ type: 'error', text: 'Пароль должен содержать не менее 8 символов' });
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

  const startOAuth = (provider: 'google' | 'yandex') => {
    setOauthProvider(provider);
    setOauthModalVisible(true);
  };

  const bgColor = isDark ? '#111816' : '#f4f6f4';
  const cardBg = isDark ? '#17211f' : '#fff';
  const textColor = isDark ? '#edf5f1' : '#17211f';
  const inputBorderColor = isDark ? '#2d413b' : '#dce5df';
  const segmentedBg = isDark ? '#1c2926' : '#e9f3ee';

  return (
    <>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={[styles.container, { backgroundColor: bgColor }]}>
          <View style={styles.header}>
            <View style={styles.headerPlaceholder} />
            <Text style={[styles.title, { color: textColor }]}>FitMind AI</Text>
            <TouchableOpacity onPress={() => setConfigModalVisible(true)} style={styles.settingsButton}>
              <Ionicons name="settings-outline" size={24} color={textColor} />
            </TouchableOpacity>
          </View>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: inputBorderColor }]}>
            <View style={[styles.segmented, { backgroundColor: segmentedBg }]}>
              <TouchableOpacity
                style={[styles.segmentBtn, mode === 'login' && styles.segmentActive, mode === 'login' && { backgroundColor: cardBg }]}
                onPress={() => setMode('login')}
              >
                <Text style={[styles.segmentText, mode === 'login' && styles.segmentTextActive, { color: textColor }]}>Вход</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segmentBtn, mode === 'register' && styles.segmentActive, mode === 'register' && { backgroundColor: cardBg }]}
                onPress={() => setMode('register')}
              >
                <Text style={[styles.segmentText, mode === 'register' && styles.segmentTextActive, { color: textColor }]}>Регистрация</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, { borderColor: inputBorderColor, color: textColor, backgroundColor: cardBg }]}
              placeholder="Email"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={[styles.input, { borderColor: inputBorderColor, color: textColor, backgroundColor: cardBg }]}
              placeholder="Пароль"
              placeholderTextColor="#999"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <NoticeBox notice={notice} />
            <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{mode === 'login' ? 'Войти' : 'Создать аккаунт'}</Text>}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: inputBorderColor }]} />
              <Text style={[styles.dividerText, { color: textColor }]}>или</Text>
              <View style={[styles.dividerLine, { backgroundColor: inputBorderColor }]} />
            </View>

            <TouchableOpacity style={[styles.oauthButton, styles.googleButton]} onPress={() => startOAuth('google')}>
              <Ionicons name="logo-google" size={20} color="#fff" />
              <Text style={styles.oauthButtonText}>Войти через Google</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.oauthButton, styles.yandexButton]} onPress={() => startOAuth('yandex')}>
              <Ionicons name="logo-hackernews" size={20} color="#fff" />
              <Text style={styles.oauthButtonText}>Войти через Яндекс</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <ApiConfigModal
        visible={configModalVisible}
        onClose={() => setConfigModalVisible(false)}
        onSave={() => setNotice({ type: 'success', text: 'Настройки API обновлены' })}
      />

      <OAuthWebView
        visible={oauthModalVisible}
        provider={oauthProvider}
        onClose={() => setOauthModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, justifyContent: 'center' },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  headerPlaceholder: { width: 32 },
  title: { fontSize: 28, fontWeight: '700' },
  settingsButton: { padding: 8 },
  card: { width: '100%', maxWidth: 400, borderRadius: 8, padding: 24, borderWidth: 1 },
  segmented: { flexDirection: 'row', borderRadius: 8, marginBottom: 16 },
  segmentBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  segmentActive: { backgroundColor: '#fff' },
  segmentText: { fontWeight: '600' },
  segmentTextActive: { color: '#17211f' },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16 },
  button: { backgroundColor: '#2f7d68', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 12 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { marginHorizontal: 12, fontSize: 14 },
  oauthButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 8, padding: 12, marginBottom: 12, gap: 10 },
  googleButton: { backgroundColor: '#4285F4' },
  yandexButton: { backgroundColor: '#FC3F1D' },
  oauthButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});