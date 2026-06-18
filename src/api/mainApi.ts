import { mainRequest } from './client';
import {
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
  AiWorkoutResponse,
  AiMealResponse,
} from '../types';

const asArray = <T>(value: T[] | null | undefined): T[] => value ?? [];


export const profileApi = {
  async get(userId: string): Promise<FitnessProfile | null> {
    try {
      return await mainRequest<FitnessProfile>(`/fitness_profile/${userId}`);
    } catch {
      return null;
    }
  },

  async save(profile: FitnessProfile): Promise<void> {
    const existing = await this.get(profile.user_id).catch(() => null);
    const url = existing ? `/fitness_profile/${profile.user_id}` : '/create_fitness_profile';
    const method = existing ? 'PATCH' : 'POST';
    await mainRequest(url, { method, body: profile });
  },
};

export const exercisesApi = {
  async list(): Promise<Exercise[]> {
    return asArray(await mainRequest<Exercise[] | null>('/exercises'));
  },

  async search(query: string): Promise<Exercise[]> {
    return asArray(
      await mainRequest<Exercise[] | null>(`/exercises/search?q=${encodeURIComponent(query)}`)
    );
  },

  async create(input: Omit<Exercise, 'id'>): Promise<Exercise> {
    const data = await mainRequest<{ id: number }>('/exercises', {
      method: 'POST',
      body: input,
    });
    return { ...input, id: data.id };
  },

  async ensureCatalog(_userId?: string): Promise<Exercise[]> {
    return this.list();
  },

  async delete(id: number): Promise<void> {
    await mainRequest(`/exercises/${id}`, { method: 'DELETE' });
  },
};

export const workoutsApi = {
  async templates(userId: string): Promise<WorkoutTemplate[]> {
    return asArray(
      await mainRequest<WorkoutTemplate[] | null>(`/workouts/templates/user/${userId}`)
    );
  },

  async templateDetails(id: number): Promise<{
    template: WorkoutTemplate | null;
    exercises: WorkoutExercise[];
  }> {
    const details = await mainRequest<{
      template: WorkoutTemplate;
      exercises: WorkoutExercise[] | null;
    }>(`/workouts/templates/${id}`);
    return {
      template: details.template,
      exercises: asArray(details.exercises),
    };
  },

  async createTemplate(userId: string, name: string): Promise<WorkoutTemplate> {
    const data = await mainRequest<{ id: number }>('/workouts/templates', {
      method: 'POST',
      body: { user_id: userId, name },
    });
    return { id: data.id, user_id: userId, name };
  },

  async addExercise(input: Omit<WorkoutExercise, 'id'>): Promise<WorkoutExercise> {
    const data = await mainRequest<{ id: number }>('/workouts/exercises', {
      method: 'POST',
      body: input,
    });
    return { ...input, id: data.id };
  },

  async sessions(userId: string): Promise<WorkoutSession[]> {
    return asArray(
      await mainRequest<WorkoutSession[] | null>(`/workouts/sessions/user/${userId}`)
    );
  },

  async startSession(userId: string, templateId: number): Promise<WorkoutSession> {
    const data = await mainRequest<{ session_id: number }>('/workouts/sessions', {
      method: 'POST',
      body: { user_id: userId, template_id: templateId },
    });
    return {
      id: data.session_id,
      user_id: userId,
      template_id: templateId,
      started_at: new Date().toISOString(),
      duration_minutes: 0,
    };
  },

  async completeSession(id: number, duration: number): Promise<void> {
    await mainRequest(`/workouts/sessions/${id}/complete`, {
      method: 'POST',
      body: { duration_minutes: duration },
    });
  },

  async saveResult(input: Omit<WorkoutResult, 'id'>): Promise<void> {
    await mainRequest('/workouts/results', { method: 'POST', body: input });
  },

  async deleteTemplate(id: number): Promise<void> {
    await mainRequest(`/workouts/templates/${id}`, { method: 'DELETE' });
  },

  async deleteExerciseFromTemplate(workoutExerciseId: number): Promise<void> {
    await mainRequest(`/workouts/exercises/${workoutExerciseId}`, { method: 'DELETE' });
  },

  async updateExerciseInTemplate(
    id: number,
    data: Partial<WorkoutExercise>
  ): Promise<void> {
    await mainRequest(`/workouts/exercises/${id}`, { method: 'PUT', body: data });
  },
};

const todayKey = (): string => new Date().toISOString().slice(0, 10);

