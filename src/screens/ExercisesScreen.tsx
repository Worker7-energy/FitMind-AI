import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, FlatList, StyleSheet,
  Alert, RefreshControl, ActivityIndicator, Modal
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../auth/AuthContext';
import { useCatalog } from '../contexts/CatalogContext';
import { exercisesApi } from '../api/mainApi';
import { Exercise } from '../types';
import NoticeBox from '../components/NoticeBox';
import EmptyState from '../components/EmptyState';
import { useTheme } from '../contexts/ThemeContext';

const muscleGroups = ['Грудь', 'Спина', 'Ноги', 'Плечи', 'Руки', 'Кор', 'Кардио', 'Другое'];

export default function ExercisesScreen() {
  const { session } = useAuth();
  const { exercises, refreshExercises } = useCatalog();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const userId = session?.userId ?? '';

  const [items, setItems] = useState<Exercise[]>([]);
  const [query, setQuery] = useState('');
  const [name, setName] = useState('');
  const [muscle, setMuscle] = useState('Грудь');
  const [notice, setNotice] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const load = useCallback(async (search: string = '') => {
    setLoading(true);
    try {
      const list = search ? await exercisesApi.search(search) : exercises;
      setItems(list);
    } catch (e: any) {
      setNotice({ type: 'error', text: e.message });
    } finally { setLoading(false); }
  }, [exercises]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshExercises();
    await load();
    setRefreshing(false);
  };

  const handleSearch = () => load(query);
  
  const handleAdd = async () => {
    if (!name.trim()) {
      Alert.alert('Ошибка', 'Введите название упражнения');
      return;
    }
    try {
      await exercisesApi.create({
        name: name.trim(),
        muscle_group: muscle,
        is_custom: true,
        created_by_user_id: userId,
      });
      setName('');
      setMuscle('Грудь');
      await refreshExercises();
      await load();
      setNotice({ type: 'success', text: 'Упражнение добавлено' });
    } catch (e: any) {
      setNotice({ type: 'error', text: e.message });
    }
  };

  const bgColor = isDark ? '#111816' : '#f4f6f4';
  const cardBg = isDark ? '#17211f' : '#fff';
  const textColor = isDark ? '#edf5f1' : '#17211f';
  const mutedColor = isDark ? '#9cafaa' : '#66736f';
  const borderColor = isDark ? '#2d413b' : '#dce5df';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: bgColor }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View>
        <Text style={[styles.header, { color: textColor }]}>Упражнения</Text>
        <Text style={[styles.subtitle, { color: mutedColor }]}>Каталог движений для шаблонов тренировок.</Text>
      </View>
      <NoticeBox notice={notice} />

      <View style={styles.searchContainer}>
        <View style={[styles.searchWrapper, { borderColor, backgroundColor: cardBg }]}>
          <Ionicons name="search-outline" size={20} color={mutedColor} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: textColor }]}
            placeholder="Название упражнения"
            placeholderTextColor={mutedColor}
            value={query}
            onChangeText={setQuery}
          />
        </View>
        <TouchableOpacity style={styles.primaryButton} onPress={handleSearch}>
          <Text style={styles.primaryButtonText}>Найти</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Добавить упражнение</Text>
        
        <View style={styles.field}>
          <Text style={[styles.label, { color: mutedColor }]}>Название</Text>
          <TextInput
            style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]}
            placeholder="Например: Румынская тяга"
            placeholderTextColor={mutedColor}
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: mutedColor }]}>Группа мышц</Text>
          <TouchableOpacity
            style={[styles.pickerButton, { borderColor, backgroundColor: cardBg }]}
            onPress={() => setModalVisible(true)}
          >
            <Text style={{ color: textColor }}>{muscle}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={handleAdd}>
          <Text style={styles.primaryButtonText}>Добавить</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2f7d68" style={{ marginTop: 20 }} />
      ) : items.length > 0 ? (
        items.map(item => (
          <View key={item.id} style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: textColor }]}>{item.name}</Text>
              <Text style={[styles.cardDetail, { color: mutedColor }]}>{item.muscle_group}</Text>
              <Text style={[styles.cardNote, { color: mutedColor }]}>{item.is_custom ? 'Пользовательское' : 'Базовое'}</Text>
            </View>
          </View>
        ))
      ) : (
        <EmptyState title="Ничего не найдено" text="Измените запрос или добавьте вручную" />
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBg, borderColor }]}>
            <FlatList
              data={muscleGroups}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, muscle === item && styles.modalItemSelected]}
                  onPress={() => {
                    setMuscle(item);
                    setModalVisible(false);
                  }}
                >
                  <Text style={[styles.modalItemText, { color: textColor }]}>{item}</Text>
                  {muscle === item && <Text style={styles.modalItemCheck}>✓</Text>}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setModalVisible(false)}>
              <Text style={[styles.modalCloseText, { color: mutedColor }]}>Закрыть</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 8 },
  header: { fontSize: 28, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 12 },
  searchContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  searchWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
  },
  input: { flex: 1, borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16 },
  primaryButton: { backgroundColor: '#2f7d68', borderRadius: 8, padding: 12, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  section: { borderWidth: 1, borderRadius: 8, padding: 16, gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  field: { gap: 4 },
  label: { fontSize: 14 },
  pickerButton: { borderWidth: 1, borderRadius: 8, padding: 12, justifyContent: 'center', minHeight: 48 },
  card: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 8, padding: 16, marginBottom: 2 },
  cardTitle: { fontWeight: '600', fontSize: 16 },
  cardDetail: { marginTop: 4 },
  cardNote: { fontSize: 12, marginTop: 4 },
  iconButton: { padding: 4, marginLeft: 8 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxHeight: '70%',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 16,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#dce5df',
  },
  modalItemSelected: {
    backgroundColor: 'rgba(31, 138, 112, 0.1)',
  },
  modalItemText: {
    fontSize: 16,
  },
  modalItemCheck: {
    fontSize: 18,
    color: '#1f8a70',
    fontWeight: 'bold',
  },
  modalCloseButton: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '500',
  },
});