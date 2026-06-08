import { ApiRequestError, mainRequest, useMocks } from './client'
import { nextId, readMockState, writeMockState } from './mockStore'
import type {
  AiMealPlanRequest,
  AiWorkoutRequest,
  CalorieGoal,
  Exercise,
  FitnessProfile,
  FoodItem,
  MealLog,
  OneRmResponse,
  WorkingWeightResponse,
  WorkoutExercise,
  WorkoutResult,
  WorkoutSession,
  WorkoutTemplate,
  AiMealResponse,
  AiWorkoutResponse,
} from '../types'

const todayKey = () => new Date().toISOString().slice(0, 10)
const asArray = <T>(value: T[] | null | undefined): T[] => value ?? []

const defaultExerciseCatalog = [
  { name: 'Жим лежа', muscle_group: 'Грудь' },
  { name: 'Присед со штангой', muscle_group: 'Ноги' },
  { name: 'Становая тяга', muscle_group: 'Спина' },
  { name: 'Тяга верхнего блока', muscle_group: 'Спина' },
  { name: 'Жим гантелей сидя', muscle_group: 'Плечи' },
  { name: 'Выпады с гантелями', muscle_group: 'Ноги' },
  { name: 'Подтягивания', muscle_group: 'Спина' },
  { name: 'Планка', muscle_group: 'Кор' },
  { name: 'Сгибание рук с гантелями', muscle_group: 'Руки' },
  { name: 'Разгибание рук на блоке', muscle_group: 'Руки' },
]

