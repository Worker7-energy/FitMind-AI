import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface FoodItem {
  name: string;
  grams: number;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

interface Meal {
  meal_type: string;
  foods: FoodItem[];
  total_calories: number;
}

interface MealPlan {
  daily_calories: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  meals: Meal[];
  notes: string;
}

interface MealPlanViewProps {
  plan: MealPlan;
  onAddFood?: (food: FoodItem, mealType: string) => void;
  onAddMeal?: (meal: Meal) => void;
  onAddWholeMealPlan?: () => void;
}

export default function MealPlanView({ plan, onAddFood, onAddMeal, onAddWholeMealPlan }: MealPlanViewProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const bgColor = isDark ? '#17211f' : '#fff';
  const textColor = isDark ? '#edf5f1' : '#17211f';
  const mutedColor = isDark ? '#9cafaa' : '#66736f';
  const borderColor = isDark ? '#2d413b' : '#dce5df';

  return (
    <View style={[styles.container, { backgroundColor: bgColor, borderColor }]}>
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <Text style={[styles.title, { color: textColor }]}>План питания</Text>
        <Text style={[styles.macros, { color: mutedColor }]}>
          {plan.daily_calories} ккал · Б: {plan.protein_g}г · Ж: {plan.fat_g}г · У: {plan.carbs_g}г
        </Text>
      </View>

      {plan.meals.map((meal, idx) => (
        <View key={idx} style={[styles.mealCard, { borderColor, backgroundColor: isDark ? '#1c2926' : '#f8faf8' }]}>
          <View style={styles.mealHeader}>
            <Text style={[styles.mealTitle, { color: textColor }]}>{meal.meal_type}</Text>
            <Text style={[styles.mealCalories, { color: mutedColor }]}>{meal.total_calories} ккал</Text>
            {onAddMeal && (
              <TouchableOpacity style={styles.addMealButton} onPress={() => onAddMeal(meal)}>
                <Text style={styles.addMealButtonText}>+ Приём</Text>
              </TouchableOpacity>
            )}
          </View>
          {meal.foods.map((food, fidx) => (
            <View key={fidx} style={styles.foodRow}>
              <Text style={[styles.foodName, { color: textColor }]}>{food.name}</Text>
              <Text style={[styles.foodDetails, { color: mutedColor }]}>
                {food.grams} г · {food.calories} ккал
              </Text>
              <Text style={[styles.foodMacros, { color: mutedColor }]}>
                Б: {food.protein}г · Ж: {food.fat}г · У: {food.carbs}г
              </Text>
              {onAddFood && (
                <TouchableOpacity style={styles.addFoodButton} onPress={() => onAddFood(food, meal.meal_type)}>
                  <Text style={styles.addFoodButtonText}>Добавить</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      ))}

      {plan.notes && (
        <View style={[styles.notesSection, { borderTopColor: borderColor }]}>
          <Text style={[styles.notesText, { color: mutedColor }]}>{plan.notes}</Text>
        </View>
      )}

      {onAddWholeMealPlan && (
        <TouchableOpacity style={styles.wholeButton} onPress={onAddWholeMealPlan}>
          <Text style={styles.wholeButtonText}>Добавить весь рацион</Text>
        </TouchableOpacity>
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
  macros: {
    fontSize: 14,
    marginTop: 4,
  },
  mealCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  mealCalories: {
    fontSize: 14,
  },
  addMealButton: {
    backgroundColor: '#2f7d68',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  addMealButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  foodRow: {
    marginBottom: 8,
    paddingLeft: 8,
  },
  foodName: {
    fontSize: 14,
    fontWeight: '500',
  },
  foodDetails: {
    fontSize: 12,
  },
  foodMacros: {
    fontSize: 11,
  },
  addFoodButton: {
    marginTop: 4,
    backgroundColor: '#2f7d68',
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
  },
  addFoodButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  notesSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  notesText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  wholeButton: {
    marginTop: 16,
    backgroundColor: '#2f7d68',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  wholeButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});