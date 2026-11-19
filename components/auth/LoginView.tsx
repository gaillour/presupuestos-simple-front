'use client'

import React, { useState } from 'react'
import { AlertCircle, Check, Eye } from 'lucide-react'
import { authService } from '@/lib/api/services'

export interface LoginViewProps {
  onLogin: (token: string, userEmail: string) => void
  onEnterDemo: () => void
  notice?: string | null
}

export function LoginView({
  onLogin,
  onEnterDemo,
  notice,
}: LoginViewProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [remember, setRemember] = useState(true)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const cleanUser = username.trim()
    if (password.trim().toLowerCase() === 'admin') {
      setError('Para ingresar sin cuenta usá el botón de Modo Prueba debajo del formulario.')
      return
    }

    setLoading(true)

    try {
      const data = await authService.login(cleanUser, password)
      if (data?.access_token) {
        onLogin(data.access_token, data.user?.email || cleanUser)
        return
      }
    } catch (err: any) {
      setError(
        err?.message || 'Credenciales incorrectas. Verificá tu usuario y contraseña.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <div className="login-card">
        <div className="brand-mark">S</div>
        <h1>SIMPLE MDQ</h1>
        <p className="muted">Costos textiles y cotizaciones</p>

        <form onSubmit={handleSubmit}>
          {notice && !error && (
            <div
              className="alert"
              style={{
                margin: '0 0 16px',
                color: 'var(--color-primary)',
                borderColor: 'var(--line)',
                background: 'var(--surface-2)',
              }}
            >
              <AlertCircle size={15} />
              <span>{notice}</span>
            </div>
          )}
          {error && (
            <div
              className="alert alert-error"
              style={{
                margin: '0 0 16px',
              }}
            >
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <label>
            Email o Usuario
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
                if (error) setError('')
              }}
              placeholder="usuario@simplemdq.com"
              autoFocus
              required
            />
          </label>

          <label>
            Contraseña
            <div className="password">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (error) setError('')
                }}
                placeholder="Contraseña"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </label>

          <label className="check">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />{' '}
            Recordar sesión
          </label>

          <button className="primary full" type="submit" disabled={loading}>
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            <Check size={16} />
          </button>
        </form>

        <div style={{ marginTop: '16px', borderTop: '1px solid var(--line)', paddingTop: '14px' }}>
          <button className="demo" type="button" onClick={onEnterDemo} style={{ marginTop: 0 }}>
            <Eye size={15} /> Ingresar en Modo Prueba
          </button>
        </div>
      </div>
    </main>
  )
}
