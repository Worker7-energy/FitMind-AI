import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, FlatList, Modal,
  StyleSheet, ActivityIndicator, Alert, RefreshControl
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../auth/AuthContext';
import { useCatalog } from '../contexts/CatalogContext';
import { workoutsApi, exercisesApi } from '../api/mainApi';
import { WorkoutTemplate, WorkoutExercise, WorkoutSession } from '../types';
import NoticeBox from '../components/NoticeBox';
import EmptyState from '../components/EmptyState';
import { useTheme } from '../contexts/ThemeContext';

export default function WorkoutsScreen() {
  const navigation = useNavigation<any>();
  const { session } = useAuth();
  const { exercises, refreshExercises } = useCatalog();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const userId = session?.userId ?? '';

  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [templateExercises, setTemplateExercises] = useState<WorkoutExercise[]>([]);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [templateName, setTemplateName] = useState('');
  const [quickName, setQuickName] = useState('');
  const [quickMuscle, setQuickMuscle] = useState('Грудь');
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<number | null>(null);
  const [sets, setSets] = useState('4');
  const [reps, setReps] = useState('8');
  const [weight, setWeight] = useState('40');
  const [duration, setDuration] = useState('45');
  const [notice, setNotice] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingExercise, setEditingExercise] = useState<WorkoutExercise | null>(null);
  const [editSets, setEditSets] = useState('');
  const [editReps, setEditReps] = useState('');
  const [editWeight, setEditWeight] = useState('');

  const load = useCallback(async () => {
    try {
      const [t, s] = await Promise.all([
        workoutsApi.templates(userId),
        workoutsApi.sessions(userId),
      ]);
      setTemplates(t);
      setSessions(s);
      if (!selectedTemplate && t.length > 0) setSelectedTemplate(t[0].id);
      else if (selectedTemplate && !t.find(tt => tt.id === selectedTemplate)) setSelectedTemplate(t[0]?.id || null);
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message });
    }
  }, [userId, selectedTemplate]);

  useEffect(() => {
    if (selectedTemplate) {
      workoutsApi.templateDetails(selectedTemplate)
        .then(d => setTemplateExercises(d.exercises))
        .catch(() => setTemplateExercises([]));
    } else setTemplateExercises([]);
  }, [selectedTemplate]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([load(), refreshExercises()]);
    setRefreshing(false);
  };

  const handleCreateTemplate = async () => {
    if (!templateName.trim()) return;
    setSaving(true); setNotice(null);
    try {
      const created = await workoutsApi.createTemplate(userId, templateName.trim());
      setTemplateName('');
      setSelectedTemplate(created.id);
      await load();
    } catch (e: any) {
      setNotice({ type: 'error', text: e.message });
    } finally { setSaving(false); }
  };

  const handleAddExercise = async () => {
    if (!selectedTemplate || !selectedExercise) {
      setNotice({ type: 'error', text: 'Выберите шаблон и упражнение' });
      return;
    }
    try {
      await workoutsApi.addExercise({
        template_id: selectedTemplate,
        exercise_id: selectedExercise,
        sets: Number(sets),
        reps: Number(reps),
        weight: Number(weight),
        order_index: templateExercises.length + 1,
      });
      setNotice({ type: 'success', text: 'Упражнение добавлено' });
      await load();
    } catch (e: any) {
      setNotice({ type: 'error', text: e.message });
    }
  };

  const handleQuickExercise = async () => {
    if (!quickName.trim()) return;
    try {
      const ex = await exercisesApi.create({
        name: quickName.trim(),
        muscle_group: quickMuscle.trim(),
        is_custom: true,
        created_by_user_id: userId,
      });
      setQuickName('');
      setSelectedExercise(ex.id);
      await refreshExercises();
      setNotice({ type: 'success', text: 'Упражнение добавлено в справочник' });
    } catch (e: any) {
      setNotice({ type: 'error', text: e.message });
    }
  };

  const handleComplete = async (templateId: number) => {
    try {
      const session = await workoutsApi.startSession(userId, templateId);
      await workoutsApi.completeSession(session.id, Number(duration));
      setNotice({ type: 'success', text: 'Тренировка сохранена в истории' });
      await load();
    } catch (e: any) {
      setNotice({ type: 'error', text: e.message });
    }
  };

  const handleDeleteTemplate = (id: number) => {
    Alert.alert('Удалить тренировку?', 'Это действие нельзя отменить.', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: async () => {
        try {
          await workoutsApi.deleteTemplate(id);
          await load();
          if (selectedTemplate === id) setSelectedTemplate(null);
        } catch (e: any) { setNotice({ type: 'error', text: e.message }); }
      } },
    ]);
  };

  const handleDeleteExercise = async (weId: number) => {
    Alert.alert('Удалить упражнение из тренировки?', '', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: async () => {
        try {
          await workoutsApi.deleteExerciseFromTemplate(weId);
          await load();
        } catch (e: any) { setNotice({ type: 'error', text: e.message }); }
      } },
    ]);
  };

  const openEditModal = (we: WorkoutExercise) => {
    setEditingExercise(we);
    setEditSets(String(we.sets));
    setEditReps(String(we.reps));
    setEditWeight(String(we.weight));
    setEditModalVisible(true);
  };

  const saveEdit = async () => {
    if (!editingExercise) return;
    try {
      await workoutsApi.updateExerciseInTemplate(editingExercise.id, {
        sets: Number(editSets),
        reps: Number(editReps),
        weight: Number(editWeight),
      });
      setEditModalVisible(false);
      await load();
    } catch (e: any) { setNotice({ type: 'error', text: e.message }); }
  };

  const selectedExerciseObj = exercises.find(e => e.id === selectedExercise);

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
      {/* Заголовок, подзаголовок и кнопка калькулятора */}
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <Text style={[styles.header, { color: textColor }]}>Тренировки</Text>
          <Text style={[styles.subtitle, { color: mutedColor }]}>Создавайте шаблоны и сохраняйте завершённые занятия.</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Calculator')} style={styles.calculatorButton}>
          <Ionicons name="calculator-outline" size={24} color={textColor} />
          <Text style={[styles.calculatorText, { color: textColor }]}>Калькулятор</Text>
        </TouchableOpacity>
      </View>
      <NoticeBox notice={notice} />

      {/* Мои тренировки */}
      <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Мои тренировки</Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]}
            placeholder="Название тренировки"
            placeholderTextColor={mutedColor}
            value={templateName}
            onChangeText={setTemplateName}
          />
          <TouchableOpacity style={styles.primaryButton} onPress={handleCreateTemplate} disabled={saving}>
            <Text style={styles.primaryButtonText}>Создать</Text>
          </TouchableOpacity>
        </View>
        {templates.length === 0 ? (
          <EmptyState title="Шаблонов пока нет" text="Создайте первую тренировку" />
        ) : (
          templates.map(item => (
            <View key={item.id} style={[styles.templateRow, { borderBottomColor: borderColor }]}>
              <TouchableOpacity
                style={[styles.templateName, selectedTemplate === item.id && styles.selectedItem]}
                onPress={() => setSelectedTemplate(item.id)}
              >
                <Text style={{ color: textColor }}>{item.name}</Text>
              </TouchableOpacity>
              <View style={styles.templateActions}>
                <TouchableOpacity
                  style={[styles.secondaryButtonSmall, { backgroundColor: cardBg, borderColor }]}
                  onPress={() => handleComplete(item.id)}
                >
                  <Text style={[styles.secondaryButtonText, { color: textColor }]}>Завершить</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteTemplate(item.id)} style={styles.iconButton}>
                  <Ionicons name="trash-outline" size={20} color="#b94a35" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
        <View style={styles.field}>
          <Text style={[styles.label, { color: mutedColor }]}>Длительность: {duration} мин</Text>
          <TextInput
            style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]}
            keyboardType="numeric"
            value={duration}
            onChangeText={setDuration}
          />
        </View>
      </View>

      {/* Состав тренировки */}
      <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Состав тренировки</Text>
        <View style={styles.field}>
          <Text style={[styles.label, { color: mutedColor }]}>Упражнение</Text>
          <TouchableOpacity
            style={[styles.input, { borderColor, justifyContent: 'center', backgroundColor: cardBg }]}
            onPress={() => setShowExercisePicker(true)}
          >
            <Text style={{ color: selectedExerciseObj ? textColor : mutedColor }}>
              {selectedExerciseObj ? selectedExerciseObj.name : 'Нажмите для выбора'}
            </Text>
          </TouchableOpacity>
        </View>
        <Modal visible={showExercisePicker} animationType="slide">
          <View style={{ flex: 1, padding: 16, backgroundColor: cardBg }}>
            <Text style={[styles.modalTitle, { color: textColor }]}>Выберите упражнение</Text>
            <FlatList
              data={exercises}
              keyExtractor={e => e.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, { borderBottomColor: borderColor }]}
                  onPress={() => { setSelectedExercise(item.id); setShowExercisePicker(false); }}
                >
                  <Text style={{ color: textColor }}>{item.name} ({item.muscle_group})</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={[styles.primaryButton, { marginTop: 12 }]}
              onPress={() => setShowExercisePicker(false)}
            >
              <Text style={styles.primaryButtonText}>Закрыть</Text>
            </TouchableOpacity>
          </View>
        </Modal>
        <View style={styles.row}>
          <View style={styles.smallField}>
            <Text style={[styles.label, { color: mutedColor }]}>Подходы</Text>
            <TextInput style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]} keyboardType="numeric" value={sets} onChangeText={setSets} />
          </View>
          <View style={styles.smallField}>
            <Text style={[styles.label, { color: mutedColor }]}>Повторы</Text>
            <TextInput style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]} keyboardType="numeric" value={reps} onChangeText={setReps} />
          </View>
          <View style={styles.smallField}>
            <Text style={[styles.label, { color: mutedColor }]}>Вес, кг</Text>
            <TextInput style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]} keyboardType="numeric" value={weight} onChangeText={setWeight} />
          </View>
        </View>
        <TouchableOpacity style={styles.primaryButton} onPress={handleAddExercise}>
          <Text style={styles.primaryButtonText}>Добавить в тренировку</Text>
        </TouchableOpacity>

        <View style={[styles.subtleForm, { backgroundColor: isDark ? '#1c2926' : '#f8faf8', borderColor }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Добавить упражнение в справочник</Text>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, { flex: 1, borderColor, color: textColor, backgroundColor: cardBg }]}
              placeholder="Название"
              placeholderTextColor={mutedColor}
              value={quickName}
              onChangeText={setQuickName}
            />
            <TextInput
              style={[styles.input, { flex: 1, borderColor, color: textColor, backgroundColor: cardBg }]}
              placeholder="Группа мышц"
              placeholderTextColor={mutedColor}
              value={quickMuscle}
              onChangeText={setQuickMuscle}
            />
          </View>
          <TouchableOpacity style={[styles.secondaryButton, { backgroundColor: cardBg, borderColor }]} onPress={handleQuickExercise}>
            <Text style={[styles.secondaryButtonText, { color: textColor }]}>В справочник</Text>
          </TouchableOpacity>
        </View>

        {templateExercises.length > 0 ? (
          templateExercises.map(item => {
            const ex = exercises.find(e => e.id === item.exercise_id);
            return (
              <View key={item.id} style={[styles.listItem, { borderBottomColor: borderColor }]}>
                <TouchableOpacity onPress={() => openEditModal(item)} style={{ flex: 1 }}>
                  <Text style={[styles.listTitle, { color: textColor }]}>{ex?.name ?? `Упр ${item.exercise_id}`}</Text>
                  <Text style={[styles.listDetail, { color: mutedColor }]}>{item.sets} x {item.reps}, {item.weight} кг</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteExercise(item.id)} style={styles.iconButton}>
                  <Ionicons name="trash-outline" size={20} color="#b94a35" />
                </TouchableOpacity>
              </View>
            );
          })
        ) : (
          <EmptyState title="Состав пуст" text="Добавьте упражнение в выбранную тренировку" />
        )}
      </View>

      {/* История */}
      <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>История тренировок</Text>
        {sessions.length > 0 ? (
          sessions.map(item => (
            <View key={item.id} style={[styles.listItem, { borderBottomColor: borderColor }]}>
              <Text style={[styles.listTitle, { color: textColor }]}>Сессия #{item.id}</Text>
              <Text style={[styles.listDetail, { color: mutedColor }]}>{item.duration_minutes || 0} мин</Text>
            </View>
          ))
        ) : (
          <EmptyState title="Нет записей" text="Завершённые тренировки появятся здесь" />
        )}
      </View>

      {/* Модалка редактирования */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBg, borderColor }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>Редактировать упражнение</Text>
            <TextInput style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]} keyboardType="numeric" placeholder="Подходы" value={editSets} onChangeText={setEditSets} />
            <TextInput style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]} keyboardType="numeric" placeholder="Повторы" value={editReps} onChangeText={setEditReps} />
            <TextInput style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]} keyboardType="numeric" placeholder="Вес, кг" value={editWeight} onChangeText={setEditWeight} />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}><Text style={{ color: mutedColor }}>Отмена</Text></TouchableOpacity>
              <TouchableOpacity onPress={saveEdit}><Text style={{ fontWeight: 'bold', color: '#2f7d68' }}>Сохранить</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 16 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  header: { fontSize: 28, fontWeight: '700' },
  subtitle: { fontSize: 14, marginTop: 2 },
  calculatorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(47, 125, 104, 0.1)',
  },
  calculatorText: {
    fontSize: 14,
    fontWeight: '500',
  },
  section: { borderWidth: 1, borderRadius: 8, padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 8 },
  input: { flex: 1, borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 15 },
  label: { fontSize: 14, marginBottom: 4 },
  smallField: { flex: 1 },
  primaryButton: { backgroundColor: '#2f7d68', borderRadius: 8, padding: 12, alignItems: 'center', marginVertical: 4 },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  secondaryButton: { borderWidth: 1, borderRadius: 8, padding: 10, alignItems: 'center' },
  secondaryButtonText: { fontWeight: '600' },
  secondaryButtonSmall: { paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderRadius: 6 },
  templateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  templateName: { flex: 1, paddingVertical: 4 },
  templateActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  selectedItem: { fontWeight: 'bold', color: '#2f7d68' },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  listTitle: { fontWeight: '600', flexShrink: 1 },
  listDetail: { fontSize: 14 },
  subtleForm: { borderWidth: 1, borderRadius: 8, padding: 12, marginTop: 12 },
  field: { marginBottom: 10 },
  iconButton: { padding: 4 },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
  modalContent: { borderWidth: 1, borderRadius: 12, padding: 20, gap: 12 },
  modalTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  modalItem: { paddingVertical: 12, borderBottomWidth: 1 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
});