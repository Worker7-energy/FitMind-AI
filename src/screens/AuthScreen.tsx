import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { authApi } from '../api/authApi';
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

  const [verificationVisible, setVerificationVisible] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingPassword, setPendingPassword] = useState('');
  const [verificationNotice, setVerificationNotice] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [sendingCode, setSendingCode] = useState(false);

  useEffect(() => {
    if (session) {
    }
  }, [session]);

  useEffect(() => {
    if (configModalVisible) {
      setNotice(null);
    }
  }, [configModalVisible]);

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

    if (mode === 'login') {
      setLoading(true);
      try {
        await login(email.trim(), password);
      } catch (e: any) {
        setNotice({ type: 'error', text: e.message || 'Ошибка' });
      } finally {
        setLoading(false);
      }
    } else {
      setPendingEmail(email.trim());
      setPendingPassword(password);
      setVerificationNotice(null);
      setSendingCode(true);
      try {
        await authApi.sendVerification(email.trim());
        setVerificationVisible(true);
      } catch (e: any) {
        setNotice({ type: 'error', text: e.message || 'Не удалось отправить код' });
      } finally {
        setSendingCode(false);
      }
    }
  }

  async function handleVerify() {
    if (!verificationCode.trim()) {
      setVerificationNotice({ type: 'error', text: 'Введите полученный код' });
      return;
    }
    setVerificationNotice(null);
    setLoading(true);
    try {
      await authApi.verifyEmail(pendingEmail, verificationCode.trim());
      await register(pendingEmail, pendingPassword);
      setVerificationVisible(false);
    } catch (e: any) {
      setVerificationNotice({ type: 'error', text: e.message || 'Неверный код или истек срок действия' });
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
  const modalBg = isDark ? '#17211f' : '#fff';
  const modalBorder = isDark ? '#2d413b' : '#dce5df';

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
            <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading || sendingCode}>
              {loading || sendingCode ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{mode === 'login' ? 'Войти' : 'Создать аккаунт'}</Text>}
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


      <Modal
        visible={verificationVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setVerificationVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContainer, { backgroundColor: modalBg, borderColor: modalBorder }]}>
            <View style={styles.modalIconCircle}>
              <Ionicons name="mail-outline" size={40} color="#2f7d68" />
            </View>
            <Text style={[styles.modalTitle, { color: textColor }]}>Подтверждение email</Text>
            <Text style={[styles.modalEmail, { color: textColor, opacity: 0.7 }]}>{pendingEmail}</Text>
            <View style={styles.modalHintContainer}>
              <Ionicons name="information-circle-outline" size={16} color={textColor} opacity={0.6} />
              <Text style={[styles.modalHint, { color: textColor, opacity: 0.7 }]}>Введите 6-значный код из письма</Text>
            </View>
            <TextInput
              style={[styles.modalInput, { borderColor: inputBorderColor, color: textColor, backgroundColor: cardBg }]}
              placeholder="000000"
              placeholderTextColor="#999"
              keyboardType="number-pad"
              maxLength={6}
              value={verificationCode}
              onChangeText={setVerificationCode}
              autoFocus
            />
            <NoticeBox notice={verificationNotice} />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalCancel, { borderColor: inputBorderColor }]} onPress={() => setVerificationVisible(false)}>
                <Text style={[styles.modalCancelText, { color: textColor }]}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleVerify} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.modalConfirmText}>Подтвердить</Text>}
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.resendButton}
              onPress={async () => {
                setVerificationNotice(null);
                try {
                  await authApi.sendVerification(pendingEmail);
                  setVerificationNotice({ type: 'success', text: 'Новый код отправлен!' });
                } catch (e: any) {
                  setVerificationNotice({ type: 'error', text: e.message || 'Не удалось отправить код' });
                }
              }}
            >
              <Text style={[styles.resendText, { color: '#2f7d68' }]}>Отправить код повторно</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContainer: { width: '85%', borderRadius: 24, padding: 24, borderWidth: 1, alignItems: 'center', gap: 12 },
  modalIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(47, 125, 104, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  modalEmail: { fontSize: 14, textAlign: 'center' },
  modalHintContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  modalHint: { fontSize: 13, textAlign: 'center' },
  modalInput: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 18, textAlign: 'center', width: '100%', letterSpacing: 4 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 8, width: '100%' },
  modalCancel: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  modalCancelText: { fontWeight: '500', fontSize: 15 },
  modalConfirm: { flex: 1, backgroundColor: '#2f7d68', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  modalConfirmText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  resendButton: { marginTop: 8, paddingVertical: 6 },
  resendText: { fontSize: 13, fontWeight: '500', textDecorationLine: 'underline' },
});