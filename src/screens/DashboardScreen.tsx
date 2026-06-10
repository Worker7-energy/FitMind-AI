import React, { useEffect, useState, useMemo } from 'react';
import { ScrollView, View, Text, StyleSheet, Dimensions, RefreshControl } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { useCatalog } from '../contexts/CatalogContext';
import { profileApi, workoutsApi, foodApi } from '../api/mainApi';
import { FitnessProfile, WorkoutTemplate, WorkoutSession, MealLog, CalorieGoal } from '../types';
import MetricCard from '../components/MetricCard';
import EmptyState from '../components/EmptyState';
import NoticeBox from '../components/NoticeBox';
import { LineChart, CurveType } from 'react-native-gifted-charts';
import { useTheme } from '../contexts/ThemeContext';

export default function DashboardScreen() {
  const { session } = useAuth();
  const { foods } = useCatalog();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const userId = session?.userId ?? '';
  const [profile, setProfile] = useState<FitnessProfile | null>(null);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [logs, setLogs] = useState<MealLog[]>([]);
  const [goal, setGoal] = useState<CalorieGoal | null>(null);
  const [notice, setNotice] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [p, t, s, l, g] = await Promise.all([
        profileApi.get(userId).catch(() => null),
        workoutsApi.templates(userId),
        workoutsApi.sessions(userId),
        foodApi.logs(userId),
        foodApi.goal(userId).catch(() => null),
      ]);
      setProfile(p);
      setTemplates(t);
      setSessions(s);
      setLogs(l);
      setGoal(g);
    } catch (e: any) {
      setNotice({ type: 'error', text: e.message });
    }
  };

  useEffect(() => { load(); }, [userId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const calories = useMemo(() => {
    return logs.reduce((acc, log) => {
      const food = foods.find(f => f.id === log.food_id);
      if (!food) return acc;
      const factor = log.grams / 100;
      return {
        calories: acc.calories + food.calories * factor,
        protein: acc.protein + food.protein * factor,
        fat: acc.fat + food.fat * factor,
        carbs: acc.carbs + food.carbs * factor,
      };
    }, { calories: 0, protein: 0, fat: 0, carbs: 0 });
  }, [foods, logs]);

  const chartData = useMemo(() => {
    const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    const data = days.map(day => ({ label: day, value: 0 }));
    sessions.forEach(s => {
      const d = new Date(s.completed_at ?? s.started_at);
      const idx = (d.getDay() + 6) % 7;
      data[idx].value += s.duration_minutes || 0;
    });
    return data;
  }, [sessions]);

  const calorieGoal = goal?.daily_goal ?? profile?.daily_calories_goal ?? 0;

  const lastSession = useMemo(() => {
    const completedSessions = sessions
      .filter(s => s.completed_at)
      .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime());
    return completedSessions[0];
  }, [sessions]);

  const lastSessionTemplateName = lastSession
    ? templates.find(t => t.id === lastSession.template_id)?.name || 'Удалённый шаблон'
    : null;

  const bgColor = isDark ? '#111816' : '#f4f6f4';
  const cardBg = isDark ? '#17211f' : '#fff';
  const textColor = isDark ? '#edf5f1' : '#17211f';
  const mutedColor = isDark ? '#9cafaa' : '#66736f';
  const borderColor = isDark ? '#2d413b' : '#dce5df';

  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 120; 
  const chartSpacing = (chartWidth - 20) / (chartData.length - 1); 

  const verticalLinesIndices = chartData.map((_, i) => i);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: bgColor }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View>
        <Text style={[styles.header, { color: textColor }]}>Главная</Text>
        <Text style={[styles.subtitle, { color: mutedColor }]}>Ваш текущий прогресс без лишнего шума.</Text>
      </View>
      <NoticeBox notice={notice} />

      <MetricCard
        title="Калории сегодня"
        value={calorieGoal ? `${Math.round(calories.calories)} / ${calorieGoal}` : `${Math.round(calories.calories)} ккал`}
        caption={calorieGoal ? 'по дневной цели' : 'цель не задана'}
      />

      <View style={styles.row}>
        <View style={styles.halfWidth}>
          <MetricCard title="Шаблоны" value={String(templates.length)} caption="готовых тренировок" />
        </View>
        <View style={styles.halfWidth}>
          <MetricCard title="История" value={String(sessions.length)} caption="тренировочных сессий" />
        </View>
      </View>

      <MetricCard
        title="Профиль"
        value={profile ? `${profile.weight} кг` : 'не заполнен'}
        caption={profile ? `${profile.height} см, ${profile.age} лет` : 'добавьте данные'}
      />

      <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Активность текущей недели</Text>
        {sessions.length ? (
          <LineChart
            areaChart
            curved
            data={chartData}
            width={chartWidth}
            height={220}
            color="#2f7d68"
            startFillColor="#b9e6d5"
            endFillColor="#b9e6d5"
            startOpacity={0.5}
            endOpacity={0.4}
            spacing={chartSpacing}
			initialSpacing={10}
            xAxisLabelTextStyle={{ color: mutedColor, fontSize: 10 }}
            yAxisTextStyle={{ color: mutedColor, fontSize: 10 }}
            dataPointsColor="#2f7d68"
            dataPointsRadius={3}
            xAxisColor={borderColor}
            yAxisColor={borderColor}
            adjustToWidth
            curveType={CurveType.QUADRATIC}
            showVerticalLines={true}
            verticalLinesColor={borderColor}
            verticalLinesStrokeDashArray={[4, 4]}
            verticalLinesIndices={verticalLinesIndices}
            horizontalLinesColor={borderColor}
            horizontalLinesStrokeDashArray={[4, 4]}
          />
        ) : (
          <EmptyState title="Пока нет тренировок" text="Когда вы завершите первую тренировку, здесь появится график." />
        )}
      </View>

      <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Последняя тренировка</Text>
        {lastSession ? (
          <View style={[styles.listItem, { borderBottomColor: borderColor }]}>
            <Text style={[styles.listTitle, { color: textColor }]}>
              Сессия #{lastSession.id} ({lastSessionTemplateName})
            </Text>
            <Text style={[styles.listDetail, { color: mutedColor }]}>{lastSession.duration_minutes} мин</Text>
          </View>
        ) : (
          <EmptyState title="История пуста" text="Создайте шаблон и завершите тренировку." />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 4 },
  header: { fontSize: 28, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  halfWidth: { flex: 1 },
  section: { borderWidth: 1, borderRadius: 8, padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1 },
  listTitle: { fontWeight: '600', flexShrink: 1, marginRight: 8 },
  listDetail: { fontSize: 14 },
});