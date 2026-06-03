import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth, AuthProvider } from './auth/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { CatalogProvider } from './contexts/CatalogContext';
import { loadApiConfig } from './api/apiConfig';

import AuthScreen from './screens/AuthScreen';
import DashboardScreen from './screens/DashboardScreen';
import WorkoutsScreen from './screens/WorkoutsScreen';
import NutritionScreen from './screens/NutritionScreen';
import AIScreen from './screens/AIScreen';
import ExercisesScreen from './screens/ExercisesScreen';
import CalculatorScreen from './screens/CalculatorScreen';
import MoreScreen from './screens/MoreScreen';
import SettingsScreen from './screens/SettingsScreen';
import ProfileScreen from './screens/ProfileScreen';

import Ionicons from 'react-native-vector-icons/Ionicons';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const { theme } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = '';
          if (route.name === 'Главная') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Тренировки') iconName = focused ? 'barbell' : 'barbell-outline';
		  else if (route.name === 'Упражнения') iconName = focused ? 'body' : 'body-outline';
          else if (route.name === 'Питание') iconName = focused ? 'restaurant' : 'restaurant-outline';
          else if (route.name === 'AI') iconName = focused ? 'bulb' : 'bulb-outline';
          else if (route.name === 'Ещё') iconName = focused ? 'menu' : 'menu-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme === 'dark' ? '#77c7a8' : '#2f7d68',
        tabBarInactiveTintColor: theme === 'dark' ? '#9cafaa' : '#66736f',
        tabBarStyle: { backgroundColor: theme === 'dark' ? '#17211f' : '#fff', borderTopColor: theme === 'dark' ? '#2d413b' : '#dce5df' },
      })}
    >
      <Tab.Screen name="Главная" component={DashboardScreen} />
      <Tab.Screen name="Тренировки" component={WorkoutsScreen} />
	  <Tab.Screen name="Упражнения" component={ExercisesScreen} />
      <Tab.Screen name="Питание" component={NutritionScreen} />
      <Tab.Screen name="AI" component={AIScreen} />
      <Tab.Screen name="Ещё" component={MoreScreen} />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { session, isReady } = useAuth();
  if (!isReady) return null;
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {session ? (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="Profile" component={ProfileScreen} />   
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Calculator" component={CalculatorScreen} />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthScreen} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  const [configLoaded, setConfigLoaded] = useState(false);

  useEffect(() => {
    const init = async () => {
      await loadApiConfig();
      setConfigLoaded(true);
    };
    init();
  }, []);

  if (!configLoaded) return null;

  return (
    <ThemeProvider>
      <AuthProvider>
        <CatalogProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </CatalogProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}