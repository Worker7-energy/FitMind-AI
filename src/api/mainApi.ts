import { mainRequest, useMocks } from './client'
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
} from '../types'

const todayKey = () => new Date().toISOString().slice(0, 10)

export const profileApi = {
  async get(userId: string) {
    if (useMocks) return readMockState().profiles.find((item) => item.user_id === userId) ?? null
    return mainRequest<FitnessProfile>(`/fitness_profile/${userId}`)
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
    const existing = await this.get(profile.user_id).catch(() => null)
    await mainRequest(existing ? `/fitness_profile/${profile.user_id}` : '/create_fitness_profile', {
      method: existing ? 'PATCH' : 'POST',
      body: profile,
    })
  },
}

export const exercisesApi = {
  async list() {
    if (useMocks) return readMockState().exercises
    return mainRequest<Exercise[]>('/exercises')
  },
  async search(query: string) {
    if (useMocks) {
      return readMockState().exercises.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()))
    }
    return mainRequest<Exercise[]>(`/exercises/search?q=${encodeURIComponent(query)}`)
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
}

export const workoutsApi = {
  async templates(userId: string) {
    if (useMocks) return readMockState().templates.filter((item) => item.user_id === userId)
    return mainRequest<WorkoutTemplate[]>(`/workouts/templates/user/${userId}`)
  },
  async templateDetails(id: number) {
    if (useMocks) {
      const state = readMockState()
      return {
        template: state.templates.find((item) => item.id === id),
        exercises: state.workoutExercises.filter((item) => item.template_id === id),
      }
    }
    return mainRequest<{ template: WorkoutTemplate; exercises: WorkoutExercise[] }>(`/workouts/templates/${id}`)
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
    if (useMocks) return readMockState().sessions.filter((item) => item.user_id === userId)
    return mainRequest<WorkoutSession[]>(`/workouts/sessions/user/${userId}`)
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
}

export const foodApi = {
  async list(userId: string) {
    if (useMocks) return readMockState().foods.filter((item) => !item.user_id || item.user_id === userId)
    return mainRequest<FoodItem[]>(`/food?user_id=${encodeURIComponent(userId)}`)
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
    if (useMocks) return readMockState().mealLogs.filter((item) => item.user_id === userId && item.date.slice(0, 10) === date)
    return mainRequest<MealLog[]>(`/meal-logs?user_id=${encodeURIComponent(userId)}&date=${date}`)
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
    if (useMocks) return readMockState().calorieGoals.find((item) => item.user_id === userId && item.date === date) ?? null
    return mainRequest<CalorieGoal>(`/calorie-goals?user_id=${encodeURIComponent(userId)}&date=${date}`)
  },
}

export const aiApi = {
  async workout(input: AiWorkoutRequest) {
    if (useMocks) {
      return { note: 'Mock: backend AI пока заглушка, но форма уже готова к реальному ответу.', exercises: [] }
    }
    return mainRequest<{ note: string; exercises: unknown[] }>('/ai/generate-workout', { method: 'POST', body: input })
  },
  async mealPlan(input: AiMealPlanRequest) {
    if (useMocks) {
      return { note: 'Mock: backend AI пока заглушка, но форма уже готова к реальному ответу.', meals: [] }
    }
    return mainRequest<{ note: string; meals: unknown[] }>('/ai/generate-meal-plan', { method: 'POST', body: input })
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
  return Object.fromEntries(
    [50, 60, 65, 70, 75, 80, 85, 90, 95].map((value) => [`${value}%`, Math.round((oneRm * value) / 100 * 100) / 100]),
  )
}
