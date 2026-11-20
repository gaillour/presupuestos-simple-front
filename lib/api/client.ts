import { API_BASE } from '../utils.ts'

export class ApiError extends Error {
  status: number
  isUnauthorized: boolean

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.isUnauthorized = status === 401 || status === 403
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  token?: string
  body?: unknown
  onUnauthorized?: () => void
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method || 'GET'
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`
  }

  const url = path.startsWith('http://') || path.startsWith('https://')
    ? path
    : `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`

  const response = await fetch(url, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })

  if (response.status === 401 || response.status === 403) {
    if (options.onUnauthorized) {
      options.onUnauthorized()
    }
    const errData = await response.json().catch(() => null)
    const message = errData?.detail || errData?.message || 'No autorizado'
    throw new ApiError(message, response.status)
  }

  if (!response.ok) {
    const errData = await response.json().catch(() => null)
    const message = errData?.detail || errData?.message || response.statusText || 'Error en la petición'
    throw new ApiError(message, response.status)
  }

  if (response.status === 204) {
    return undefined as unknown as T
  }

  const text = await response.text()
  if (!text) {
    return undefined as unknown as T
  }

  try {
    return JSON.parse(text) as T
  } catch {
    return text as unknown as T
  }
}

export function getPresupuestoPdfUrl(presupuestoId: number, token?: string): string {
  const base = `${API_BASE}/api/presupuestos/${presupuestoId}/pdf`
  return token ? `${base}?token=${encodeURIComponent(token)}` : base
}
