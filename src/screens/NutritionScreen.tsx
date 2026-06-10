import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, FlatList, Modal, Dimensions,
  StyleSheet, Alert, RefreshControl
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { BarChart } from 'react-native-gifted-charts';
import { useAuth } from '../auth/AuthContext';
import { useCatalog } from '../contexts/CatalogContext';
import { foodApi, profileApi } from '../api/mainApi';
import { MealLog, CalorieGoal, FitnessProfile } from '../types';
import NoticeBox from '../components/NoticeBox';
import MetricCard from '../components/MetricCard';
import EmptyState from '../components/EmptyState';
import { useTheme } from '../contexts/ThemeContext';

const mealTypes = ['Завтрак', 'Обед', 'Ужин', 'Перекус'];

export default function NutritionScreen() {
  const { session } = useAuth();
  const { foods, refreshFoods } = useCatalog();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const userId = session?.userId ?? '';

  const [logs, setLogs] = useState<MealLog[]>([]);
  const [goal, setGoal] = useState<number>(2400);
  const [profileGoal, setProfileGoal] = useState<number>(2400);
  const [notice, setNotice] = useState<any>(null);
  const [foodName, setFoodName] = useState('');
  const [foodCal, setFoodCal] = useState<number>(120);
  const [foodProt, setFoodProt] = useState<number>(10);
  const [foodFat, setFoodFat] = useState<number>(3);
  const [foodCarbs, setFoodCarbs] = useState<number>(12);
  const [selectedFood, setSelectedFood] = useState<number | null>(null);
  const [grams, setGrams] = useState<number>(100);
  const [mealType, setMealType] = useState('Обед');
  const [refreshing, setRefreshing] = useState(false);
  const [foodModalVisible, setFoodModalVisible] = useState(false);
  const [foodSearchQuery, setFoodSearchQuery] = useState('');
  const [filteredFoods, setFilteredFoods] = useState(foods);
  const [mealTypeModalVisible, setMealTypeModalVisible] = useState(false);

  const load = useCallback(async () => {
    try {
      const [l, g, profile] = await Promise.all([
        foodApi.logs(userId),
        foodApi.goal(userId).catch(() => null),
        profileApi.get(userId).catch(() => null),
      ]);
      setLogs(l);
      const storedGoal = g?.daily_goal;
      const defaultGoal = profile?.daily_calories_goal ?? 2400;
      setProfileGoal(defaultGoal);
      setGoal(storedGoal ?? defaultGoal);
      if (!selectedFood && foods.length > 0) setSelectedFood(foods[0].id);
    } catch (e: any) {
      setNotice({ type: 'error', text: e.message });
    }
  }, [userId, foods, selectedFood]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([load(), refreshFoods()]);
    setRefreshing(false);
  };

  const totals = logs.reduce((acc, log) => {
    const food = foods.find(f => f.id === log.food_id);
    if (!food) return acc;
    const k = log.grams / 100;
    return {
      calories: acc.calories + food.calories * k,
      protein: acc.protein + food.protein * k,
      fat: acc.fat + food.fat * k,
      carbs: acc.carbs + food.carbs * k,
    };
  }, { calories: 0, protein: 0, fat: 0, carbs: 0 });

  const chartData = [
    { label: 'Белки', value: totals.protein },
    { label: 'Жиры', value: totals.fat },
    { label: 'Углеводы', value: totals.carbs },
  ];

  const searchFoods = (query: string) => {
    setFoodSearchQuery(query);
    if (!query.trim()) setFilteredFoods(foods);
    else setFilteredFoods(foods.filter(f => f.name.toLowerCase().includes(query.toLowerCase())));
  };

  const selectFood = (foodId: number) => {
    setSelectedFood(foodId);
    setFoodModalVisible(false);
    setFoodSearchQuery('');
  };

  const handleGramsChange = (text: string) => {
    const num = text === '' ? 0 : Number(text);
    setGrams(num);
  };

  const handleGoalChange = (text: string) => {
    const num = text === '' ? 0 : Number(text);
    setGoal(num);
  };

  const validateGrams = () => {
    const min = 1;
    if (grams < min) {
      setGrams(min);
      setNotice({ type: 'error', text: `Минимальное значение для поля "Граммы" — ${min} г.` });
    }
  };

  const validateGoal = () => {
    const min = 900;
    if (goal < min) {
      setGoal(min);
      setNotice({ type: 'error', text: `Минимальное значение для поля "Дневная цель" — ${min} ккал.` });
    }
  };

  const handleAddFood = async () => {
    if (!foodName.trim()) {
      setNotice({ type: 'error', text: 'Введите название продукта' });
      return;
    }
    try {
      const f = await foodApi.create({
        name: foodName.trim(),
        calories: foodCal,
        protein: foodProt,
        fat: foodFat,
        carbs: foodCarbs,
        user_id: userId,
      });
      setFoodName('');
      setFoodCal(120);
      setFoodProt(10);
      setFoodFat(3);
      setFoodCarbs(12);
      setSelectedFood(f.id);
      await refreshFoods();
      setNotice({ type: 'success', text: 'Продукт добавлен' });
    } catch (e: any) {
      setNotice({ type: 'error', text: e.message });
    }
  };

  const handleAddLog = async () => {
    if (!selectedFood) {
      setNotice({ type: 'error', text: 'Выберите продукт' });
      return;
    }
    if (grams < 1) {
      setNotice({ type: 'error', text: 'Граммы должны быть больше 0' });
      return;
    }
    try {
      await foodApi.addLog({
        user_id: userId,
        food_id: selectedFood,
        grams: grams,
        meal_type: mealType,
      });
      setGrams(100);
      await load();
      setNotice({ type: 'success', text: 'Запись добавлена' });
    } catch (e: any) {
      setNotice({ type: 'error', text: e.message });
    }
  };

  const handleDeleteLog = async (logId: number) => {
    Alert.alert('Удалить запись?', '', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: async () => {
        try {
          await foodApi.deleteLog(logId);
          await load();
        } catch (e: any) { setNotice({ type: 'error', text: e.message }); }
      } },
    ]);
  };

  const handleSaveGoal = async () => {
    if (goal < 900) {
      setNotice({ type: 'error', text: 'Цель должна быть не менее 900 ккал' });
      return;
    }
    try {
      await foodApi.setGoal({
        user_id: userId,
        daily_goal: goal,
        date: new Date().toISOString().slice(0, 10),
      });
      setNotice({ type: 'success', text: 'Цель сохранена' });
    } catch (e: any) {
      setNotice({ type: 'error', text: e.message });
    }
  };

  const resetToDefault = () => {
    setGoal(profileGoal);
  };

  const bgColor = isDark ? '#111816' : '#f4f6f4';
  const cardBg = isDark ? '#17211f' : '#fff';
  const textColor = isDark ? '#edf5f1' : '#17211f';
  const mutedColor = isDark ? '#9cafaa' : '#66736f';
  const borderColor = isDark ? '#2d413b' : '#dce5df';

  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 120;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: bgColor }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View>
        <Text style={[styles.header, { color: textColor }]}>Питание</Text>
        <Text style={[styles.subtitle, { color: mutedColor }]}>Ведите дневник еды и контролируйте дневную цель.</Text>
      </View>
      <NoticeBox notice={notice} />

      <MetricCard
        title="Съедено"
        value={`${Math.round(totals.calories)} ккал`}
        caption={`цель ${goal}`}
      />

      <View style={styles.rowMetrics}>
        <View style={styles.halfMetric}>
          <MetricCard title="Белки" value={`${Math.round(totals.protein)} г`} caption="" />
        </View>
        <View style={styles.halfMetric}>
          <MetricCard title="Жиры" value={`${Math.round(totals.fat)} г`} caption="" />
        </View>
        <View style={styles.halfMetric}>
          <MetricCard title="Углеводы" value={`${Math.round(totals.carbs)} г`} caption="" />
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Баланс БЖУ</Text>
        {logs.length > 0 ? (
          <BarChart
            data={chartData}
            width={chartWidth}
            height={200}
            barWidth={chartWidth / 4}
			initialSpacing={10}
            noOfSections={4}
            barBorderRadius={4}
            frontColor="#2f7d68"
            yAxisThickness={0}
            xAxisThickness={1}
            xAxisColor={borderColor}
            yAxisTextStyle={{ color: mutedColor }}
            xAxisLabelTextStyle={{ color: mutedColor }}
          />
        ) : (
          <EmptyState title="Нет данных" text="Диаграмма появится после добавления записей" />
        )}
      </View>

      <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Дневник питания</Text>
        <View style={styles.field}>
          <Text style={[styles.label, { color: mutedColor }]}>Продукт</Text>
          <TouchableOpacity
            style={[styles.selectButton, { borderColor, backgroundColor: cardBg }]}
            onPress={() => setFoodModalVisible(true)}
          >
            <Text style={{ color: selectedFood ? textColor : mutedColor }}>
              {foods.find(f => f.id === selectedFood)?.name ?? 'Выберите продукт'}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.row}>
          <View style={styles.smallField}>
            <Text style={[styles.label, { color: mutedColor }]}>Граммы</Text>
            <TextInput
              style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]}
              keyboardType="numeric"
              value={grams === 0 ? '' : String(grams)}
              onChangeText={handleGramsChange}
              onBlur={validateGrams}
            />
          </View>
          <View style={styles.smallField}>
            <Text style={[styles.label, { color: mutedColor }]}>Приём пищи</Text>
            <TouchableOpacity
              style={[styles.pickerButton, { borderColor, backgroundColor: cardBg }]}
              onPress={() => setMealTypeModalVisible(true)}
            >
              <Text style={{ color: textColor }}>{mealType}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity style={styles.primaryButton} onPress={handleAddLog}>
          <Text style={styles.primaryButtonText}>Добавить запись</Text>
        </TouchableOpacity>

        {logs.length > 0 ? (
          logs.map(item => {
            const food = foods.find(f => f.id === item.food_id);
            return (
              <View key={item.id} style={[styles.listItem, { borderBottomColor: borderColor }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.listTitle, { color: textColor }]}>{food?.name ?? 'Продукт'}</Text>
                  <Text style={[styles.listDetail, { color: mutedColor }]}>{item.grams} г, {item.meal_type}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDeleteLog(item.id)} style={styles.iconButton}>
                  <Ionicons name="trash-outline" size={20} color="#b94a35" />
                </TouchableOpacity>
              </View>
            );
          })
        ) : (
          <EmptyState title="Дневник пуст" text="Добавьте продукт и приём пищи" />
        )}
      </View>

      <Modal visible={foodModalVisible} animationType="slide">
        <View style={{ flex: 1, padding: 16, backgroundColor: cardBg }}>
          <Text style={[styles.modalTitle, { color: textColor }]}>Выберите продукт</Text>
          <TextInput
            style={[styles.modalSearchInput, { borderColor, color: textColor, backgroundColor: cardBg }]}
            placeholder="Поиск..."
            placeholderTextColor={mutedColor}
            value={foodSearchQuery}
            onChangeText={searchFoods}
          />
          <FlatList
            data={filteredFoods}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.modalItem, { borderBottomColor: borderColor }]}
                onPress={() => selectFood(item.id)}
              >
                <Text style={{ color: textColor }}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity style={[styles.primaryButton, { marginTop: 12 }]} onPress={() => setFoodModalVisible(false)}>
            <Text style={styles.primaryButtonText}>Закрыть</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Мои продукты</Text>
        {foods.length === 0 ? (
          <EmptyState title="Нет продуктов" text="Добавьте свой первый продукт" />
        ) : (
          <FlatList
            data={foods}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <View style={[styles.foodItem, { borderBottomColor: borderColor }]}>
                <View style={styles.foodInfo}>
                  <Text style={[styles.foodName, { color: textColor }]}>{item.name}</Text>
                  <Text style={[styles.foodMacros, { color: mutedColor }]}>
                    {Math.round(item.calories)} ккал | Б: {Math.round(item.protein)}г | Ж: {Math.round(item.fat)}г | У: {Math.round(item.carbs)}г
                  </Text>
                </View>
              </View>
            )}
            scrollEnabled={false}
          />
        )}
      </View>

      <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Добавить продукт</Text>
        <View style={styles.field}>
          <Text style={[styles.label, { color: mutedColor }]}>Название продукта</Text>
          <TextInput
            style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]}
            placeholder="Например: Рис отварной"
            placeholderTextColor={mutedColor}
            value={foodName}
            onChangeText={setFoodName}
          />
        </View>
        <View style={styles.row}>
          <View style={styles.smallField}>
            <Text style={[styles.label, { color: mutedColor }]}>Ккал на 100г</Text>
            <TextInput
              style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]}
              keyboardType="numeric"
              value={String(foodCal)}
              onChangeText={text => setFoodCal(Number(text) || 0)}
            />
          </View>
          <View style={styles.smallField}>
            <Text style={[styles.label, { color: mutedColor }]}>Белки</Text>
            <TextInput
              style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]}
              keyboardType="numeric"
              value={String(foodProt)}
              onChangeText={text => setFoodProt(Number(text) || 0)}
            />
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.smallField}>
            <Text style={[styles.label, { color: mutedColor }]}>Жиры</Text>
            <TextInput
              style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]}
              keyboardType="numeric"
              value={String(foodFat)}
              onChangeText={text => setFoodFat(Number(text) || 0)}
            />
          </View>
          <View style={styles.smallField}>
            <Text style={[styles.label, { color: mutedColor }]}>Углеводы</Text>
            <TextInput
              style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]}
              keyboardType="numeric"
              value={String(foodCarbs)}
              onChangeText={text => setFoodCarbs(Number(text) || 0)}
            />
          </View>
        </View>
        <TouchableOpacity style={styles.primaryButton} onPress={handleAddFood}>
          <Text style={styles.primaryButtonText}>Добавить продукт</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Дневная цель, ккал</Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]}
            keyboardType="numeric"
            value={goal === 0 ? '' : String(goal)}
            onChangeText={handleGoalChange}
            onBlur={validateGoal}
          />
          <TouchableOpacity style={[styles.secondaryButton, { backgroundColor: cardBg, borderColor }]} onPress={handleSaveGoal}>
            <Text style={[styles.secondaryButtonText, { color: textColor }]}>Сохранить</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.resetContainer}>
          <TouchableOpacity style={styles.resetButton} onPress={resetToDefault}>
            <Text style={[styles.resetButtonText, { color: '#2f7d68' }]}>Сбросить к стандартному</Text>
          </TouchableOpacity>
          <Text style={[styles.hintText, { color: mutedColor }]}>
            Стандартное значение устанавливается в профиле
          </Text>
        </View>
      </View>

      <Modal visible={mealTypeModalVisible} transparent animationType="fade" onRequestClose={() => setMealTypeModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBg, borderColor }]}>
            <FlatList
              data={mealTypes}
              keyExtractor={item => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, mealType === item && styles.modalItemSelected]}
                  onPress={() => {
                    setMealType(item);
                    setMealTypeModalVisible(false);
                  }}
                >
                  <Text style={[styles.modalItemText, { color: textColor }]}>{item}</Text>
                  {mealType === item && <Text style={styles.modalItemCheck}>✓</Text>}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setMealTypeModalVisible(false)}>
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
  content: { padding: 16, gap: 4 },
  header: { fontSize: 28, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 12 },
  rowMetrics: { flexDirection: 'row', justifyContent: 'space-between' },
  halfMetric: { flex: 1 },
  section: { borderWidth: 1, borderRadius: 8, padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  field: { gap: 4, marginBottom: 8 },
  label: { fontSize: 14 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'center' },
  input: { flex: 1, borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 15 },
  smallField: { flex: 1 },
  primaryButton: { backgroundColor: '#2f7d68', borderRadius: 8, padding: 12, alignItems: 'center', marginVertical: 4 },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  secondaryButton: { borderWidth: 1, borderRadius: 8, padding: 10, alignItems: 'center' },
  secondaryButtonText: { fontWeight: '600' },
  selectButton: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 8 },
  pickerButton: { borderWidth: 1, borderRadius: 8, padding: 12, justifyContent: 'center', minHeight: 48 },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  listTitle: { fontWeight: '600' },
  listDetail: { fontSize: 14 },
  iconButton: { padding: 4 },
  modalTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  modalItemSelected: { backgroundColor: 'rgba(31, 138, 112, 0.1)' },
  modalItemText: { fontSize: 16 },
  modalItemCheck: { fontSize: 18, color: '#1f8a70', fontWeight: 'bold' },
  modalCloseButton: { marginTop: 12, paddingVertical: 12, alignItems: 'center' },
  modalCloseText: { fontSize: 16, fontWeight: '500' },
  resetContainer: { marginTop: 12, alignItems: 'center' },
  resetButton: { paddingVertical: 6, paddingHorizontal: 12 },
  resetButtonText: { fontSize: 14, fontWeight: '500', textDecorationLine: 'underline' },
  hintText: { fontSize: 12, marginTop: 4, textAlign: 'center' },
  foodItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  foodInfo: { flex: 1 },
  foodName: { fontSize: 15, fontWeight: '500' },
  foodMacros: { fontSize: 12, marginTop: 2 },
  modalSearchInput: { borderWidth: 1, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, fontSize: 15, marginBottom: 12 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
  modalContent: { width: '80%', maxHeight: '70%', borderRadius: 12, borderWidth: 1, overflow: 'hidden', padding: 16 },
});