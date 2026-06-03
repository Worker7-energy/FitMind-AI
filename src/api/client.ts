import { getAuthBase, getMainBase } from './apiConfig';
import { AuthSession } from '../types';

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

  const response = await fetch(`${base}${path}`, {
    ...options,
    headers,
    body: body as BodyInit | undefined,
  });

  if (response.status === 401 && refreshHandler) {
    const next = await refreshHandler();
    if (next) return request<T>(baseGetter, path, options);
  }

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `HTTP ${response.status}`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const authRequest = <T>(path: string, options?: ApiRequestInit) =>
  request<T>(getAuthBase, path, options);

export const mainRequest = <T>(path: string, options?: ApiRequestInit) =>
  request<T>(getMainBase, path, options);