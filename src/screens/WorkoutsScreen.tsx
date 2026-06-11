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

type PlannedDurations = Record<number, string>;

const muscleGroups = ['Грудь', 'Спина', 'Ноги', 'Плечи', 'Руки', 'Кор', 'Кардио', 'Другое'];

export default function WorkoutsScreen() {
  const navigation = useNavigation<any>();
  const { session } = useAuth();
  const { exercises, refreshExercises } = useCatalog();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const userId = session?.userId ?? '';

  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [expandedTemplateId, setExpandedTemplateId] = useState<number | null>(null);
  const [plannedDurations, setPlannedDurations] = useState<PlannedDurations>({});
  const [exercisesByTemplate, setExercisesByTemplate] = useState<Record<number, WorkoutExercise[]>>({});
  const [loadingExercises, setLoadingExercises] = useState<Record<number, boolean>>({});
  
  const [addingForTemplateId, setAddingForTemplateId] = useState<number | null>(null);
  const [selectedExerciseId, setSelectedExerciseId] = useState<number | null>(null);
  const [addSets, setAddSets] = useState('4');
  const [addReps, setAddReps] = useState('8');
  const [addWeight, setAddWeight] = useState('40');
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingExercise, setEditingExercise] = useState<WorkoutExercise | null>(null);
  const [editSets, setEditSets] = useState('');
  const [editReps, setEditReps] = useState('');
  const [editWeight, setEditWeight] = useState('');
  
  const [quickName, setQuickName] = useState('');
  const [quickMuscle, setQuickMuscle] = useState('Грудь');
  const [quickMuscleModalVisible, setQuickMuscleModalVisible] = useState(false);
  const [isQuickSaving, setIsQuickSaving] = useState(false);
  
  const [templateName, setTemplateName] = useState('');
  const [notice, setNotice] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const loadTemplatesAndSessions = useCallback(async () => {
    try {
      const [t, s] = await Promise.all([
        workoutsApi.templates(userId),
        workoutsApi.sessions(userId),
      ]);
      setTemplates(t);
      setSessions(s);
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message });
    }
  }, [userId]);

  const loadExercisesForTemplate = useCallback(async (templateId: number) => {
    setLoadingExercises(prev => ({ ...prev, [templateId]: true }));
    try {
      const details = await workoutsApi.templateDetails(templateId);
      setExercisesByTemplate(prev => ({ ...prev, [templateId]: details.exercises }));
      setPlannedDurations(prev => {
        if (prev[templateId] === undefined) return { ...prev, [templateId]: '45' };
        return prev;
      });
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message });
    } finally {
      setLoadingExercises(prev => ({ ...prev, [templateId]: false }));
    }
  }, []);

  useEffect(() => {
    if (expandedTemplateId !== null && !exercisesByTemplate[expandedTemplateId]) {
      loadExercisesForTemplate(expandedTemplateId);
    }
  }, [expandedTemplateId, exercisesByTemplate, loadExercisesForTemplate]);

  useFocusEffect(useCallback(() => { loadTemplatesAndSessions(); }, [loadTemplatesAndSessions]));

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadTemplatesAndSessions(), refreshExercises()]);
    setRefreshing(false);
  };

  const handleCreateTemplate = async () => {
    if (!templateName.trim()) return;
    setSaving(true); setNotice(null);
    try {
      const created = await workoutsApi.createTemplate(userId, templateName.trim());
      setTemplateName('');
      setTemplates(prev => [...prev, created]);
      setExpandedTemplateId(created.id);
      setPlannedDurations(prev => ({ ...prev, [created.id]: '45' }));
    } catch (e: any) {
      setNotice({ type: 'error', text: e.message });
    } finally { setSaving(false); }
  };

  const handleQuickExercise = async () => {
    if (!quickName.trim()) {
      Alert.alert('Ошибка', 'Введите название упражнения');
      return;
    }
    setIsQuickSaving(true);
    try {
      await exercisesApi.create({
        name: quickName.trim(),
        muscle_group: quickMuscle,
        is_custom: true,
        created_by_user_id: userId,
      });
      setQuickName('');
      setQuickMuscle('Грудь');
      await refreshExercises();
      setNotice({ type: 'success', text: 'Упражнение добавлено в справочник' });
    } catch (e: any) {
      setNotice({ type: 'error', text: e.message });
    } finally {
      setIsQuickSaving(false);
    }
  };

  const finishWorkout = async (templateId: number, durationString: string) => {
    const trimmed = durationString.trim();
    if (trimmed === '') {
      Alert.alert('Ошибка', 'Введите длительность тренировки (положительное целое число)');
      return;
    }
    const minutes = Number(trimmed);
    if (isNaN(minutes) || !Number.isInteger(minutes) || minutes <= 0) {
      Alert.alert('Ошибка', 'Длительность должна быть положительным целым числом');
      return;
    }
    const exercisesList = exercisesByTemplate[templateId] || [];
    if (exercisesList.length === 0) {
      Alert.alert('Ошибка', 'Добавьте хотя бы одно упражнение в шаблон');
      return;
    }
    try {
      const session = await workoutsApi.startSession(userId, templateId);
      await workoutsApi.completeSession(session.id, minutes);
      await Promise.all(exercisesList.map(we =>
        workoutsApi.saveResult({
          session_id: session.id,
          exercise_id: we.exercise_id,
          sets_done: we.sets,
          reps_done: we.reps,
          weight_used: we.weight,
        }).catch(() => undefined)
      ));
      setNotice({ type: 'success', text: 'Тренировка записана в историю' });
      await loadTemplatesAndSessions();
    } catch (e: any) {
      setNotice({ type: 'error', text: e.message });
    }
  };

  const closeExercisePicker = () => {
    setShowExercisePicker(false);
    setSelectedExerciseId(null);
    setAddSets('4');
    setAddReps('8');
    setAddWeight('40');
    setAddingForTemplateId(null);
  };

  const handleAddExercise = async () => {
    if (!selectedExerciseId) {
      Alert.alert('Ошибка', 'Не выбрано упражнение');
      return;
    }
    const setsNum = Number(addSets);
    const repsNum = Number(addReps);
    const weightNum = Number(addWeight);
    if (isNaN(setsNum) || setsNum <= 0 || !Number.isInteger(setsNum)) {
      Alert.alert('Ошибка', 'Количество подходов должно быть положительным целым числом');
      return;
    }
    if (isNaN(repsNum) || repsNum <= 0 || !Number.isInteger(repsNum)) {
      Alert.alert('Ошибка', 'Количество повторений должно быть положительным целым числом');
      return;
    }
    if (isNaN(weightNum) || weightNum <= 0) {
      Alert.alert('Ошибка', 'Вес должен быть положительным числом');
      return;
    }
    try {
      const currentExercises = exercisesByTemplate[addingForTemplateId!] || [];
      await workoutsApi.addExercise({
        template_id: addingForTemplateId!,
        exercise_id: selectedExerciseId,
        sets: setsNum,
        reps: repsNum,
        weight: weightNum,
        order_index: currentExercises.length + 1,
      });
      setNotice({ type: 'success', text: 'Упражнение добавлено' });
      await loadExercisesForTemplate(addingForTemplateId!);
      closeExercisePicker();
    } catch (e: any) {
      setNotice({ type: 'error', text: e.message });
    }
  };

  const handleDeleteExercise = async (templateId: number, workoutExerciseId: number) => {
    Alert.alert('Удалить упражнение из тренировки?', '', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: async () => {
        try {
          await workoutsApi.deleteExerciseFromTemplate(workoutExerciseId);
          await loadExercisesForTemplate(templateId);
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
    const setsNum = Number(editSets);
    const repsNum = Number(editReps);
    const weightNum = Number(editWeight);
    if (isNaN(setsNum) || setsNum <= 0 || !Number.isInteger(setsNum)) {
      Alert.alert('Ошибка', 'Количество подходов должно быть положительным целым числом');
      return;
    }
    if (isNaN(repsNum) || repsNum <= 0 || !Number.isInteger(repsNum)) {
      Alert.alert('Ошибка', 'Количество повторений должно быть положительным целым числом');
      return;
    }
    if (isNaN(weightNum) || weightNum <= 0) {
      Alert.alert('Ошибка', 'Вес должен быть положительным числом');
      return;
    }
    try {
      await workoutsApi.updateExerciseInTemplate(editingExercise.id, {
        sets: setsNum,
        reps: repsNum,
        weight: weightNum,
      });
      setEditModalVisible(false);
      if (expandedTemplateId) {
        await loadExercisesForTemplate(expandedTemplateId);
      }
    } catch (e: any) { setNotice({ type: 'error', text: e.message }); }
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
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <Text style={[styles.header, { color: textColor }]}>Тренировки</Text>
          <Text style={[styles.subtitle, { color: mutedColor }]}>Создавайте шаблоны и отслеживайте прогресс.</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Calculator')} style={styles.calculatorButton}>
          <Ionicons name="calculator-outline" size={24} color={textColor} />
          <Text style={[styles.calculatorText, { color: textColor }]}>Калькулятор</Text>
        </TouchableOpacity>
      </View>
      <NoticeBox notice={notice} />

      <View style={[styles.createSection, { backgroundColor: cardBg, borderColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Создать новый шаблон</Text>
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
      </View>

      <View style={[styles.templatesSection, { backgroundColor: cardBg, borderColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Мои тренировки</Text>
        {templates.length === 0 ? (
          <EmptyState title="Нет шаблонов" text="Создайте первую тренировку" />
        ) : (
          templates.map(item => {
            const isExpanded = expandedTemplateId === item.id;
            const exercisesList = exercisesByTemplate[item.id] || [];
            const isLoadingExercises = loadingExercises[item.id];
            const currentDuration = plannedDurations[item.id] ?? '45';

            return (
              <View key={item.id} style={[styles.templateCard, { borderColor, backgroundColor: isDark ? '#1c2926' : '#f8faf8' }]}>
                <TouchableOpacity
                  style={styles.templateHeader}
                  onPress={() => setExpandedTemplateId(isExpanded ? null : item.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.templateTitleRow}>
                    <Text style={[styles.templateName, { color: textColor }]}>{item.name}</Text>
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={mutedColor}
                    />
                  </View>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.expandedContent}>
                    <View style={styles.durationContainer}>
                      <View style={styles.durationField}>
                        <Text style={[styles.label, { color: mutedColor }]}>Длительность, мин</Text>
                        <TextInput
                          style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]}
                          keyboardType="numeric"
                          value={plannedDurations[item.id] ?? ''}
                          onChangeText={text => setPlannedDurations(prev => ({ ...prev, [item.id]: text }))}
                        />
                      </View>
                      <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => finishWorkout(item.id, currentDuration)}
                      >
                        <Text style={styles.primaryButtonText}>Записать в историю</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.exercisesSection}>
                      <Text style={[styles.subsectionTitle, { color: textColor }]}>Упражнения:</Text>
                      {isLoadingExercises ? (
                        <ActivityIndicator color="#2f7d68" />
                      ) : exercisesList.length === 0 ? (
                        <EmptyState title="Нет упражнений" text="Добавьте упражнения в эту тренировку" />
                      ) : (
                        exercisesList.map(we => {
                          const ex = exercises.find(e => e.id === we.exercise_id);
                          return (
                            <View key={we.id} style={[styles.exerciseItem, { borderBottomColor: borderColor }]}>
                              <TouchableOpacity onPress={() => openEditModal(we)} style={{ flex: 1 }}>
                                <Text style={[styles.exerciseName, { color: textColor }]}>{ex?.name ?? `Упр ${we.exercise_id}`}</Text>
                                <Text style={[styles.exerciseDetails, { color: mutedColor }]}>
                                  {we.sets} x {we.reps}, {we.weight} кг
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => handleDeleteExercise(item.id, we.id)}>
                                <Ionicons name="trash-outline" size={20} color="#b94a35" />
                              </TouchableOpacity>
                            </View>
                          );
                        })
                      )}
                      <TouchableOpacity
                        style={[styles.addExerciseButton, { borderColor }]}
                        onPress={() => {
                          setAddingForTemplateId(item.id);
                          setShowExercisePicker(true);
                        }}
                      >
                        <Ionicons name="add-circle-outline" size={22} color="#2f7d68" />
                        <Text style={[styles.addExerciseText, { color: '#2f7d68' }]}>Добавить упражнение</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            );
          })
        )}
      </View>

      <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Быстро создать упражнение</Text>
        <View style={styles.field}>
          <Text style={[styles.label, { color: mutedColor }]}>Название</Text>
          <TextInput
            style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]}
            placeholder="Например: Тяга гантели"
            placeholderTextColor={mutedColor}
            value={quickName}
            onChangeText={setQuickName}
          />
        </View>
        <View style={styles.field}>
          <Text style={[styles.label, { color: mutedColor }]}>Группа мышц</Text>
          <TouchableOpacity
            style={[styles.pickerButton, { borderColor, backgroundColor: cardBg }]}
            onPress={() => setQuickMuscleModalVisible(true)}
          >
            <Text style={{ color: textColor }}>{quickMuscle}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.primaryButton} onPress={handleQuickExercise} disabled={isQuickSaving}>
          <Text style={styles.primaryButtonText}>Создать</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>История тренировок</Text>
        {sessions.length === 0 ? (
          <EmptyState title="Нет записей" text="Завершённые тренировки появятся здесь" />
        ) : (
          sessions.map(s => {
            const template = templates.find(t => t.id === s.template_id);
            const templateName = template?.name || 'Удалённый шаблон';
            return (
              <View key={s.id} style={[styles.historyItem, { borderBottomColor: borderColor }]}>
                <Text style={[styles.historyTitle, { color: textColor, flexShrink: 1 }]}>
                  Сессия #{s.id} ({templateName})
                </Text>
                <Text style={[styles.historyDuration, { color: mutedColor }]}>
                  {s.duration_minutes || 0} мин
                </Text>
              </View>
            );
          })
        )}
      </View>

      <Modal
        visible={showExercisePicker}
        animationType="slide"
        onRequestClose={closeExercisePicker}
      >
        <View style={{ flex: 1, padding: 16, backgroundColor: cardBg }}>
          <Text style={[styles.modalTitle, { color: textColor }]}>Выберите упражнение</Text>
          <FlatList
            data={exercises}
            keyExtractor={e => e.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.modalItem, { borderBottomColor: borderColor }]}
                onPress={() => setSelectedExerciseId(item.id)}
              >
                <Text style={{ color: textColor }}>{item.name} ({item.muscle_group})</Text>
                {selectedExerciseId === item.id && <Ionicons name="checkmark-circle" size={24} color="#2f7d68" />}
              </TouchableOpacity>
            )}
          />
          <View style={styles.modalFields}>
            <View style={styles.row}>
              <View style={styles.smallField}>
                <Text style={[styles.label, { color: mutedColor }]}>Подходы</Text>
                <TextInput
                  style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]}
                  keyboardType="numeric"
                  value={addSets}
                  onChangeText={setAddSets}
                />
              </View>
              <View style={styles.smallField}>
                <Text style={[styles.label, { color: mutedColor }]}>Повторы</Text>
                <TextInput
                  style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]}
                  keyboardType="numeric"
                  value={addReps}
                  onChangeText={setAddReps}
                />
              </View>
              <View style={styles.smallField}>
                <Text style={[styles.label, { color: mutedColor }]}>Вес, кг</Text>
                <TextInput
                  style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]}
                  keyboardType="numeric"
                  value={addWeight}
                  onChangeText={setAddWeight}
                />
              </View>
            </View>
          </View>
          <View style={styles.modalButtons}>
            <TouchableOpacity style={[styles.secondaryButton, { backgroundColor: cardBg, borderColor }]} onPress={closeExercisePicker}>
              <Text style={[styles.secondaryButtonText, { color: textColor }]}>Отмена</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryButton} onPress={handleAddExercise}>
              <Text style={styles.primaryButtonText}>Добавить</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBg, borderColor }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>Редактировать упражнение</Text>
            <View style={styles.modalField}>
              <Text style={[styles.label, { color: mutedColor }]}>Подходы</Text>
              <TextInput
                style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]}
                keyboardType="numeric"
                value={editSets}
                onChangeText={setEditSets}
              />
            </View>
            <View style={styles.modalField}>
              <Text style={[styles.label, { color: mutedColor }]}>Повторы</Text>
              <TextInput
                style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]}
                keyboardType="numeric"
                value={editReps}
                onChangeText={setEditReps}
              />
            </View>
            <View style={styles.modalField}>
              <Text style={[styles.label, { color: mutedColor }]}>Вес, кг</Text>
              <TextInput
                style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]}
                keyboardType="numeric"
                value={editWeight}
                onChangeText={setEditWeight}
              />
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Text style={{ color: mutedColor, fontSize: 16 }}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveEdit}>
                <Text style={{ fontWeight: 'bold', color: '#2f7d68', fontSize: 16 }}>Сохранить</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={quickMuscleModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setQuickMuscleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBg, borderColor }]}>
            <FlatList
              data={muscleGroups}
              keyExtractor={item => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, quickMuscle === item && styles.modalItemSelected]}
                  onPress={() => {
                    setQuickMuscle(item);
                    setQuickMuscleModalVisible(false);
                  }}
                >
                  <Text style={[styles.modalItemText, { color: textColor }]}>{item}</Text>
                  {quickMuscle === item && <Text style={styles.modalItemCheck}>✓</Text>}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setQuickMuscleModalVisible(false)}>
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
  content: { padding: 16, gap: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  titleContainer: { flex: 1, marginRight: 12 },
  header: { fontSize: 28, fontWeight: '700' },
  subtitle: { fontSize: 14, marginTop: 2 },
  calculatorButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20, backgroundColor: 'rgba(47, 125, 104, 0.1)' },
  calculatorText: { fontSize: 14, fontWeight: '500' },
  createSection: { borderWidth: 1, borderRadius: 8, padding: 16 },
  templatesSection: { borderWidth: 1, borderRadius: 8, padding: 16 },
  section: { borderWidth: 1, borderRadius: 8, padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 8 },
  field: { gap: 4, marginBottom: 8 },
  label: { fontSize: 14 },
  input: { flex: 1, borderWidth: 1, borderRadius: 8, paddingVertical: 12, paddingHorizontal: 10, fontSize: 15, minHeight: 48 },
  smallField: { flex: 1 },
  primaryButton: { backgroundColor: '#2f7d68', borderRadius: 8, padding: 12, alignItems: 'center', marginVertical: 4 },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  secondaryButton: { borderWidth: 1, borderRadius: 8, padding: 10, alignItems: 'center' },
  secondaryButtonText: { fontWeight: '600' },
  pickerButton: { borderWidth: 1, borderRadius: 8, padding: 12, justifyContent: 'center', minHeight: 48 },
  templateCard: {
    marginBottom: 12,
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f8faf8',
  },
  templateHeader: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e8e0',
  },
  templateTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  templateName: { fontSize: 16, fontWeight: '600', flex: 1 },
  expandedContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 8,
  },
  durationContainer: {
    flexDirection: 'column',
    gap: 12,
    marginBottom: 12,
  },
  durationField: {
    width: '100%',
  },
  exercisesSection: { marginTop: 12 },
  subsectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  exerciseItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1 },
  exerciseName: { fontSize: 15, fontWeight: '500' },
  exerciseDetails: { fontSize: 13, marginTop: 2 },
  addExerciseButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderStyle: 'dashed', borderRadius: 8, padding: 10, marginTop: 12 },
  addExerciseText: { fontWeight: '500' },
  historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  historyTitle: { fontWeight: '600', fontSize: 15, flexShrink: 1, marginRight: 8 },
  historyDuration: { fontSize: 14, fontWeight: '500' },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
  modalContent: { width: '90%', maxWidth: 400, borderWidth: 1, borderRadius: 12, padding: 20, gap: 12 },
  modalTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  modalField: { marginBottom: 12 },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  modalItemSelected: { backgroundColor: 'rgba(31, 138, 112, 0.1)' },
  modalItemText: { fontSize: 16 },
  modalItemCheck: { fontSize: 18, color: '#1f8a70', fontWeight: 'bold' },
  modalCloseButton: { marginTop: 12, paddingVertical: 12, alignItems: 'center' },
  modalCloseText: { fontSize: 16, fontWeight: '500' },
  modalFields: { marginVertical: 12 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, gap: 12 },
});