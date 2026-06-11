import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface Exercise {
  name: string;
  muscle_group: string;
  sets: number;
  reps: number;
  weight_kg: number;
  notes: string;
}

interface WorkoutPlan {
  name: string;
  goal: string;
  exercises: Exercise[];
  warmup: string;
  cooldown: string;
  duration_minutes: number;
  notes: string;
}

export default function WorkoutPlanView({ plan }: { plan: WorkoutPlan }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const bgColor = isDark ? '#17211f' : '#fff';
  const textColor = isDark ? '#edf5f1' : '#17211f';
  const mutedColor = isDark ? '#9cafaa' : '#66736f';
  const borderColor = isDark ? '#2d413b' : '#dce5df';

  return (
    <View style={[styles.container, { backgroundColor: bgColor, borderColor }]}>
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <Text style={[styles.title, { color: textColor }]}>{plan.name}</Text>
        <Text style={[styles.subtitle, { color: mutedColor }]}>Цель: {plan.goal}</Text>
        <Text style={[styles.duration, { color: mutedColor }]}>⏱ {plan.duration_minutes} мин</Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Разминка</Text>
        <Text style={[styles.sectionText, { color: mutedColor }]}>{plan.warmup}</Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Упражнения</Text>
        {plan.exercises.map((ex, idx) => (
          <View key={idx} style={[styles.exerciseCard, { borderColor, backgroundColor: isDark ? '#1c2926' : '#f8faf8' }]}>
            <Text style={[styles.exerciseName, { color: textColor }]}>{ex.name}</Text>
            <Text style={[styles.exerciseMeta, { color: mutedColor }]}>
              {ex.sets} x {ex.reps} · {ex.weight_kg} кг · {ex.muscle_group}
            </Text>
            <Text style={[styles.exerciseNotes, { color: mutedColor }]}>{ex.notes}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Заминка</Text>
        <Text style={[styles.sectionText, { color: mutedColor }]}>{plan.cooldown}</Text>
      </View>

      {plan.notes && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Примечания</Text>
          <Text style={[styles.sectionText, { color: mutedColor }]}>{plan.notes}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    marginTop: 12,
  },
  header: {
    borderBottomWidth: 1,
    paddingBottom: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  duration: {
    fontSize: 14,
    marginTop: 2,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  exerciseCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '600',
  },
  exerciseMeta: {
    fontSize: 13,
    marginTop: 4,
  },
  exerciseNotes: {
    fontSize: 13,
    marginTop: 4,
    fontStyle: 'italic',
  },
});