'use client'

import React, { useEffect, useRef, useState } from 'react'
import { ChevronRight, LogOut, Menu, Moon, RefreshCw, Settings, Sun } from 'lucide-react'
import type { ViewId } from '@/lib/types'

const VIEW_TITLES: Record<ViewId, string> = {
  dashboard: 'Dashboard',
  catalogo: 'Catálogo de Prendas',
  tienda: 'Tienda Online',
  telas: 'Telas & Rendimientos',
  nuevo: 'Cotizador',
  historial: 'Historial de Presupuestos',
  config: 'Configuración',
}

export interface TopbarProps {
  view: ViewId
  dark: boolean
  onToggleDark: () => void
  onOpenMobileMenu: () => void
  isSyncing: boolean
  isColdStarting: boolean
  displayName: string
  userEmail: string
  isDemo: boolean
  onNavigateConfig: () => void
  onLogout: () => void
}

export function Topbar({
  view,
  dark,
  onToggleDark,
  onOpenMobileMenu,
  isSyncing,
  isColdStarting,
  displayName,
  userEmail,
  isDemo,
  onNavigateConfig,
  onLogout,
}: TopbarProps): React.JSX.Element {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return

    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [menuOpen])

  return (
    <header className="topbar">
      <button
        type="button"
        className="mobile-menu icon-btn"
        onClick={onOpenMobileMenu}
        aria-label="Desplegar barra lateral"
      >
        <Menu size={18} />
      </button>
      <div className="breadcrumbs">
        <span>Sistema</span>
        <ChevronRight size={14} />
        <strong>{VIEW_TITLES[view] ?? 'Dashboard'}</strong>
      </div>
      <div className="top-actions">
        {isSyncing && (
          <div
            className={`sync-pill ${isColdStarting ? 'cold-start' : ''}`}
            title={
              isColdStarting
                ? 'El servidor en la nube se está iniciando'
                : 'Actualizando datos con el servidor'
            }
          >
            <RefreshCw size={12} className="animate-spin" />
            <span>
              {isColdStarting ? 'Iniciando servidor...' : 'Sincronizando...'}
            </span>
          </div>
        )}
        <button
          type="button"
          className="icon-btn"
          onClick={onToggleDark}
          aria-label="Cambiar tema"
        >
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <div className="top-avatar-wrap" ref={menuRef}>
          <button
            type="button"
            className="top-avatar"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Menú de usuario"
            onClick={() => setMenuOpen((o) => !o)}
          >
            {displayName.charAt(0).toUpperCase()}
          </button>
          {menuOpen && (
            <div className="avatar-menu" role="menu">
              <div className="avatar-menu-head">
                <strong>{displayName}</strong>
                <small>{isDemo ? 'Modo prueba' : userEmail || 'Sesión activa'}</small>
              </div>
              <button
                type="button"
                className="avatar-menu-item"
                role="menuitem"
                onClick={() => {
                  onNavigateConfig()
                  setMenuOpen(false)
                }}
              >
                <Settings size={14} />
                <span>Configuración</span>
              </button>
              <button
                type="button"
                className="avatar-menu-item danger"
                role="menuitem"
                onClick={() => {
                  onLogout()
                  setMenuOpen(false)
                }}
              >
                <LogOut size={14} />
                <span>Cerrar sesión</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
