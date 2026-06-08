import type { AiWorkoutResponse, AiMealResponse } from '../types'

const KEY = 'ai_page_cache_v1'

export type AiCacheState = {
  workoutResult: AiWorkoutResponse | null
  mealResult: AiMealResponse | null
  form: {
    sex: string
    weight: number
    level: string
    goal: string
    limitations: string
    equipment: string
    calories: number
    diet: string
    preferences: string
  }
}

export function loadAiCache(): AiCacheState | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function saveAiCache(state: AiCacheState) {
  localStorage.setItem(KEY, JSON.stringify(state))
}

export function clearAiCache() {
  localStorage.removeItem(KEY)
}