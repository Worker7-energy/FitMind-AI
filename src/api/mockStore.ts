import type {
  AuthSession,
  CalorieGoal,
  Exercise,
  FitnessProfile,
  FoodItem,
  MealLog,
  User,
  WorkoutExercise,
  WorkoutResult,
  WorkoutSession,
  WorkoutTemplate,
} from '../types'

type MockState = {
  users: User[]
  profiles: FitnessProfile[]
  exercises: Exercise[]
  templates: WorkoutTemplate[]
  workoutExercises: WorkoutExercise[]
  sessions: WorkoutSession[]
  results: WorkoutResult[]
  foods: FoodItem[]
  mealLogs: MealLog[]
  calorieGoals: CalorieGoal[]
}

const key = 'fitmind.mock.state'

const today = new Date().toISOString()

const seed: MockState = {
  users: [
    {
      user_id: 'demo-user',
      email: 'demo@fitmind.ai',
      birth_date: '1998-05-21',
      weight: 78,
      height: 180,
      level: 2,
    },
  ],
  profiles: [
    {
      id: 1,
      user_id: 'demo-user',
      weight: 78,
      height: 180,
      age: 28,
      sex: 'male',
      activity_level: 3,
      daily_calories_goal: 2450,
      created_at: today,
    },
  ],
  exercises: [
    { id: 1, name: 'Жим лежа', muscle_group: 'Грудь', is_custom: false },
    { id: 2, name: 'Присед со штангой', muscle_group: 'Ноги', is_custom: false },
    { id: 3, name: 'Тяга верхнего блока', muscle_group: 'Спина', is_custom: false },
    { id: 4, name: 'Планка', muscle_group: 'Кор', is_custom: false },
  ],
  templates: [
    { id: 1, user_id: 'demo-user', name: 'Силовая база', created_at: today },
  ],
  workoutExercises: [
    { id: 1, template_id: 1, exercise_id: 1, sets: 4, reps: 8, weight: 65, order_index: 1 },
    { id: 2, template_id: 1, exercise_id: 2, sets: 4, reps: 6, weight: 90, order_index: 2 },
  ],
  sessions: [
    {
      id: 1,
      user_id: 'demo-user',
      template_id: 1,
      started_at: today,
      completed_at: today,
      duration_minutes: 54,
    },
  ],
  results: [
    { id: 1, session_id: 1, exercise_id: 1, sets_done: 4, reps_done: 8, weight_used: 65 },
  ],
  foods: [
    { id: 1, name: 'Куриная грудка', calories: 165, protein: 31, fat: 3.6, carbs: 0 },
    { id: 2, name: 'Гречка', calories: 343, protein: 13, fat: 3.4, carbs: 72 },
    { id: 3, name: 'Творог 5%', calories: 121, protein: 17, fat: 5, carbs: 2 },
  ],
  mealLogs: [
    { id: 1, user_id: 'demo-user', food_id: 1, grams: 180, meal_type: 'Обед', date: today },
    { id: 2, user_id: 'demo-user', food_id: 2, grams: 120, meal_type: 'Обед', date: today },
  ],
  calorieGoals: [{ id: 1, user_id: 'demo-user', daily_goal: 2450, date: today.slice(0, 10) }],
}

export function readMockState(): MockState {
  const raw = localStorage.getItem(key)
  if (!raw) {
    localStorage.setItem(key, JSON.stringify(seed))
    return structuredClone(seed)
  }
  return JSON.parse(raw) as MockState
}

export function writeMockState(state: MockState) {
  localStorage.setItem(key, JSON.stringify(state))
}

export function nextId(items: Array<{ id?: number }>) {
  return Math.max(0, ...items.map((item) => item.id ?? 0)) + 1
}

export function createMockSession(email = 'demo@fitmind.ai'): AuthSession {
  const state = readMockState()
  let user = state.users.find((item) => item.email === email)
  if (!user) {
    user = { user_id: crypto.randomUUID(), email }
    state.users.push(user)
    writeMockState(state)
  }
  return {
    accessToken: `mock-access-${user.user_id}`,
    refreshToken: `mock-refresh-${user.user_id}`,
    deviceId: localStorage.getItem('fitmind.device_id') ?? crypto.randomUUID(),
    userId: user.user_id,
    email: user.email,
  }
}
