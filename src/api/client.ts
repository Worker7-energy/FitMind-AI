import type { AuthSession } from '../types'

const authBase = import.meta.env.VITE_AUTH_API_BASE ?? '/auth-api'
const mainBase = import.meta.env.VITE_MAIN_API_BASE ?? '/main-api'
export const useMocks = import.meta.env.VITE_USE_MOCKS !== 'false'

type JsonBody = Record<string, unknown> | Array<unknown>
type ApiRequestInit = Omit<RequestInit, 'body'> & { body?: BodyInit | JsonBody }

let sessionGetter: (() => AuthSession | null) | null = null
let refreshHandler: (() => Promise<AuthSession | null>) | null = null

export function attachAuth(getSession: () => AuthSession | null, refresh: () => Promise<AuthSession | null>) {
  sessionGetter = getSession
  refreshHandler = refresh
}

async function request<T>(base: string, path: string, options: ApiRequestInit = {}) {
  const headers = new Headers(options.headers)
  const session = sessionGetter?.()
  if (session?.accessToken) headers.set('Authorization', `Bearer ${session.accessToken}`)

  let body = options.body
  if (body && !(body instanceof FormData) && typeof body !== 'string') {
    headers.set('Content-Type', 'application/json')
    body = JSON.stringify(body)
  }

  const response = await fetch(`${base}${path}`, { ...options, headers, body: body as BodyInit | undefined })
  if (response.status === 401 && refreshHandler) {
    const next = await refreshHandler()
    if (next) return request<T>(base, path, options)
  }
  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `HTTP ${response.status}`)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export const authRequest = <T>(path: string, options?: ApiRequestInit) =>
  request<T>(authBase, path, options)

export const mainRequest = <T>(path: string, options?: ApiRequestInit) =>
  request<T>(mainBase, path, options)
