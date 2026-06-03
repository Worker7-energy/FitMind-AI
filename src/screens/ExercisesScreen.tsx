import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, FlatList, StyleSheet, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../auth/AuthContext';
import { useCatalog } from '../contexts/CatalogContext';
import { exercisesApi } from '../api/mainApi';
import { Exercise } from '../types';
import NoticeBox from '../components/NoticeBox';
import EmptyState from '../components/EmptyState';
import { useTheme } from '../contexts/ThemeContext';

export default function ExercisesScreen() {
  const { session } = useAuth();
  const { exercises, refreshExercises } = useCatalog();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const userId = session?.userId ?? '';
  const [items, setItems] = useState<Exercise[]>([]);
  const [query, setQuery] = useState('');
  const [name, setName] = useState('');
  const [muscle, setMuscle] = useState('');
  const [notice, setNotice] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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
    if (!name.trim() || !muscle.trim()) return;
    try {
      await exercisesApi.create({
        name: name.trim(),
        muscle_group: muscle.trim(),
        is_custom: true,
        created_by_user_id: userId,
      });
      setName(''); setMuscle('');
      await refreshExercises();
      await load();
      setNotice({ type: 'success', text: 'Упражнение добавлено' });
    } catch (e: any) {
      setNotice({ type: 'error', text: e.message });
    }
  };

  const handleDelete = async (id: number) => {
    Alert.alert('Удалить упражнение?', 'Это действие нельзя отменить.', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: async () => {
        try {
          await exercisesApi.delete(id);
          await refreshExercises();
          await load();
        } catch (e: any) { setNotice({ type: 'error', text: e.message }); }
      } },
    ]);
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
        <Text style={[styles.subtitle, { color: mutedColor }]}>Справочник движений для ваших тренировок.</Text>
      </View>
      <NoticeBox notice={notice} />
      <View style={styles.row}>
        <TextInput
          style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]}
          placeholder="Название упражнения"
          placeholderTextColor={mutedColor}
          value={query}
          onChangeText={setQuery}
        />
        <TouchableOpacity style={styles.primaryButton} onPress={handleSearch}>
          <Text style={styles.primaryButtonText}>Найти</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Добавить упражнение</Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, { flex: 1, borderColor, color: textColor, backgroundColor: cardBg }]}
            placeholder="Название"
            placeholderTextColor={mutedColor}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={[styles.input, { flex: 1, borderColor, color: textColor, backgroundColor: cardBg }]}
            placeholder="Группа мышц"
            placeholderTextColor={mutedColor}
            value={muscle}
            onChangeText={setMuscle}
          />
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
            {item.is_custom && (
              <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.iconButton}>
                <Ionicons name="trash-outline" size={20} color="#b94a35" />
              </TouchableOpacity>
            )}
          </View>
        ))
      ) : (
        <EmptyState title="Ничего не найдено" text="Измените запрос или добавьте вручную" />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 16 },
  header: { fontSize: 28, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 12 },
  row: { flexDirection: 'row', gap: 8 },
  input: { flex: 1, borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 15 },
  primaryButton: { backgroundColor: '#2f7d68', borderRadius: 8, padding: 12, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: '#fff', fontWeight: '700' },
  section: { borderWidth: 1, borderRadius: 8, padding: 16, gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  card: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 8, padding: 16, marginBottom: 8 },
  cardTitle: { fontWeight: '600', fontSize: 16 },
  cardDetail: { marginTop: 4 },
  cardNote: { fontSize: 12, marginTop: 4 },
  iconButton: { padding: 4, marginLeft: 8 },
});