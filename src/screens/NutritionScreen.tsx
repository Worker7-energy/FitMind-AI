import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, FlatList, Modal, Dimensions,
  StyleSheet, Alert, RefreshControl
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { BarChart } from 'react-native-gifted-charts';
import { useAuth } from '../auth/AuthContext';
import { useCatalog } from '../contexts/CatalogContext';
import { foodApi } from '../api/mainApi';
import { MealLog, CalorieGoal } from '../types';
import NoticeBox from '../components/NoticeBox';
import MetricCard from '../components/MetricCard';
import EmptyState from '../components/EmptyState';
import { useTheme } from '../contexts/ThemeContext';

export default function NutritionScreen() {
  const { session } = useAuth();
  const { foods, refreshFoods } = useCatalog();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const userId = session?.userId ?? '';

  const [logs, setLogs] = useState<MealLog[]>([]);
  const [goal, setGoal] = useState<number>(2400);
  const [notice, setNotice] = useState<any>(null);
  const [foodName, setFoodName] = useState('');
  const [foodCal, setFoodCal] = useState('120');
  const [foodProt, setFoodProt] = useState('10');
  const [foodFat, setFoodFat] = useState('3');
  const [foodCarbs, setFoodCarbs] = useState('12');
  const [selectedFood, setSelectedFood] = useState<number | null>(null);
  const [grams, setGrams] = useState('100');
  const [mealType, setMealType] = useState('Обед');
  const [refreshing, setRefreshing] = useState(false);
  const [foodModalVisible, setFoodModalVisible] = useState(false);
  const [foodSearchQuery, setFoodSearchQuery] = useState('');
  const [filteredFoods, setFilteredFoods] = useState(foods);

  const load = useCallback(async () => {
    try {
      const [l, g] = await Promise.all([
        foodApi.logs(userId),
        foodApi.goal(userId).catch(() => null),
      ]);
      setLogs(l);
      setGoal(g?.daily_goal ?? 2400);
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
    const k = Number(log.grams) / 100;
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

  const handleAddFood = async () => {
    if (!foodName.trim()) return;
    try {
      const f = await foodApi.create({
        name: foodName.trim(),
        calories: Number(foodCal),
        protein: Number(foodProt),
        fat: Number(foodFat),
        carbs: Number(foodCarbs),
        user_id: userId,
      });
      setFoodName('');
      setFoodCal('120');
      setFoodProt('10');
      setFoodFat('3');
      setFoodCarbs('12');
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
    try {
      await foodApi.addLog({
        user_id: userId,
        food_id: selectedFood,
        grams: Number(grams),
        meal_type: mealType,
      });
      setGrams('100');
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

  const handleDeleteFood = async (foodId: number, isCustom: boolean) => {
    if (!isCustom) {
      Alert.alert('Нельзя удалить системный продукт');
      return;
    }
    Alert.alert('Удалить продукт?', 'Это удалит его из всех записей.', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: async () => {
        try {
          await foodApi.deleteFood(foodId);
          await refreshFoods();
          if (selectedFood === foodId) setSelectedFood(foods[0]?.id || null);
          await load();
        } catch (e: any) { setNotice({ type: 'error', text: e.message }); }
      } },
    ]);
  };

  const handleSaveGoal = async () => {
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

      {/* Метрики */}
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

      {/* График БЖУ */}
      <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Баланс БЖУ</Text>
        {logs.length > 0 ? (
          <BarChart
            data={chartData}
            width={chartWidth}
            height={200}
            barWidth={chartWidth / 4}
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

      {/* Дневник */}
      <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Дневник питания</Text>
        <TouchableOpacity
          style={[styles.selectButton, { borderColor, backgroundColor: cardBg }]}
          onPress={() => setFoodModalVisible(true)}
        >
          <Text style={{ color: selectedFood ? textColor : mutedColor }}>
            {foods.find(f => f.id === selectedFood)?.name ?? 'Выберите продукт'}
          </Text>
        </TouchableOpacity>
        <View style={styles.row}>
          <View style={styles.smallField}>
            <Text style={[styles.label, { color: mutedColor }]}>Граммы</Text>
            <TextInput style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]} keyboardType="numeric" value={grams} onChangeText={setGrams} />
          </View>
          <View style={styles.smallField}>
            <Text style={[styles.label, { color: mutedColor }]}>Приём пищи</Text>
            <TextInput style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]} value={mealType} onChangeText={setMealType} />
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

      {/* Выбор продукта */}
      <Modal visible={foodModalVisible} animationType="slide">
        <View style={{ flex: 1, padding: 16, backgroundColor: cardBg }}>
          <Text style={[styles.modalTitle, { color: textColor }]}>Выберите продукт</Text>
          <TextInput
            style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg, marginBottom: 12 }]}
            placeholder="Поиск..."
            placeholderTextColor={mutedColor}
            value={foodSearchQuery}
            onChangeText={searchFoods}
          />
          <FlatList
            data={filteredFoods}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <View style={[styles.modalItem, { borderBottomColor: borderColor }]}>
                <TouchableOpacity onPress={() => selectFood(item.id)} style={{ flex: 1 }}>
                  <Text style={{ color: textColor }}>{item.name}</Text>
                </TouchableOpacity>
                {item.user_id && (
                  <TouchableOpacity onPress={() => handleDeleteFood(item.id, true)} style={styles.iconButton}>
                    <Ionicons name="trash-outline" size={20} color="#b94a35" />
                  </TouchableOpacity>
                )}
              </View>
            )}
          />
          <TouchableOpacity style={[styles.primaryButton, { marginTop: 12 }]} onPress={() => setFoodModalVisible(false)}>
            <Text style={styles.primaryButtonText}>Закрыть</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Добавление продукта */}
      <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Добавить продукт</Text>
        <TextInput style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]} placeholder="Название" placeholderTextColor={mutedColor} value={foodName} onChangeText={setFoodName} />
        <View style={styles.row}>
          <View style={styles.smallField}>
            <Text style={[styles.label, { color: mutedColor }]}>Ккал на 100г</Text>
            <TextInput style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]} keyboardType="numeric" value={foodCal} onChangeText={setFoodCal} />
          </View>
          <View style={styles.smallField}>
            <Text style={[styles.label, { color: mutedColor }]}>Белки</Text>
            <TextInput style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]} keyboardType="numeric" value={foodProt} onChangeText={setFoodProt} />
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.smallField}>
            <Text style={[styles.label, { color: mutedColor }]}>Жиры</Text>
            <TextInput style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]} keyboardType="numeric" value={foodFat} onChangeText={setFoodFat} />
          </View>
          <View style={styles.smallField}>
            <Text style={[styles.label, { color: mutedColor }]}>Углеводы</Text>
            <TextInput style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]} keyboardType="numeric" value={foodCarbs} onChangeText={setFoodCarbs} />
          </View>
        </View>
        <TouchableOpacity style={styles.primaryButton} onPress={handleAddFood}>
          <Text style={styles.primaryButtonText}>Добавить продукт</Text>
        </TouchableOpacity>
      </View>

      {/* Цель калорий */}
      <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Дневная цель, ккал</Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]}
            keyboardType="numeric"
            value={String(goal)}
            onChangeText={v => setGoal(Number(v) || 0)}
          />
          <TouchableOpacity style={styles.secondaryButton} onPress={handleSaveGoal}>
            <Text style={styles.secondaryButtonText}>Сохранить</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 4 },
  header: { fontSize: 28, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 12 },
  rowMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfMetric: {
    flex: 1,
  },
  section: { borderWidth: 1, borderRadius: 8, padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'center' },
  input: { flex: 1, borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 15 },
  label: { fontSize: 14, marginBottom: 4 },
  smallField: { flex: 1 },
  primaryButton: { backgroundColor: '#2f7d68', borderRadius: 8, padding: 12, alignItems: 'center', marginVertical: 4 },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  secondaryButton: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#dce5df', borderRadius: 8, padding: 10, alignItems: 'center' },
  secondaryButtonText: { color: '#17211f', fontWeight: '600' },
  selectButton: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 8 },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  listTitle: { fontWeight: '600' },
  listDetail: { fontSize: 14 },
  iconButton: { padding: 4 },
  modalTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
});