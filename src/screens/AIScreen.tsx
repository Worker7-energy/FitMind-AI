import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, Alert, Modal, FlatList
} from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { useCatalog } from '../contexts/CatalogContext';
import { aiApi, profileApi, saveSingleAiExercise, saveAiFood, saveAiMealPlan, saveAiWorkout } from '../api/mainApi';
import { FitnessProfile, AiWorkoutResponse, AiMealResponse } from '../types';
import NoticeBox from '../components/NoticeBox';
import WorkoutPlanView from '../components/WorkoutPlanView';
import MealPlanView from '../components/MealPlanView';
import { useTheme } from '../contexts/ThemeContext';

type TabType = 'workout' | 'meal';

export default function AIScreen() {
  const { session } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const userId = session?.userId ?? '';
  const { refreshExercises, refreshFoods } = useCatalog(); 

  const [activeTab, setActiveTab] = useState<TabType>('workout');

  const [workoutSex, setWorkoutSex] = useState('male');
  const [workoutWeight, setWorkoutWeight] = useState<number>(75);
  const [workoutLevel, setWorkoutLevel] = useState('intermediate');
  const [workoutGoal, setWorkoutGoal] = useState('strength');
  const [limitations, setLimitations] = useState('');
  const [equipment, setEquipment] = useState('штанга, гантели');
  const [workoutResult, setWorkoutResult] = useState<AiWorkoutResponse | null>(null);
  const [workoutNotice, setWorkoutNotice] = useState<any>(null);
  const [loadingWorkout, setLoadingWorkout] = useState(false);

  const [mealCalories, setMealCalories] = useState<number>(2300);
  const [mealDiet, setMealDiet] = useState('balanced');
  const [mealPreferences, setMealPreferences] = useState('');
  const [mealResult, setMealResult] = useState<AiMealResponse | null>(null);
  const [mealNotice, setMealNotice] = useState<any>(null);
  const [loadingMeal, setLoadingMeal] = useState(false);

  const [levelModalVisible, setLevelModalVisible] = useState(false);
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [dietModalVisible, setDietModalVisible] = useState(false);

  const [addedExercises, setAddedExercises] = useState<Set<string>>(new Set());
  const [addedFoods, setAddedFoods] = useState<Set<string>>(new Set());
  const [addedMeals, setAddedMeals] = useState<Set<string>>(new Set());
  const [isWorkoutAdded, setIsWorkoutAdded] = useState(false);
  const [isMealPlanAdded, setIsMealPlanAdded] = useState(false);

  useEffect(() => {
    setWorkoutNotice(null);
    setMealNotice(null);
  }, [activeTab]);

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
    setWorkoutResult(null);
    setAddedExercises(new Set());
    setIsWorkoutAdded(false);
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
      let parsed = res;
      if (typeof res === 'string') {
        try { parsed = JSON.parse(res); } catch { parsed = res; }
      }
      setWorkoutResult(parsed as AiWorkoutResponse);
      setWorkoutNotice({ type: 'success', text: 'План тренировки получен.' });
    } catch (e: any) {
      setWorkoutNotice({ type: 'error', text: e.message });
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
    setMealResult(null);
    setAddedFoods(new Set());
    setAddedMeals(new Set());
    setIsMealPlanAdded(false);
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
      let parsed = res;
      if (typeof res === 'string') {
        try { parsed = JSON.parse(res); } catch { parsed = res; }
      }
      setMealResult(parsed as AiMealResponse);
      setMealNotice({ type: 'success', text: 'План питания получен.' });
    } catch (e: any) {
      setMealNotice({ type: 'error', text: 'Ошибка AI-сервиса' });
    } finally {
      setLoadingMeal(false);
    }
  };

  const handleAddExercise = async (exercise: any) => {
    const key = `${exercise.name}_${exercise.sets}_${exercise.reps}_${exercise.weight_kg}`;
    if (addedExercises.has(key)) {
      Alert.alert('Упражнение уже добавлено');
      return;
    }
    try {
      await saveSingleAiExercise(userId, exercise);
      setAddedExercises(prev => new Set(prev).add(key));
      await refreshExercises();
      setWorkoutNotice({ type: 'success', text: 'Упражнение добавлено в каталог' });
    } catch (e: any) {
      setWorkoutNotice({ type: 'error', text: e.message });
    }
  };

  const handleAddWholeWorkout = async () => {
    if (isWorkoutAdded) {
      Alert.alert('Тренировка уже добавлена');
      return;
    }
    if (!workoutResult) return;
    try {
      await saveAiWorkout(userId, workoutResult);
      setIsWorkoutAdded(true);
      await refreshExercises(); 
      setWorkoutNotice({ type: 'success', text: 'Тренировка добавлена в шаблоны' });
    } catch (e: any) {
      setWorkoutNotice({ type: 'error', text: e.message });
    }
  };

  const handleAddFood = async (food: any, mealType: string) => {
    const key = `${food.name}_${food.grams}`;
    if (addedFoods.has(key)) {
      Alert.alert('Продукт уже добавлен сегодня');
      return;
    }
    try {
      await saveAiFood(userId, food, mealType);
      setAddedFoods(prev => new Set(prev).add(key));
      await refreshFoods(); 
      setMealNotice({ type: 'success', text: 'Продукт добавлен в дневник' });
    } catch (e: any) {
      setMealNotice({ type: 'error', text: e.message });
    }
  };

  const handleAddMeal = async (meal: any) => {
    const key = meal.meal_type;
    if (addedMeals.has(key)) {
      Alert.alert('Приём пищи уже добавлен');
      return;
    }
    try {
      for (const food of meal.foods) {
        await saveAiFood(userId, food, meal.meal_type);
      }
      setAddedMeals(prev => new Set(prev).add(key));
      await refreshFoods(); 
      setMealNotice({ type: 'success', text: `Приём пищи "${meal.meal_type}" добавлен` });
    } catch (e: any) {
      setMealNotice({ type: 'error', text: e.message });
    }
  };

  const handleAddWholeMealPlan = async () => {
    if (isMealPlanAdded) {
      Alert.alert('Рацион уже добавлен');
      return;
    }
    if (!mealResult) return;
    try {
      await saveAiMealPlan(userId, mealResult);
      setIsMealPlanAdded(true);
      await refreshFoods();
      setMealNotice({ type: 'success', text: 'Рацион добавлен в дневник' });
    } catch (e: any) {
      setMealNotice({ type: 'error', text: e.message });
    }
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

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'workout' && styles.tabActive]}
          onPress={() => setActiveTab('workout')}
        >
          <Text style={[styles.tabText, activeTab === 'workout' && styles.tabTextActive, { color: textColor }]}>
            План{'\n'}тренировок
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'meal' && styles.tabActive]}
          onPress={() => setActiveTab('meal')}
        >
          <Text style={[styles.tabText, activeTab === 'meal' && styles.tabTextActive, { color: textColor }]}>
            План{'\n'}питания
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'workout' && (
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Параметры тренировки</Text>

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
            {loadingWorkout ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.primaryButtonText}>Выполняется генерация...</Text>
              </View>
            ) : (
              <Text style={styles.primaryButtonText}>Сгенерировать</Text>
            )}
          </TouchableOpacity>

          <NoticeBox notice={workoutNotice} />

          {workoutResult !== null && (
            <>
              <View style={styles.divider} />
              <Text style={[styles.resultHeader, { color: textColor }]}>Результат генерации</Text>
              {typeof workoutResult === 'object' && workoutResult.exercises ? (
                <WorkoutPlanView
                  plan={workoutResult}
                  onAddExercise={handleAddExercise}
                  onAddWholeWorkout={handleAddWholeWorkout}
                />
              ) : (
                <Text style={[styles.resultBox, { color: textColor, backgroundColor: isDark ? '#1c2926' : '#f8faf8', borderColor }]}>
                  {typeof workoutResult === 'string' ? workoutResult : JSON.stringify(workoutResult, null, 2)}
                </Text>
              )}
            </>
          )}
        </View>
      )}

      {activeTab === 'meal' && (
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Параметры питания</Text>

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
            {loadingMeal ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.primaryButtonText}>Выполняется генерация...</Text>
              </View>
            ) : (
              <Text style={styles.primaryButtonText}>Сгенерировать</Text>
            )}
          </TouchableOpacity>

          <NoticeBox notice={mealNotice} />

          {mealResult !== null && (
            <>
              <View style={styles.divider} />
              <Text style={[styles.resultHeader, { color: textColor }]}>Результат генерации</Text>
              {typeof mealResult === 'object' && mealResult.meals ? (
                <MealPlanView
                  plan={mealResult}
                  onAddFood={handleAddFood}
                  onAddMeal={handleAddMeal}
                  onAddWholeMealPlan={handleAddWholeMealPlan}
                />
              ) : (
                <Text style={[styles.resultBox, { color: textColor, backgroundColor: isDark ? '#1c2926' : '#f8faf8', borderColor }]}>
                  {typeof mealResult === 'string' ? mealResult : JSON.stringify(mealResult, null, 2)}
                </Text>
              )}
            </>
          )}
        </View>
      )}

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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#dce5df',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#2f7d68',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
  },
  tabTextActive: {
    color: '#2f7d68',
    fontWeight: '700',
  },
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
  divider: {
    height: 1,
    backgroundColor: '#dce5df',
    marginVertical: 16,
  },
  resultHeader: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
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