export const foodApi = {
  async list(userId: string): Promise<FoodItem[]> {
    return asArray(
      await mainRequest<FoodItem[] | null>(`/food?user_id=${encodeURIComponent(userId)}`)
    );
  },

  async create(input: Omit<FoodItem, 'id'>): Promise<FoodItem> {
    const data = await mainRequest<{ id: number }>('/food', {
      method: 'POST',
      body: input,
    });
    return { ...input, id: data.id };
  },

  async logs(userId: string, date: string = todayKey()): Promise<MealLog[]> {
    return asArray(
      await mainRequest<MealLog[] | null>(
        `/meal-logs?user_id=${encodeURIComponent(userId)}&date=${date}`
      )
    );
  },

  async addLog(input: Omit<MealLog, 'id' | 'date'>): Promise<MealLog> {
    const data = await mainRequest<{ id: number }>('/meal-logs', {
      method: 'POST',
      body: input,
    });
    return {
      ...input,
      id: data.id,
      date: new Date().toISOString(),
    };
  },

  async setGoal(goal: CalorieGoal): Promise<void> {
    await mainRequest('/calorie-goals', { method: 'POST', body: goal });
  },

  async goal(userId: string, date: string = todayKey()): Promise<CalorieGoal | null> {
    try {
      return await mainRequest<CalorieGoal>(
        `/calorie-goals?user_id=${encodeURIComponent(userId)}&date=${date}`
      );
    } catch {
      return null;
    }
  },

  async deleteFood(id: number): Promise<void> {
    await mainRequest(`/food/${id}`, { method: 'DELETE' });
  },

  async deleteLog(id: number): Promise<void> {
    await mainRequest(`/meal-logs/${id}`, { method: 'DELETE' });
  },

  async search(query: string, userId: string): Promise<FoodItem[]> {
    return asArray(
      await mainRequest<FoodItem[]>(
        `/food/search?q=${encodeURIComponent(query)}&user_id=${userId}`
      )
    );
  },
};


export const aiApi = {
  async workout(input: AiWorkoutRequest): Promise<{ note?: string; error?: string; exercises?: unknown[] }> {
    return mainRequest('/ai/generate-workout', { method: 'POST', body: input });
  },

  async mealPlan(input: AiMealPlanRequest): Promise<{ note?: string; error?: string; meals?: unknown[] }> {
    return mainRequest('/ai/generate-meal-plan', { method: 'POST', body: input });
  },
};


export const calculatorApi = {
  async oneRm(weight: number, reps: number): Promise<OneRmResponse> {
    return mainRequest<OneRmResponse>(`/calculator/1rm?weight=${weight}&reps=${reps}`);
  },

  async workingWeight(oneRm: number, percentage: number): Promise<WorkingWeightResponse> {
    return mainRequest<WorkingWeightResponse>('/calculator/working-weight', {
      method: 'POST',
      body: { one_rm: oneRm, percentage },
    });
  },
};


export async function saveAiWorkout(
  userId: string,
  workout: AiWorkoutResponse,
  templateName = 'AI Тренировка',
) {
  const template = await workoutsApi.createTemplate(
    userId,
    `${templateName} ${new Date().toLocaleDateString()}`,
  );

  const catalog = await exercisesApi.list();

  for (let i = 0; i < workout.exercises.length; i++) {
    const aiExercise = workout.exercises[i];

    let exercise = catalog.find(
      (item) =>
        item.name.toLowerCase() === aiExercise.name.toLowerCase(),
    );

    if (!exercise) {
      exercise = await exercisesApi.create({
        name: aiExercise.name,
        muscle_group: aiExercise.muscle_group,
        is_custom: true,
        created_by_user_id: userId,
      });
    }

    await workoutsApi.addExercise({
      template_id: template.id,
      exercise_id: exercise.id,
      sets: aiExercise.sets,
      reps: aiExercise.reps,
      weight: aiExercise.weight_kg,
      order_index: i,
    });
  }

  return template;
}

export async function saveAiFood(
  userId: string,
  food: {
    name: string;
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    grams: number;
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
  });

  await foodApi.addLog({
    user_id: userId,
    food_id: createdFood.id,
    grams: food.grams,
    meal_type: mealType,
  });

  return createdFood;
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
      );
    }
  }
}

export async function saveSingleAiExercise(
  userId: string,
  exercise: AiWorkoutResponse['exercises'][number],
) {
  let catalogExercise = (
    await exercisesApi.list()
  ).find(
    (item) =>
      item.name.toLowerCase() === exercise.name.toLowerCase(),
  );

  if (!catalogExercise) {
    catalogExercise = await exercisesApi.create({
      name: exercise.name,
      muscle_group: exercise.muscle_group,
      is_custom: true,
      created_by_user_id: userId,
    });
  }

  return catalogExercise;
}