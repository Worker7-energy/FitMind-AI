import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../auth/AuthContext';
import { profileApi } from '../api/mainApi';
import { FitnessProfile } from '../types';
import NoticeBox from '../components/NoticeBox';
import { useTheme } from '../contexts/ThemeContext';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { session } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const userId = session?.userId ?? '';

  const [profile, setProfile] = useState<FitnessProfile>({
    user_id: userId,
    weight: 75,
    height: 175,
    age: 25,
    sex: 'male',
    activity_level: 3,
    daily_calories_goal: 2300,
  });
  const [notice, setNotice] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    profileApi.get(userId).then(data => data && setProfile(data)).catch(() => {});
  }, [userId]);

  const save = async () => {
    setNotice(null);
    setSaving(true);
    try {
      await profileApi.save({ ...profile, user_id: userId });
      setNotice({ type: 'success', text: 'Профиль сохранен.' });
    } catch (e: any) {
      setNotice({ type: 'error', text: e.message });
    } finally {
      setSaving(false);
    }
  };

  const handleNumberChange = (field: keyof FitnessProfile, value: string) => {
    const num = value === '' ? 0 : Number(value);
    setProfile({ ...profile, [field]: num });
  };

  const validateWeight = () => {
    const min = 30;
    if (profile.weight < min) {
      setProfile({ ...profile, weight: min });
      setNotice({ type: 'error', text: `Минимальное значение для поля "Вес" — ${min} кг.` });
    }
  };

  const validateHeight = () => {
    const min = 100;
    if (profile.height < min) {
      setProfile({ ...profile, height: min });
      setNotice({ type: 'error', text: `Минимальное значение для поля "Рост" — ${min} см.` });
    }
  };

  const validateAge = () => {
    const min = 12;
    if (profile.age < min) {
      setProfile({ ...profile, age: min });
      setNotice({ type: 'error', text: `Минимальное значение для поля "Возраст" — ${min} лет. ` });
    }
  };

  const validateActivityLevel = () => {
    const min = 1;
    const max = 5;
    let corrected = false;
    let newValue = profile.activity_level;
    if (profile.activity_level < min) {
      newValue = min;
      corrected = true;
    } else if (profile.activity_level > max) {
      newValue = max;
      corrected = true;
    }
    if (corrected) {
      setProfile({ ...profile, activity_level: newValue });
      setNotice({ type: 'error', text: `Значение "Активность" должно быть в диапазоне от ${min} до ${max}.` });
    }
  };

  const validateCaloriesGoal = () => {
    const min = 900;
    if (profile.daily_calories_goal < min) {
      setProfile({ ...profile, daily_calories_goal: min });
      setNotice({ type: 'error', text: `Минимальное значение для поля "Цель" — ${min} ккал.` });
    }
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
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.header, { color: textColor }]}>Профиль</Text>
        <View style={styles.placeholder} />
      </View>

      <NoticeBox notice={notice} />

      <View style={styles.field}>
        <Text style={[styles.label, { color: mutedColor }]}>Вес, кг</Text>
        <TextInput
          style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]}
          keyboardType="numeric"
          value={profile.weight === 0 ? '' : String(profile.weight)}
          onChangeText={value => handleNumberChange('weight', value)}
          onBlur={validateWeight}
        />
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: mutedColor }]}>Рост, см</Text>
        <TextInput
          style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]}
          keyboardType="numeric"
          value={profile.height === 0 ? '' : String(profile.height)}
          onChangeText={value => handleNumberChange('height', value)}
          onBlur={validateHeight}
        />
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: mutedColor }]}>Возраст</Text>
        <TextInput
          style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]}
          keyboardType="numeric"
          value={profile.age === 0 ? '' : String(profile.age)}
          onChangeText={value => handleNumberChange('age', value)}
          onBlur={validateAge}
        />
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: mutedColor }]}>Пол</Text>
        <View style={styles.segmented}>
          <TouchableOpacity
            style={[styles.segBtn, { backgroundColor: segBg }, profile.sex === 'male' && styles.segActive]}
            onPress={() => setProfile({ ...profile, sex: 'male' })}
          >
            <Text style={[styles.segText, { color: segTextColor }, profile.sex === 'male' && styles.segTextActive]}>Муж</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segBtn, { backgroundColor: segBg }, profile.sex === 'female' && styles.segActive]}
            onPress={() => setProfile({ ...profile, sex: 'female' })}
          >
            <Text style={[styles.segText, { color: segTextColor }, profile.sex === 'female' && styles.segTextActive]}>Жен</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: mutedColor }]}>Активность (1-5)</Text>
        <TextInput
          style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]}
          keyboardType="numeric"
          value={profile.activity_level === 0 ? '' : String(profile.activity_level)}
          onChangeText={value => handleNumberChange('activity_level', value)}
          onBlur={validateActivityLevel}
        />
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: mutedColor }]}>Цель, ккал</Text>
        <TextInput
          style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]}
          keyboardType="numeric"
          value={profile.daily_calories_goal === 0 ? '' : String(profile.daily_calories_goal)}
          onChangeText={value => handleNumberChange('daily_calories_goal', value)}
          onBlur={validateCaloriesGoal}
        />
      </View>

      <TouchableOpacity style={[styles.button, { backgroundColor: '#2f7d68' }]} onPress={save} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Сохранить</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 12 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backButton: { padding: 4 },
  header: { fontSize: 28, fontWeight: '700', textAlign: 'center', flex: 1 },
  placeholder: { width: 32 },
  field: { gap: 4, marginBottom: 8 },
  label: { fontSize: 14 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16 },
  segmented: { flexDirection: 'row', gap: 8, marginTop: 4 },
  segBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  segActive: { backgroundColor: '#2f7d68' },
  segText: { fontWeight: '600' },
  segTextActive: { color: '#fff' },
  button: { borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});