function uniqueExercises(items: Exercise[]) {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = `${item.name.trim().toLowerCase()}::${item.muscle_group.trim().toLowerCase()}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function isNotFound(error: unknown) {
  return error instanceof ApiRequestError && error.status === 404
}

export const profileApi = {
  async get(userId: string) {
    if (!userId) return null
    if (useMocks) return readMockState().profiles.find((item) => item.user_id === userId) ?? null
    try {
      return await mainRequest<FitnessProfile>(`/fitness_profile/${userId}`)
    } catch (error) {
      if (isNotFound(error)) return null
      throw error
    }
  },

  async save(profile: FitnessProfile) {
    if (useMocks) {
      const state = readMockState()
      const existing = state.profiles.find((item) => item.user_id === profile.user_id)
      if (existing) Object.assign(existing, profile)
      else state.profiles.push({ ...profile, id: nextId(state.profiles), created_at: new Date().toISOString() })
      writeMockState(state)
      return
    }

    const existing = await this.get(profile.user_id)
    await mainRequest(existing ? `/fitness_profile/${profile.user_id}` : '/create_fitness_profile', {
      method: existing ? 'PATCH' : 'POST',
      body: profile,
    })
  },
}

export const exercisesApi = {
  async list(userId?: string) {
    if (useMocks) return uniqueExercises(readMockState().exercises)
    const url = userId 
      ? `/exercises?user_id=${encodeURIComponent(userId)}`
      : '/exercises'
    return uniqueExercises(asArray(await mainRequest<Exercise[] | null>(url)))
  },

  async search(query: string) {
    if (useMocks) {
      return uniqueExercises(
        readMockState().exercises.filter((item) => item.name.toLowerCase().includes(query.toLowerCase())),
      )
    }
    return uniqueExercises(asArray(await mainRequest<Exercise[] | null>(`/exercises/search?q=${encodeURIComponent(query)}`)))
  },

  async create(input: Omit<Exercise, 'id'>) {
    if (useMocks) {
      const state = readMockState()
      const exercise = { ...input, id: nextId(state.exercises) }
      state.exercises.push(exercise)
      writeMockState(state)
      return exercise
    }
    const data = await mainRequest<{ id: number }>('/exercises', { method: 'POST', body: input })
    return { ...input, id: data.id }
  },

  async ensureCatalog(userId?: string) {
    const current = await this.list()
    if (!useMocks) return current

    const normalized = new Set(current.map((item) => item.name.trim().toLowerCase()))
    const missing = defaultExerciseCatalog.filter((item) => !normalized.has(item.name.toLowerCase()))
    if (!missing.length) return current

    const created = missing.map((item) => {
      const state = readMockState()
      const exercise = {
        ...item,
        id: nextId(state.exercises),
        is_custom: false,
        created_by_user_id: userId,
      }
      state.exercises.push(exercise)
      writeMockState(state)
      return exercise
    })

    return uniqueExercises([...current, ...created])
  },
}

export const workoutsApi = {
  async templates(userId: string) {
    if (!userId) return []
    if (useMocks) return readMockState().templates.filter((item) => item.user_id === userId)
    return asArray(await mainRequest<WorkoutTemplate[] | null>(`/workouts/templates/user/${userId}`))
  },

  async templateDetails(id: number) {
    if (useMocks) {
      const state = readMockState()
      return {
        template: state.templates.find((item) => item.id === id),
        exercises: state.workoutExercises.filter((item) => item.template_id === id),
      }
    }
    const details = await mainRequest<{ template: WorkoutTemplate; exercises: WorkoutExercise[] | null }>(`/workouts/templates/${id}`)
    return { ...details, exercises: asArray(details.exercises) }
  },

  async createTemplate(userId: string, name: string) {
    if (useMocks) {
      const state = readMockState()
      const template = { id: nextId(state.templates), user_id: userId, name, created_at: new Date().toISOString() }
      state.templates.push(template)
      writeMockState(state)
      return template
    }
    const data = await mainRequest<{ id: number }>('/workouts/templates', {
      method: 'POST',
      body: { user_id: userId, name },
    })
    return { id: data.id, user_id: userId, name }
  },

  async addExercise(input: Omit<WorkoutExercise, 'id'>) {
    if (useMocks) {
      const state = readMockState()
      const item = { ...input, id: nextId(state.workoutExercises) }
      state.workoutExercises.push(item)
      writeMockState(state)
      return item
    }
    const data = await mainRequest<{ id: number }>('/workouts/exercises', { method: 'POST', body: input })
    return { ...input, id: data.id }
  },

  async sessions(userId: string) {
    if (!userId) return []
    if (useMocks) return readMockState().sessions.filter((item) => item.user_id === userId)
    return asArray(await mainRequest<WorkoutSession[] | null>(`/workouts/sessions/user/${userId}`))
  },

  async startSession(userId: string, templateId: number) {
    if (useMocks) {
      const state = readMockState()
      const session = {
        id: nextId(state.sessions),
        user_id: userId,
        template_id: templateId,
        started_at: new Date().toISOString(),
        duration_minutes: 0,
      }
      state.sessions.push(session)
      writeMockState(state)
      return session
    }
    const data = await mainRequest<{ session_id: number }>('/workouts/sessions', {
      method: 'POST',
      body: { user_id: userId, template_id: templateId },
    })
    return { id: data.session_id, user_id: userId, template_id: templateId, started_at: new Date().toISOString(), duration_minutes: 0 }
  },

  async completeSession(id: number, duration: number) {
    if (useMocks) {
      const state = readMockState()
      const session = state.sessions.find((item) => item.id === id)
      if (session) {
        session.completed_at = new Date().toISOString()
        session.duration_minutes = duration
      }
      writeMockState(state)
      return
    }
    await mainRequest(`/workouts/sessions/${id}/complete`, { method: 'POST', body: { duration_minutes: duration } })
  },

  async saveResult(input: Omit<WorkoutResult, 'id'>) {
    if (useMocks) {
      const state = readMockState()
      state.results.push({ ...input, id: nextId(state.results) })
      writeMockState(state)
      return
    }
    await mainRequest('/workouts/results', { method: 'POST', body: input })
  },
  
    async deleteTemplate(templateId: number) {
      await mainRequest(`/workouts/templates/${templateId}`, { method: 'DELETE' })
    },

    async deleteExerciseFromTemplate(workoutExerciseId: number) {
      await mainRequest(`/workouts/exercises/${workoutExerciseId}`, { method: 'DELETE' })
    },
}

export const foodApi = {
  async list(userId: string) {
    if (!userId) return []
    if (useMocks) return readMockState().foods.filter((item) => !item.user_id || item.user_id === userId)
    return asArray(await mainRequest<FoodItem[] | null>(`/food?user_id=${encodeURIComponent(userId)}`))
  },

  async create(input: Omit<FoodItem, 'id'>) {
    if (useMocks) {
      const state = readMockState()
      const item = { ...input, id: nextId(state.foods) }
      state.foods.push(item)
      writeMockState(state)
      return item
    }
    const data = await mainRequest<{ id: number }>('/food', { method: 'POST', body: input })
    return { ...input, id: data.id }
  },

  async logs(userId: string, date = todayKey()) {
    if (!userId) return []
    if (useMocks) return readMockState().mealLogs.filter((item) => item.user_id === userId && item.date.slice(0, 10) === date)
    return asArray(await mainRequest<MealLog[] | null>(`/meal-logs?user_id=${encodeURIComponent(userId)}&date=${date}`))
  },

  async addLog(input: Omit<MealLog, 'id' | 'date'>) {
    if (useMocks) {
      const state = readMockState()
      const item = { ...input, id: nextId(state.mealLogs), date: new Date().toISOString() }
      state.mealLogs.push(item)
      writeMockState(state)
      return item
    }
    const data = await mainRequest<{ id: number }>('/meal-logs', { method: 'POST', body: input })
    return { ...input, id: data.id, date: new Date().toISOString() }
  },

  async setGoal(goal: CalorieGoal) {
    if (useMocks) {
      const state = readMockState()
      const existing = state.calorieGoals.find((item) => item.user_id === goal.user_id && item.date === goal.date)
      if (existing) existing.daily_goal = goal.daily_goal
      else state.calorieGoals.push({ ...goal, id: nextId(state.calorieGoals) })
      writeMockState(state)
      return
    }
    await mainRequest('/calorie-goals', { method: 'POST', body: goal })
  },

  async goal(userId: string, date = todayKey()) {
    if (!userId) return null
    if (useMocks) return readMockState().calorieGoals.find((item) => item.user_id === userId && item.date === date) ?? null
    try {
      return await mainRequest<CalorieGoal>(`/calorie-goals?user_id=${encodeURIComponent(userId)}&date=${date}`)
    } catch (error) {
      if (isNotFound(error)) return null
      throw error
    }
  },
}

export const aiApi = {
  async workout(input: AiWorkoutRequest) {
    if (useMocks) {
      return {
        note: 'Демо-режим включен. Генерация AI недоступна без реального сервиса.',
        exercises: [],
      }
    }
    return mainRequest<{ note?: string; error?: string; exercises?: unknown[]; raw?: string }>('/ai/generate-workout', {
      method: 'POST',
      body: input,
    })
  },

  async mealPlan(input: AiMealPlanRequest) {
    if (useMocks) {
      return {
        note: 'Демо-режим включен. Генерация AI недоступна без реального сервиса.',
        meals: [],
      }
    }
    return mainRequest<{ note?: string; error?: string; meals?: unknown[]; raw?: string }>('/ai/generate-meal-plan', {
      method: 'POST',
      body: input,
    })
  },
}

export const calculatorApi = {
  async oneRm(weight: number, reps: number) {
    if (useMocks) {
      const oneRm = Math.round(weight * (1 + reps / 30) * 100) / 100
      return { one_rm: oneRm, weight, reps, formula: 'Epley', working_weights: workingWeights(oneRm) }
    }
    return mainRequest<OneRmResponse>(`/calculator/1rm?weight=${weight}&reps=${reps}`)
  },

  async workingWeight(oneRm: number, percentage: number) {
    if (useMocks) {
      return {
        one_rm: oneRm,
        percentage,
        working_weight: Math.round((oneRm * percentage) / 100 * 100) / 100,
        working_weights: workingWeights(oneRm),
      }
    }
    return mainRequest<WorkingWeightResponse>('/calculator/working-weight', {
      method: 'POST',
      body: { one_rm: oneRm, percentage },
    })
  },
}

function workingWeights(oneRm: number) {
  const keys = [
    ['warmup_50', 50],
    ['warmup_60', 60],
    ['light_65', 65],
    ['moderate_70', 70],
    ['medium_75', 75],
    ['heavy_80', 80],
    ['very_heavy_85', 85],
    ['max_effort_90', 90],
    ['near_max_95', 95],
  ] as const

  return Object.fromEntries(keys.map(([key, value]) => [key, Math.round((oneRm * value) / 100 * 100) / 100]))
}

export async function saveAiWorkout(
  userId: string,
  workout: AiWorkoutResponse,
  templateName = 'AI Тренировка',
) {
  const template = await workoutsApi.createTemplate(
    userId,
    `${templateName} ${new Date().toLocaleDateString()}`,
  )

  const catalog = await exercisesApi.list(userId)

  for (let i = 0; i < workout.exercises.length; i++) {
    const aiExercise = workout.exercises[i]

    let exercise = catalog.find(
      (item) =>
        item.name.toLowerCase() === aiExercise.name.toLowerCase(),
    )

    if (!exercise) {
      exercise = await exercisesApi.create({
        name: aiExercise.name,
        muscle_group: aiExercise.muscle_group,
        is_custom: true,
        created_by_user_id: userId,
      })
    }

    await workoutsApi.addExercise({
      template_id: template.id,
      exercise_id: exercise.id,
      sets: aiExercise.sets,
      reps: aiExercise.reps,
      weight: aiExercise.weight_kg,
      order_index: i,
    })
  }

  return template
}

export async function saveAiFood(
  userId: string,
  food: {
    name: string
    calories: number
    protein: number
    fat: number
    carbs: number
    grams: number
  },
  mealType: string,
) {
  const createdFood = await foodApi.create({
    name: food.name,
    calories: food.calories,
    protein: food.protein,
    fat: food.fat,
    carbs: food.carbs,
    user_id: userId,
  })

  await foodApi.addLog({
    user_id: userId,
    food_id: createdFood.id,
    grams: food.grams,
    meal_type: mealType,
  })

  return createdFood
}

export async function saveAiMealPlan(
  userId: string,
  mealPlan: AiMealResponse,
) {
  for (const meal of mealPlan.meals) {
    for (const food of meal.foods) {
      await saveAiFood(
        userId,
        food,
        meal.meal_type,
      )
    }
  }
}

export async function saveSingleAiExercise(
  userId: string,
  exercise: AiWorkoutResponse['exercises'][number],
) {
  // Проверяем, существует ли уже такое упражнение в каталоге
  let catalogExercise = (
    await exercisesApi.list(userId)
  ).find(
    (item) =>
      item.name.toLowerCase() === exercise.name.toLowerCase(),
  )

  // Если не существует — создаём
  if (!catalogExercise) {
    catalogExercise = await exercisesApi.create({
      name: exercise.name,
      muscle_group: exercise.muscle_group,
      is_custom: true,
      created_by_user_id: userId,
    })
  }

  // Возвращаем созданное/найденное упражнение (можно и ничего не возвращать)
  return catalogExercise
}

export async function findFoodByName(
  userId: string,
  name: string,
) {
  const foods = await foodApi.list(userId)

  return foods.find(
    (item) =>
      item.name.trim().toLowerCase() ===
      name.trim().toLowerCase(),
  )
}

// Проверка существования упражнения по названию
export async function exerciseExists(userId: string, name: string): Promise<boolean> {
  try {
    const exercises = await exercisesApi.ensureCatalog(userId)
    return exercises.some(ex => ex.name.toLowerCase() === name.toLowerCase())
  } catch {
    return false
  }
}

// Проверка существования тренировки по названию
export async function templateExists(userId: string, name: string): Promise<boolean> {
  try {
    const templates = await workoutsApi.templates(userId)
    return templates.some(t => t.name.toLowerCase() === name.toLowerCase())
  } catch {
    return false
  }
}

// Проверка существования продукта по названию
export async function foodExists(userId: string, name: string): Promise<boolean> {
  try {
    const foods = await foodApi.list(userId)
    return foods.some(f => f.name.toLowerCase() === name.toLowerCase())
  } catch {
    return false
  }
}