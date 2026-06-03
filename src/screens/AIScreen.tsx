import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { aiApi } from '../api/mainApi';
import NoticeBox from '../components/NoticeBox';
import { useTheme } from '../contexts/ThemeContext';

export default function AIScreen() {
  const { session } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [workoutNotice, setWorkoutNotice] = useState<any>(null);
  const [mealNotice, setMealNotice] = useState<any>(null);
  const [loadingWorkout, setLoadingWorkout] = useState(false);
  const [loadingMeal, setLoadingMeal] = useState(false);
  
  const [workoutWeight, setWorkoutWeight] = useState('');
  const [sex, setSex] = useState('male'); 
  const [level, setLevel] = useState('');
  const [goal, setGoal] = useState('');
  const [mealCalories, setMealCalories] = useState('');
  const [preferences, setPreferences] = useState('');
  const [diet, setDiet] = useState('');

  const validateWorkout = () => {
    if (!workoutWeight) {
      Alert.alert('Ошибка', 'Введите вес');
      return false;
    }
    if (!level) {
      Alert.alert('Ошибка', 'Введите уровень подготовки');
      return false;
    }
    if (!goal) {
      Alert.alert('Ошибка', 'Введите цель тренировки');
      return false;
    }
    return true;
  };

  const validateMeal = () => {
    if (!mealCalories) {
      Alert.alert('Ошибка', 'Введите количество калорий');
      return false;
    }
    if (!diet) {
      Alert.alert('Ошибка', 'Введите тип диеты');
      return false;
    }
    return true;
  };

  const generateWorkout = async () => {
    if (!validateWorkout()) return;
    setWorkoutNotice(null);
    setLoadingWorkout(true);
    try {
      const res = await aiApi.workout({
        user_id: session?.userId ?? '',
        sex,
        weight: Number(workoutWeight),
        level,
        goal,
        limitations: [],
        equipment: ['barbell', 'dumbbells'],
      });
      setWorkoutNotice({ type: 'success', text: res.note ?? res.error ?? 'План тренировки готов' });
    } catch (e: any) {
      setWorkoutNotice({ type: 'error', text: e.message });
    } finally { setLoadingWorkout(false); }
  };

  const generateMeal = async () => {
    if (!validateMeal()) return;
    setMealNotice(null);
    setLoadingMeal(true);
    try {
      const prefArray = preferences ? preferences.split(',').map(p => p.trim()).filter(p => p) : [];
      const res = await aiApi.mealPlan({
        user_id: session?.userId ?? '',
        calories: Number(mealCalories),
        preferences: prefArray,
        diet,
      });
      setMealNotice({ type: 'success', text: res.note ?? res.error ?? 'План питания готов' });
    } catch (e: any) {
      setMealNotice({ type: 'error', text: e.message });
    } finally { setLoadingMeal(false); }
  };

  const bgColor = isDark ? '#111816' : '#f4f6f4';
  const cardBg = isDark ? '#17211f' : '#fff';
  const textColor = isDark ? '#edf5f1' : '#17211f';
  const mutedColor = isDark ? '#9cafaa' : '#66736f';
  const borderColor = isDark ? '#2d413b' : '#dce5df';
  const segBg = isDark ? '#1c2926' : '#e9f3ee';
  const segTextColor = isDark ? '#edf5f1' : '#17211f';

  return (
    <ScrollView style={[styles.container, { backgroundColor: bgColor }]} contentContainerStyle={styles.content}>
      <View>
        <Text style={[styles.header, { color: textColor }]}>AI-план</Text>
        <Text style={[styles.subtitle, { color: mutedColor }]}>Подготовьте тренировку или рацион на основе ваших целей.</Text>
      </View>

      <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>План тренировки</Text>
        <TextInput
          style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]}
          placeholder="Вес, кг"
          placeholderTextColor={mutedColor}
          keyboardType="numeric"
          value={workoutWeight}
          onChangeText={setWorkoutWeight}
        />
        <View style={styles.segmented}>
          <TouchableOpacity
            style={[styles.segBtn, { backgroundColor: segBg }, sex === 'male' && styles.segActive]}
            onPress={() => setSex('male')}
          >
            <Text style={[styles.segText, { color: segTextColor }, sex === 'male' && styles.segTextActive]}>Муж</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segBtn, { backgroundColor: segBg }, sex === 'female' && styles.segActive]}
            onPress={() => setSex('female')}
          >
            <Text style={[styles.segText, { color: segTextColor }, sex === 'female' && styles.segTextActive]}>Жен</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]}
          placeholder="Уровень (beginner/intermediate/advanced)"
          placeholderTextColor={mutedColor}
          value={level}
          onChangeText={setLevel}
        />
        <TextInput
          style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]}
          placeholder="Цель (strength/hypertrophy/endurance)"
          placeholderTextColor={mutedColor}
          value={goal}
          onChangeText={setGoal}
        />
        <TouchableOpacity style={styles.primaryButton} onPress={generateWorkout} disabled={loadingWorkout}>
          {loadingWorkout ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Сгенерировать</Text>}
        </TouchableOpacity>
        <NoticeBox notice={workoutNotice} />
      </View>

      <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>План питания</Text>
        <TextInput
          style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]}
          placeholder="Калории"
          placeholderTextColor={mutedColor}
          keyboardType="numeric"
          value={mealCalories}
          onChangeText={setMealCalories}
        />
        <TextInput
          style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]}
          placeholder="Предпочтения (через запятую, необязательно)"
          placeholderTextColor={mutedColor}
          value={preferences}
          onChangeText={setPreferences}
        />
        <TextInput
          style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]}
          placeholder="Диета (balanced/mediterranean/keto)"
          placeholderTextColor={mutedColor}
          value={diet}
          onChangeText={setDiet}
        />
        <TouchableOpacity style={styles.primaryButton} onPress={generateMeal} disabled={loadingMeal}>
          {loadingMeal ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Сгенерировать</Text>}
        </TouchableOpacity>
        <NoticeBox notice={mealNotice} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 16 },
  header: { fontSize: 28, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 12 },
  section: { borderWidth: 1, borderRadius: 8, padding: 16, gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16 },
  segmented: { flexDirection: 'row', gap: 8, marginVertical: 4 },
  segBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  segActive: { backgroundColor: '#2f7d68' },
  segText: { fontWeight: '600' },
  segTextActive: { color: '#fff' },
  primaryButton: { backgroundColor: '#2f7d68', borderRadius: 8, padding: 14, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});