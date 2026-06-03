import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';
import { exercisesApi, foodApi } from '../api/mainApi';
import { Exercise, FoodItem } from '../types';

type CatalogContextType = {
  exercises: Exercise[];
  foods: FoodItem[];
  refreshExercises: () => Promise<void>;
  refreshFoods: () => Promise<void>;
  refreshAll: () => Promise<void>;
};

const CatalogContext = createContext<CatalogContextType | undefined>(undefined);

export const CatalogProvider = ({ children }: { children: ReactNode }) => {
  const { session } = useAuth();
  const userId = session?.userId ?? '';
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [foods, setFoods] = useState<FoodItem[]>([]);

  const refreshExercises = useCallback(async () => {
    if (!userId) return;
    try {
      const list = await exercisesApi.ensureCatalog(userId);
      setExercises(list);
    } catch (error) {
      console.error('Failed to load exercises', error);
    }
  }, [userId]);

  const refreshFoods = useCallback(async () => {
    if (!userId) return;
    try {
      const list = await foodApi.list(userId);
      setFoods(list);
    } catch (error) {
      console.error('Failed to load foods', error);
    }
  }, [userId]);

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshExercises(), refreshFoods()]);
  }, [refreshExercises, refreshFoods]);

  useEffect(() => {
    if (userId) refreshAll();
  }, [userId, refreshAll]);

  return (
    <CatalogContext.Provider value={{ exercises, foods, refreshExercises, refreshFoods, refreshAll }}>
      {children}
    </CatalogContext.Provider>
  );
};

export const useCatalog = () => {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error('useCatalog must be used inside CatalogProvider');
  return ctx;
};