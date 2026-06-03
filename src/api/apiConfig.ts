import AsyncStorage from '@react-native-async-storage/async-storage';
import { AUTH_API_BASE as DEFAULT_AUTH, MAIN_API_BASE as DEFAULT_MAIN } from '../config';

let authBase = DEFAULT_AUTH;
let mainBase = DEFAULT_MAIN;

export async function loadApiConfig(): Promise<void> {
  try {
    const savedAuth = await AsyncStorage.getItem('fitmind.auth_base');
    const savedMain = await AsyncStorage.getItem('fitmind.main_base');
    if (savedAuth) authBase = savedAuth;
    if (savedMain) mainBase = savedMain;
  } catch (error) {
    console.warn('Failed to load API config', error);
  }
}

export async function saveApiConfig(authUrl: string, mainUrl: string): Promise<void> {
  authBase = authUrl;
  mainBase = mainUrl;
  await AsyncStorage.setItem('fitmind.auth_base', authUrl);
  await AsyncStorage.setItem('fitmind.main_base', mainUrl);
}

export function getAuthBase(): string {
  return authBase;
}

export function getMainBase(): string {
  return mainBase;
}

export function getCurrentConfig(): { authBase: string; mainBase: string } {
  return { authBase, mainBase };
}