'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { SessionState } from '@/lib/types'
import { getGreetingName, isTokenExpired } from '@/lib/utils'

export interface UseAuthSessionReturn {
  session: SessionState
  displayName: string
  login: (jwtToken: string, email: string) => void
  enterDemo: () => void
  logout: () => void
  handleSessionExpired: (message?: string) => void
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
    try {
      localStorage.removeItem('simple_mdq_auth')
      localStorage.removeItem('simple_mdq_token')
      localStorage.removeItem('simple_mdq_email')
    } catch {}
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
      const savedToken = localStorage.getItem('simple_mdq_token')
      const savedAuth = localStorage.getItem('simple_mdq_auth')
      const savedEmail = localStorage.getItem('simple_mdq_email')
      if (savedAuth === 'true' && savedToken) {
        if (isTokenExpired(savedToken)) {
          handleSessionExpired('Tu sesión anterior ha expirado. Por favor, ingresá nuevamente.')
          return
        }
        setSession({
          auth: true,
          isDemo: false,
          token: savedToken,
          userEmail: savedEmail || '',
          sessionNotice: null,
        })
      } else {
        localStorage.removeItem('simple_mdq_auth')
        localStorage.removeItem('simple_mdq_token')
        localStorage.removeItem('simple_mdq_email')
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

  const login = useCallback((jwtToken: string, email: string) => {
    const activeToken = jwtToken || ''
    const activeEmail = email || 'Administrador'
    try {
      localStorage.setItem('simple_mdq_auth', 'true')
      if (activeToken) localStorage.setItem('simple_mdq_token', activeToken)
      if (activeEmail) localStorage.setItem('simple_mdq_email', activeEmail)
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
    try {
      localStorage.removeItem('simple_mdq_auth')
      localStorage.removeItem('simple_mdq_token')
      localStorage.removeItem('simple_mdq_email')
    } catch {}
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
