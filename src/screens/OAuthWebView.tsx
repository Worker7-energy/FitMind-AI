import React, { useState, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { authApi } from '../api/authApi';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface OAuthWebViewProps {
  visible: boolean;
  provider: 'google' | 'yandex';
  onClose: () => void;
}

export default function OAuthWebView({ visible, provider, onClose }: OAuthWebViewProps) {
  const { loginWithToken } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);

  const oAuthUrl = provider === 'google' 
    ? authApi.getGoogleOAuthUrl() 
    : authApi.getYandexOAuthUrl();

  const handleNavigationStateChange = async (navState: any) => {
    const { url } = navState;
    const tokens = authApi.extractTokensFromUrl(url);
    if (tokens.error) {
      onClose();
      return;
    }
    if (tokens.accessToken && tokens.refreshToken) {
      onClose();
      await loginWithToken(tokens.accessToken, tokens.refreshToken, tokens.userId, tokens.email);
    }
  };

  const bgColor = isDark ? '#111816' : '#f4f6f4';
  const textColor = isDark ? '#edf5f1' : '#17211f';
  const borderColor = isDark ? '#2d413b' : '#dce5df';

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <View style={[styles.header, { borderBottomColor: borderColor }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: textColor }]}>
            Вход через {provider === 'google' ? 'Google' : 'Яндекс'}
          </Text>
          <View style={{ width: 40 }} />
        </View>
        {loading && (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#2f7d68" />
          </View>
        )}
        <WebView
          ref={webViewRef}
          source={{ uri: oAuthUrl }}
          onNavigationStateChange={handleNavigationStateChange}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          style={[styles.webview, loading && { height: 0 }]}
          startInLoadingState
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
        />
      </View>
    </Modal>
  );
}

const { height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  closeButton: { padding: 4 },
  title: { fontSize: 18, fontWeight: '600' },
  loader: {
    position: 'absolute',
    top: screenHeight / 2 - 30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  webview: {
    flex: 1,
  },
});