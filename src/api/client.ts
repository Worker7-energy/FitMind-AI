import { getAuthBase, getMainBase } from './apiConfig';
import { AuthSession } from '../types';

const REQUEST_TIMEOUT_MS = 10000; 

type JsonBody = Record<string, unknown> | Array<unknown>;
type ApiRequestInit = Omit<RequestInit, 'body'> & { body?: BodyInit | JsonBody };

let sessionGetter: (() => AuthSession | null) | null = null;
let refreshHandler: (() => Promise<AuthSession | null>) | null = null;

export function attachAuth(
  getSession: () => AuthSession | null,
  refresh: () => Promise<AuthSession | null>
) {
  sessionGetter = getSession;
  refreshHandler = refresh;
}

async function request<T>(
  baseGetter: () => string,
  path: string,
  options: ApiRequestInit = {}
): Promise<T> {
  const base = baseGetter();
  const headers = new Headers(options.headers);
  const session = sessionGetter?.();
  if (session?.accessToken) {
    headers.set('Authorization', `Bearer ${session.accessToken}`);
  }

  let body = options.body;
  if (body && !(body instanceof FormData) && typeof body !== 'string') {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(body);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${base}${path}`, {
      ...options,
      headers,
      body: body as BodyInit | undefined,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.status === 401 && refreshHandler) {
      const next = await refreshHandler();
      if (next) return request<T>(baseGetter, path, options);
    }

    if (!response.ok) {
      let message = '';
      let rawText = '';
      try {
        const errorData = await response.json();
        rawText = JSON.stringify(errorData);
        if (typeof errorData === 'string') {
          message = errorData;
        } else if (errorData && typeof errorData === 'object') {
          message = errorData.error || errorData.message || errorData.error_description || rawText;
        } else {
          message = rawText;
        }
      } catch (parseError) {
        rawText = await response.text();
        message = rawText;
      }
      if (!message || message === '{}' || message === 'null' || message === '""') {
        if (response.status === 401) message = 'Неверный email или пароль';
        else if (response.status === 400) message = 'Некорректные данные';
        else if (response.status === 404) message = 'Ресурс не найден';
        else message = 'Ошибка соединения сервера';
      }
      throw new Error(message);
    }

    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Превышено время ожидания ответа от сервера. Проверьте подключение.');
    }
    throw error;
  }
}

export const authRequest = <T>(path: string, options?: ApiRequestInit) =>
  request<T>(getAuthBase, path, options);

export const mainRequest = <T>(path: string, options?: ApiRequestInit) =>
  request<T>(getMainBase, path, options);