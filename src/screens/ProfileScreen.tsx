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
          value={String(profile.weight)}
          onChangeText={v => setProfile({ ...profile, weight: Number(v) || 0 })}
        />
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: mutedColor }]}>Рост, см</Text>
        <TextInput
          style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]}
          keyboardType="numeric"
          value={String(profile.height)}
          onChangeText={v => setProfile({ ...profile, height: Number(v) || 0 })}
        />
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: mutedColor }]}>Возраст</Text>
        <TextInput
          style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]}
          keyboardType="numeric"
          value={String(profile.age)}
          onChangeText={v => setProfile({ ...profile, age: Number(v) || 0 })}
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
          value={String(profile.activity_level)}
          onChangeText={v => setProfile({ ...profile, activity_level: Number(v) || 1 })}
        />
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: mutedColor }]}>Цель, ккал</Text>
        <TextInput
          style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]}
          keyboardType="numeric"
          value={String(profile.daily_calories_goal)}
          onChangeText={v => setProfile({ ...profile, daily_calories_goal: Number(v) || 0 })}
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