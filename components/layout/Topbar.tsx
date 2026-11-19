'use client'

import React from 'react'
import { ChevronRight, Menu, Moon, RefreshCw, Sun } from 'lucide-react'
import type { ViewId } from '@/lib/types'

export interface TopbarProps {
  view: ViewId
  dark: boolean
  onToggleDark: () => void
  onOpenMobileMenu: () => void
  isSyncing: boolean
  isColdStarting: boolean
  displayName: string
}

export function Topbar({
  view,
  dark,
  onToggleDark,
  onOpenMobileMenu,
  isSyncing,
  isColdStarting,
  displayName,
}: TopbarProps): React.JSX.Element {
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
        <strong>
          {view === 'dashboard'
            ? 'Dashboard'
            : view === 'catalogo'
            ? 'Catálogo de Prendas'
            : view === 'telas'
            ? 'Telas & Rendimientos'
            : view === 'nuevo'
            ? 'Cotizador'
            : view === 'historial'
            ? 'Historial de Presupuestos'
            : 'Configuración'}
        </strong>
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
          className="icon-btn"
          onClick={onToggleDark}
          aria-label="Cambiar tema"
        >
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <div className="top-avatar" title={displayName}>
          {displayName.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  )
}
