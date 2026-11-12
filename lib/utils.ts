import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getApiBase = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, '')
  }
  if (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ) {
    return 'http://localhost:8000'
  }
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:8000'
  }
  return 'https://presupuestos-simple.fly.dev'
}

export const API_BASE = getApiBase()

export const money = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 2,
})

export function getGreetingName(userEmail: string, isDemo?: boolean): string {
  if (isDemo) return 'Administrador'
  const lower = (userEmail || '').toLowerCase().trim()
  if (!lower || lower === 'administrador' || lower === 'admin' || lower.startsWith('admin@')) {
    return 'Administrador'
  }
  if (lower.includes('romi')) return 'Romi'
  if (lower.includes('iara')) return 'Iara'
  if (lower.includes('juan') || lower.includes('juani')) return 'Juani'
  const localPart = lower.split('@')[0]
  return localPart.charAt(0).toUpperCase() + localPart.slice(1)
}

export function isTokenExpired(jwtToken: string): boolean {
  if (!jwtToken) return true
  try {
    const parts = jwtToken.split('.')
    if (parts.length !== 3) return false
    const base64Url = parts[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    const payload = JSON.parse(jsonPayload)
    if (typeof payload.exp === 'number') {
      return Date.now() >= payload.exp * 1000 - 30000
    }
    return false
  } catch {
    return false
  }
}
