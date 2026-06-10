import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, Alert, Modal, FlatList
} from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { aiApi, profileApi } from '../api/mainApi';
import { FitnessProfile } from '../types';
import NoticeBox from '../components/NoticeBox';
import { useTheme } from '../contexts/ThemeContext';

export default function AIScreen() {
  const { session } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const userId = session?.userId ?? '';

  const [workoutSex, setWorkoutSex] = useState('male');
  const [workoutWeight, setWorkoutWeight] = useState<number>(75); 
  const [workoutLevel, setWorkoutLevel] = useState('intermediate');
  const [workoutGoal, setWorkoutGoal] = useState('strength');
  const [limitations, setLimitations] = useState('');
  const [equipment, setEquipment] = useState('штанга, гантели');
  const [workoutResult, setWorkoutResult] = useState('');
  const [workoutNotice, setWorkoutNotice] = useState<any>(null);
  const [loadingWorkout, setLoadingWorkout] = useState(false);

  const [mealCalories, setMealCalories] = useState<number>(2300);
  const [mealDiet, setMealDiet] = useState('balanced');
  const [mealPreferences, setMealPreferences] = useState('');
  const [mealResult, setMealResult] = useState('');
  const [mealNotice, setMealNotice] = useState<any>(null);
  const [loadingMeal, setLoadingMeal] = useState(false);

  const [levelModalVisible, setLevelModalVisible] = useState(false);
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [dietModalVisible, setDietModalVisible] = useState(false);

  useEffect(() => {
    if (!userId) return;
    profileApi.get(userId).then((profile: FitnessProfile | null) => {
      if (profile) {
        setWorkoutSex(profile.sex);
        setWorkoutWeight(profile.weight);
        setMealCalories(profile.daily_calories_goal);
      }
    }).catch(() => {});
  }, [userId]);

  const levelOptions = [
    { label: 'Начальный', value: 'beginner' },
    { label: 'Средний', value: 'intermediate' },
    { label: 'Продвинутый', value: 'advanced' },
  ];

  const goalOptions = [
    { label: 'Сила', value: 'strength' },
    { label: 'Мышцы', value: 'hypertrophy' },
    { label: 'Снижение веса', value: 'fat_loss' },
    { label: 'Выносливость', value: 'endurance' },
  ];

  const dietOptions = [
    { label: 'Сбалансированный', value: 'balanced' },
    { label: 'Высокобелковый', value: 'high_protein' },
    { label: 'Низкоуглеводный', value: 'low_carb' },
    { label: 'Вегетарианский', value: 'vegetarian' },
  ];

  const getLevelLabel = (value: string) => levelOptions.find(o => o.value === value)?.label || value;
  const getGoalLabel = (value: string) => goalOptions.find(o => o.value === value)?.label || value;
  const getDietLabel = (value: string) => dietOptions.find(o => o.value === value)?.label || value;

  const handleWeightChange = (text: string) => {
    const num = text === '' ? 0 : Number(text);
    setWorkoutWeight(num);
  };

  const validateWeight = () => {
    const min = 30;
    if (workoutWeight < min) {
      setWorkoutWeight(min);
      setWorkoutNotice({ type: 'error', text: `Минимальное значение для поля "Вес" — ${min} кг.` });
    }
  };

  const handleCaloriesChange = (text: string) => {
    const num = text === '' ? 0 : Number(text);
    setMealCalories(num);
  };

  const validateCalories = () => {
    const min = 900;
    if (mealCalories < min) {
      setMealCalories(min);
      setMealNotice({ type: 'error', text: `Минимальное значение для поля "Калории" — ${min} ккал.` });
    }
  };

  const validateWorkout = () => {
    if (workoutWeight <= 0) {
      Alert.alert('Ошибка', 'Введите корректный вес (больше 0)');
      return false;
    }
    return true;
  };

  const generateWorkout = async () => {
    if (!validateWorkout()) return;
    setWorkoutNotice(null);
    setWorkoutResult('');
    setLoadingWorkout(true);
    try {
      const payload = {
        user_id: userId,
        sex: workoutSex,
        weight: workoutWeight,
        level: workoutLevel,
        goal: workoutGoal,
        limitations: limitations.split(',').map(s => s.trim()).filter(Boolean),
        equipment: equipment.split(',').map(s => s.trim()).filter(Boolean),
      };
      const res = await aiApi.workout(payload);
      const formatted = formatAiResponse(res);
      setWorkoutResult(formatted);
      setWorkoutNotice({ type: 'success', text: 'План тренировки получен.' });
    } catch (e: any) {
      setWorkoutNotice({ type: 'error', text: 'Ошибка AI-сервиса' });
    } finally {
      setLoadingWorkout(false);
    }
  };

  const validateMeal = () => {
    if (mealCalories <= 0) {
      Alert.alert('Ошибка', 'Введите корректное количество калорий (больше 0)');
      return false;
    }
    return true;
  };

  const generateMeal = async () => {
    if (!validateMeal()) return;
    setMealNotice(null);
    setMealResult('');
    setLoadingMeal(true);
    try {
      const prefArray = mealPreferences.split(',').map(p => p.trim()).filter(Boolean);
      const payload = {
        user_id: userId,
        calories: mealCalories,
        diet: mealDiet,
        preferences: prefArray,
      };
      const res = await aiApi.mealPlan(payload);
      const formatted = formatAiResponse(res);
      setMealResult(formatted);
      setMealNotice({ type: 'success', text: 'План питания получен.' });
    } catch (e: any) {
      setMealNotice({ type: 'error', text: 'Ошибка AI-сервиса' });
    } finally {
      setLoadingMeal(false);
    }
  };

  const formatAiResponse = (response: any): string => {
    if (response && typeof response === 'object') {
      if (response.raw) return response.raw;
      if (response.note) return response.note;
      if (response.error) return response.error;
      return JSON.stringify(response, null, 2);
    }
    return String(response);
  };

  const renderPickerModal = (
    visible: boolean,
    onClose: () => void,
    options: { label: string; value: string }[],
    selectedValue: string,
    onSelect: (value: string) => void
  ) => (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: isDark ? '#17211f' : '#fff', borderColor: isDark ? '#2d413b' : '#dce5df' }]}>
          <FlatList
            data={options}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.modalItem, selectedValue === item.value && styles.modalItemSelected]}
                onPress={() => {
                  onSelect(item.value);
                  onClose();
                }}
              >
                <Text style={[styles.modalItemText, { color: isDark ? '#edf5f1' : '#17211f' }]}>{item.label}</Text>
                {selectedValue === item.value && <Text style={styles.modalItemCheck}>✓</Text>}
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
            <Text style={[styles.modalCloseText, { color: isDark ? '#9cafaa' : '#66736f' }]}>Закрыть</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const bgColor = isDark ? '#111816' : '#f4f6f4';
  const cardBg = isDark ? '#17211f' : '#fff';
  const textColor = isDark ? '#edf5f1' : '#17211f';
  const mutedColor = isDark ? '#9cafaa' : '#66736f';
  const borderColor = isDark ? '#2d413b' : '#dce5df';
  const segBg = isDark ? '#1c2926' : '#e9f3ee';
  const segTextColor = isDark ? '#edf5f1' : '#17211f';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: bgColor }]}
      contentContainerStyle={styles.content}
    >
      <View>
        <Text style={[styles.header, { color: textColor }]}>AI-план</Text>
        <Text style={[styles.subtitle, { color: mutedColor }]}>
          Сформируйте тренировку или рацион по вашим целям.
        </Text>
      </View>

      <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>План тренировки</Text>

        <View style={styles.field}>
          <Text style={[styles.label, { color: mutedColor }]}>Пол</Text>
          <View style={styles.segmented}>
            <TouchableOpacity
              style={[styles.segBtn, { backgroundColor: segBg }, workoutSex === 'male' && styles.segActive]}
              onPress={() => setWorkoutSex('male')}
            >
              <Text style={[styles.segText, { color: segTextColor }, workoutSex === 'male' && styles.segTextActive]}>Муж</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segBtn, { backgroundColor: segBg }, workoutSex === 'female' && styles.segActive]}
              onPress={() => setWorkoutSex('female')}
            >
              <Text style={[styles.segText, { color: segTextColor }, workoutSex === 'female' && styles.segTextActive]}>Жен</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: mutedColor }]}>Вес, кг</Text>
          <TextInput
            style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]}
            keyboardType="numeric"
            value={workoutWeight === 0 ? '' : String(workoutWeight)}
            onChangeText={handleWeightChange}
            onBlur={validateWeight}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: mutedColor }]}>Уровень</Text>
          <TouchableOpacity
            style={[styles.pickerButton, { borderColor, backgroundColor: cardBg }]}
            onPress={() => setLevelModalVisible(true)}
          >
            <Text style={{ color: textColor }}>{getLevelLabel(workoutLevel)}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: mutedColor }]}>Цель</Text>
          <TouchableOpacity
            style={[styles.pickerButton, { borderColor, backgroundColor: cardBg }]}
            onPress={() => setGoalModalVisible(true)}
          >
            <Text style={{ color: textColor }}>{getGoalLabel(workoutGoal)}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: mutedColor }]}>Ограничения</Text>
          <TextInput
            style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]}
            placeholder="например: колено, плечо"
            placeholderTextColor={mutedColor}
            value={limitations}
            onChangeText={setLimitations}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: mutedColor }]}>Оборудование</Text>
          <TextInput
            style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]}
            placeholder="например: штанга, гантели"
            placeholderTextColor={mutedColor}
            value={equipment}
            onChangeText={setEquipment}
          />
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={generateWorkout} disabled={loadingWorkout}>
          {loadingWorkout ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Сгенерировать</Text>}
        </TouchableOpacity>

        <NoticeBox notice={workoutNotice} />
        {workoutResult ? <Text style={[styles.resultBox, { color: textColor, backgroundColor: isDark ? '#1c2926' : '#f8faf8', borderColor }]}>{workoutResult}</Text> : null}
      </View>

      <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>План питания</Text>

        <View style={styles.field}>
          <Text style={[styles.label, { color: mutedColor }]}>Калории</Text>
          <TextInput
            style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]}
            keyboardType="numeric"
            value={mealCalories === 0 ? '' : String(mealCalories)}
            onChangeText={handleCaloriesChange}
            onBlur={validateCalories}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: mutedColor }]}>Тип рациона</Text>
          <TouchableOpacity
            style={[styles.pickerButton, { borderColor, backgroundColor: cardBg }]}
            onPress={() => setDietModalVisible(true)}
          >
            <Text style={{ color: textColor }}>{getDietLabel(mealDiet)}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: mutedColor }]}>Предпочтения</Text>
          <TextInput
            style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]}
            placeholder="например: больше белка, без рыбы"
            placeholderTextColor={mutedColor}
            value={mealPreferences}
            onChangeText={setMealPreferences}
          />
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={generateMeal} disabled={loadingMeal}>
          {loadingMeal ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Сгенерировать</Text>}
        </TouchableOpacity>

        <NoticeBox notice={mealNotice} />
        {mealResult ? <Text style={[styles.resultBox, { color: textColor, backgroundColor: isDark ? '#1c2926' : '#f8faf8', borderColor }]}>{mealResult}</Text> : null}
      </View>

      {renderPickerModal(levelModalVisible, () => setLevelModalVisible(false), levelOptions, workoutLevel, setWorkoutLevel)}
      {renderPickerModal(goalModalVisible, () => setGoalModalVisible(false), goalOptions, workoutGoal, setWorkoutGoal)}
      {renderPickerModal(dietModalVisible, () => setDietModalVisible(false), dietOptions, mealDiet, setMealDiet)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 16 },
  header: { fontSize: 28, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 12 },
  section: { borderWidth: 1, borderRadius: 8, padding: 16, gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  field: { gap: 4 },
  label: { fontSize: 14 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16 },
  pickerButton: { borderWidth: 1, borderRadius: 8, padding: 12, justifyContent: 'center', minHeight: 48 },
  segmented: { flexDirection: 'row', gap: 8, marginVertical: 4 },
  segBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  segActive: { backgroundColor: '#2f7d68' },
  segText: { fontWeight: '600' },
  segTextActive: { color: '#fff' },
  primaryButton: { backgroundColor: '#2f7d68', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 4 },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  resultBox: {
    marginTop: 8,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 13,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
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