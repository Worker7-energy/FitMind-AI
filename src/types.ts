export type AuthSession = {
  accessToken: string
  refreshToken: string
  deviceId: string
  userId: string
  email: string
}

export type User = {
  user_id: string
  email: string
  birth_date?: string
  weight?: number
  height?: number
  level?: number
}

export type FitnessProfile = {
  id?: number
  user_id: string
  weight: number
  height: number
  age: number
  sex: string
  activity_level: number
  daily_calories_goal: number
  created_at?: string
}

export type Exercise = {
  id: number
  name: string
  muscle_group: string
  is_custom: boolean
  created_by_user_id?: string
}

export type WorkoutTemplate = {
  id: number
  user_id: string
  name: string
  created_at?: string
}

export type WorkoutExercise = {
  id: number
  template_id: number
  exercise_id: number
  sets: number
  reps: number
  weight: number
  order_index: number
}

export type WorkoutSession = {
  id: number
  user_id: string
  template_id: number
  started_at: string
  completed_at?: string
  duration_minutes: number
}

export type WorkoutResult = {
  id: number
  session_id: number
  exercise_id: number
  sets_done: number
  reps_done: number
  weight_used: number
}

export type FoodItem = {
  id: number
  name: string
  calories: number
  protein: number
  fat: number
  carbs: number
  user_id?: string
}

export type MealLog = {
  id: number
  user_id: string
  food_id: number
  grams: number
  meal_type: string
  date: string
}

export type CalorieGoal = {
  id?: number
  user_id: string
  daily_goal: number
  date: string
}

export type AiWorkoutRequest = {
  user_id: string
  sex: string
  weight: number
  level: string
  goal: string
  limitations: string[]
  equipment: string[]
}

export type AiMealPlanRequest = {
  user_id: string
  calories: number
  preferences: string[]
  diet: string
}

export type OneRmResponse = {
  one_rm: number
  weight: number
  reps: number
  formula: string
  working_weights: Record<string, number>
}

export type WorkingWeightResponse = {
  one_rm: number
  percentage: number
  working_weight: number
  working_weights: Record<string, number>
}

export type AiWorkoutResponse = {
  cooldown: string
  duration_minutes: number
  exercises: {
    muscle_group: string
    name: string
    notes: string
    reps: number
    sets: number
    weight_kg: number
  }[]
}

export type AiMealResponse = {
  daily_calories: number
  protein_g: number
  fat_g: number
  carbs_g: number
  notes: string
  meals: {
    meal_type: string
    total_calories: number
    foods: {
      name: string
      grams: number
      calories: number
      protein: number
      fat: number
      carbs: number
    }[]
  }[]
}