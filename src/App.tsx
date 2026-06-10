import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Toast, { BaseToast, ErrorToast, InfoToast } from 'react-native-toast-message';
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

const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: '#2f7d68', backgroundColor: '#e6f4ec', width:'95%', minHeight: 60, height: 'auto' }}
      contentContainerStyle={{ paddingHorizontal: 12 }}
      text1Style={{
        fontSize: 14,
        color: '#1f8a70',
        fontWeight: '500',
        flexShrink: 1,
      }}
      text1NumberOfLines={0} 
    />
  ),
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{ borderLeftColor: '#b94a35', backgroundColor: '#fde8e4', width:'95%', minHeight: 60, height: 'auto' }}
      text1Style={{
        fontSize: 14,
        color: '#b94a35',
        fontWeight: '500',
        flexShrink: 1,
      }}
      text1NumberOfLines={0}
    />
  ),
  info: (props: any) => (
    <InfoToast
      {...props}
      style={{ borderLeftColor: '#2d5f9a', backgroundColor: '#e8f0fa', width:'95%', minHeight: 60, height: 'auto' }}
      text1Style={{
        fontSize: 14,
        color: '#2d5f9a',
        fontWeight: '500',
        flexShrink: 1,
      }}
      text1NumberOfLines={0}
    />
  ),
};

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
        tabBarItemStyle: { flex: 1 },
      })}
    >
      <Tab.Screen name="Главная" component={DashboardScreen} options={{ tabBarItemStyle: { flex: 0.8 } }} />
      <Tab.Screen name="Тренировки" component={WorkoutsScreen} />
      <Tab.Screen name="Упражнения" component={ExercisesScreen} />
      <Tab.Screen name="Питание" component={NutritionScreen} options={{ tabBarItemStyle: { flex: 0.8 } }} />
      <Tab.Screen name="AI" component={AIScreen} options={{ tabBarItemStyle: { flex: 0.6 } }} />
      <Tab.Screen name="Ещё" component={MoreScreen} options={{ tabBarItemStyle: { flex: 0.7 } }} />
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
            <Toast config={toastConfig} />
          </NavigationContainer>
        </CatalogProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}