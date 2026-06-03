import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, FlatList, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Slider from '@react-native-community/slider';
import { calculatorApi } from '../api/mainApi';
import { OneRmResponse, WorkingWeightResponse } from '../types';
import NoticeBox from '../components/NoticeBox';
import MetricCard from '../components/MetricCard';
import EmptyState from '../components/EmptyState';
import { useTheme } from '../contexts/ThemeContext';

export default function CalculatorScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();

  const isDark = theme === 'dark';

  const [weight, setWeight] = useState('80');
  const [reps, setReps] = useState('5');
  const [percentage, setPercentage] = useState(75);
  const [oneRm, setOneRm] = useState<OneRmResponse | null>(null);
  const [working, setWorking] = useState<WorkingWeightResponse | null>(null);
  const [notice, setNotice] = useState<any>(null);

  const calculate = async () => {
    setNotice(null);
    try {
      const rm = await calculatorApi.oneRm(Number(weight), Number(reps));
      setOneRm(rm);
      const w = await calculatorApi.workingWeight(rm.one_rm, percentage);
      setWorking(w);
    } catch (e: any) {
      setNotice({ type: 'error', text: e.message });
    }
  };

  const onPercentageChange = (p: number) => {
    setPercentage(p);
    if (oneRm) {
      calculatorApi.workingWeight(oneRm.one_rm, p)
        .then(setWorking)
        .catch(() => {});
    }
  };

  const getDisplayData = (workingWeights: Record<string, number>) => {
    const entries = Object.entries(workingWeights).map(([key, value]) => {
      let percent = 0;
      let label = key;
      const match = key.match(/\d+/);
      if (match) {
        percent = parseInt(match[0], 10);
        if (percent === 50) label = 'Разминка 50%';
        else if (percent === 60) label = 'Разминка 60%';
        else if (percent === 65) label = 'Легко 65%';
        else if (percent === 70) label = 'Умеренно 70%';
        else if (percent === 75) label = 'Средне 75%';
        else if (percent === 80) label = 'Тяжело 80%';
        else if (percent === 85) label = 'Очень тяжело 85%';
        else if (percent === 90) label = 'Максимум 90%';
        else if (percent === 95) label = 'Почти максимум 95%';
        else label = `${percent}%`;
      }
      return { percent, label, value };
    });
    entries.sort((a, b) => a.percent - b.percent);
    return entries;
  };

  const bgColor = isDark ? '#111816' : '#f4f6f4';
  const cardBg = isDark ? '#17211f' : '#fff';
  const textColor = isDark ? '#edf5f1' : '#17211f';
  const mutedColor = isDark ? '#9cafaa' : '#66736f';
  const borderColor = isDark ? '#2d413b' : '#dce5df';

  return (
    <ScrollView style={[styles.container, { backgroundColor: bgColor }]} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.header, { color: textColor }]}>Калькулятор нагрузок</Text>
        <View style={styles.placeholder} />
      </View>

      <NoticeBox notice={notice} />

      <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Введите данные</Text>
        <View style={styles.row}>
          <View style={styles.smallField}>
            <Text style={[styles.label, { color: mutedColor }]}>Вес, кг</Text>
            <TextInput
              style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]}
              keyboardType="numeric"
              value={weight}
              onChangeText={setWeight}
            />
          </View>
          <View style={styles.smallField}>
            <Text style={[styles.label, { color: mutedColor }]}>Повторы</Text>
            <TextInput
              style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]}
              keyboardType="numeric"
              value={reps}
              onChangeText={setReps}
            />
          </View>
        </View>
        <View style={styles.field}>
          <Text style={[styles.label, { color: mutedColor }]}>Интенсивность: {percentage}%</Text>
          <Slider
            style={{ width: '100%', height: 40 }}
            minimumValue={50}
            maximumValue={100}
            step={1}
            value={percentage}
            onValueChange={onPercentageChange}
            minimumTrackTintColor="#2f7d68"
            maximumTrackTintColor={borderColor}
          />
        </View>
        <TouchableOpacity style={styles.primaryButton} onPress={calculate}>
          <Text style={styles.primaryButtonText}>Рассчитать</Text>
        </TouchableOpacity>
      </View>

      {oneRm ? (
        <>
          <View style={styles.metricsRow}>
            <MetricCard title="Расчетный 1ПМ" value={`${oneRm.one_rm} кг`} caption={oneRm.formula} />
            <MetricCard title="Рабочий вес" value={`${working?.working_weight ?? 0} кг`} caption={`${percentage}% от 1ПМ`} />
          </View>
          <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Рабочие веса по процентам</Text>
            <FlatList
              data={getDisplayData(oneRm.working_weights)}
              keyExtractor={(item) => item.label}
              renderItem={({ item }) => (
                <View style={[styles.listItem, { borderBottomColor: borderColor }]}>
                  <Text style={[styles.listTitle, { color: textColor }]}>{item.label}</Text>
                  <Text style={[styles.listDetail, { color: mutedColor }]}>{item.value} кг</Text>
                </View>
              )}
              scrollEnabled={false}
            />
          </View>
        </>
      ) : (
        <EmptyState title="Введите вес и повторы" text="Результаты появятся после расчета" />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 16 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backButton: { padding: 4 },
  header: { fontSize: 28, fontWeight: '700', textAlign: 'center', flex: 1 },
  placeholder: { width: 32 },
  section: { borderWidth: 1, borderRadius: 8, padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  smallField: { flex: 1 },
  field: { marginBottom: 10 },
  input: { borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 15 },
  label: { fontSize: 14, marginBottom: 4 },
  primaryButton: { backgroundColor: '#2f7d68', borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 8 },
  primaryButtonText: { color: '#fff', fontWeight: '700' },
  metricsRow: { flexDirection: 'row', gap: 8 },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1 },
  listTitle: { fontWeight: '600' },
  listDetail: { fontSize: 14 },
});