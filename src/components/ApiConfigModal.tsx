import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { getCurrentConfig, saveApiConfig } from '../api/apiConfig';
import NoticeBox from './NoticeBox';

interface ApiConfigModalProps {
  visible: boolean;
  onClose: () => void;
  onSave?: () => void;
}

export default function ApiConfigModal({ visible, onClose, onSave }: ApiConfigModalProps) {
  const [authUrl, setAuthUrl] = useState('');
  const [mainUrl, setMainUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (visible) {
      const { authBase, mainBase } = getCurrentConfig();
      setAuthUrl(authBase);
      setMainUrl(mainBase);
      setNotice(null); 
    }
  }, [visible]);

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
    setLoading(true);
    setNotice(null);
    try {
      await saveApiConfig(authUrl, mainUrl);
      setNotice({ type: 'success', text: 'Настройки сохранены' });
      setTimeout(() => {
        onClose();
        if (onSave) onSave();
        setNotice(null);
      }, 100);
    } catch (error) {
      setNotice({ type: 'error', text: 'Не удалось сохранить настройки' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNotice(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Настройки API серверов</Text>
          <View style={styles.field}>
            <Text style={styles.label}>Auth модуль (порт 8080)</Text>
            <TextInput
              style={styles.input}
              value={authUrl}
              onChangeText={setAuthUrl}
              placeholder="http://10.0.2.2:8080"
              placeholderTextColor="#999"
              autoCapitalize="none"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Main модуль (порт 8081)</Text>
            <TextInput
              style={styles.input}
              value={mainUrl}
              onChangeText={setMainUrl}
              placeholder="http://10.0.2.2:8081"
              placeholderTextColor="#999"
              autoCapitalize="none"
            />
          </View>
          {notice && <NoticeBox notice={notice} />}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleClose}>
              <Text style={styles.cancelButtonText}>Отмена</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Сохранить</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
    color: '#17211f',
  },
  field: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#66736f',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#dce5df',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#17211f',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f4f6f4',
    borderWidth: 1,
    borderColor: '#dce5df',
  },
  cancelButtonText: {
    color: '#17211f',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#2f7d68',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});