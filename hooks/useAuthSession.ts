'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { SessionState } from '@/lib/types'
import { getGreetingName, isTokenExpired } from '@/lib/utils'

export interface UseAuthSessionReturn {
  session: SessionState
  displayName: string
  login: (jwtToken: string, email: string, remember?: boolean) => void
  enterDemo: () => void
  logout: () => void
  handleSessionExpired: (message?: string) => void
}

const AUTH_STORAGE_KEYS = [
  'simple_mdq_auth',
  'simple_mdq_token',
  'simple_mdq_email',
] as const

function clearAuthStorages(): void {
  if (typeof window === 'undefined') return
  for (const storage of [window.localStorage, window.sessionStorage]) {
    try {
      for (const key of AUTH_STORAGE_KEYS) {
        storage.removeItem(key)
      }
    } catch {}
  }
}

function readSavedAuth(): { token: string; email: string } | null {
  if (typeof window === 'undefined') return null
  for (const storage of [window.localStorage, window.sessionStorage]) {
    try {
      const savedToken = storage.getItem('simple_mdq_token')
      const savedAuth = storage.getItem('simple_mdq_auth')
      const savedEmail = storage.getItem('simple_mdq_email')
      if (savedAuth === 'true' && savedToken) {
        return { token: savedToken, email: savedEmail || '' }
      }
    } catch {}
  }
  return null
}

export function useAuthSession(): UseAuthSessionReturn {
  const [session, setSession] = useState<SessionState>({
    auth: false,
    isDemo: false,
    token: '',
    userEmail: '',
    sessionNotice: null,
  })

  const handleSessionExpired = useCallback((message?: string) => {
    clearAuthStorages()
    setSession({
      auth: false,
      isDemo: false,
      token: '',
      userEmail: '',
      sessionNotice: message || 'Tu sesión expiró. Por favor, iniciá sesión nuevamente.',
    })
  }, [])

  useEffect(() => {
    try {
      const saved = readSavedAuth()
      if (saved) {
        if (isTokenExpired(saved.token)) {
          handleSessionExpired('Tu sesión anterior ha expirado. Por favor, ingresá nuevamente.')
          return
        }
        setSession({
          auth: true,
          isDemo: false,
          token: saved.token,
          userEmail: saved.email,
          sessionNotice: null,
        })
      } else {
        clearAuthStorages()
        setSession({
          auth: false,
          isDemo: false,
          token: '',
          userEmail: '',
          sessionNotice: null,
        })
      }
    } catch {}
  }, [handleSessionExpired])

  const login = useCallback((jwtToken: string, email: string, remember = true) => {
    const activeToken = jwtToken || ''
    const activeEmail = email || 'Administrador'
    clearAuthStorages()
    try {
      const targetStorage = remember ? window.localStorage : window.sessionStorage
      targetStorage.setItem('simple_mdq_auth', 'true')
      if (activeToken) targetStorage.setItem('simple_mdq_token', activeToken)
      if (activeEmail) targetStorage.setItem('simple_mdq_email', activeEmail)
    } catch {}
    setSession({
      auth: true,
      isDemo: false,
      token: activeToken,
      userEmail: activeEmail,
      sessionNotice: null,
    })
  }, [])

  const enterDemo = useCallback(() => {
    setSession({
      auth: true,
      isDemo: true,
      token: '',
      userEmail: 'Administrador',
      sessionNotice: null,
    })
  }, [])

  const logout = useCallback(() => {
    clearAuthStorages()
    setSession({
      auth: false,
      isDemo: false,
      token: '',
      userEmail: '',
      sessionNotice: null,
    })
  }, [])

  const displayName = useMemo(
    () => getGreetingName(session.userEmail, session.isDemo),
    [session.userEmail, session.isDemo]
  )

  return {
    session,
    displayName,
    login,
    enterDemo,
    logout,
    handleSessionExpired,
  }
}
