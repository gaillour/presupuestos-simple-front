'use client'

import React from 'react'
import {
  FileDown,
  Home,
  LogOut,
  Settings,
  Shirt,
  ShoppingBag,
  Table2,
  X,
  Zap,
} from 'lucide-react'
import type { ViewId } from '@/lib/types'

export interface SidebarProps {
  view: ViewId | (string & {})
  setView: (v: ViewId) => void
  onLogout: () => void
  telasCount: number
  productosCount: number
  presupuestosCount: number
  tiendaCount?: number
  displayName: string
  userEmail: string
  isDemo: boolean
  mobileOpen: boolean
  onCloseMobile: () => void
}

export function Sidebar({
  view,
  setView,
  onLogout,
  telasCount,
  productosCount,
  presupuestosCount,
  tiendaCount,
  displayName,
  userEmail,
  isDemo,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const items = [
    [Home, 'Dashboard', 'dashboard'],
    [Shirt, 'Productos', 'catalogo'],
    [ShoppingBag, 'Tienda Online', 'tienda'],
    [Table2, 'Telas', 'telas'],
    [Zap, 'Cotizador', 'nuevo'],
    [FileDown, 'Historial', 'historial'],
    [Settings, 'Configuración', 'config'],
  ] as const

  const handleNav = (id: ViewId) => {
    setView(id)
    onCloseMobile()
  }

  return (
    <>
      {mobileOpen && <div className="mobile-backdrop" onClick={onCloseMobile} />}
      <aside className={mobileOpen ? 'sidebar mobile-open' : 'sidebar'}>
        <div className="logo">
          <span className="brand-mark small">
            <img src="/icon.svg" alt="SIMPLE MDQ" />
          </span>
          <div>
            <strong>SIMPLE MDQ</strong>
            <small>COSTOS TEXTILES</small>
          </div>
          <button
            type="button"
            className="icon-btn mobile-close-btn"
            onClick={onCloseMobile}
            aria-label="Cerrar menú"
          >
            <X size={18} />
          </button>
        </div>
        <div className="api">
          <span style={{ background: isDemo ? '#f59e0b' : '#10b981' }} />
          {isDemo ? 'Modo Prueba' : 'En línea'}
        </div>
        <nav>
          {items.map(([Icon, label, id]) => (
            <button
              key={id}
              className={view === id ? 'nav-item active' : 'nav-item'}
              onClick={() => handleNav(id)}
            >
              <Icon size={16} />
              <span>{label}</span>
              {id === 'catalogo' && productosCount > 0 && <b>{productosCount}</b>}
              {id === 'tienda' && (tiendaCount ?? 0) > 0 && <b>{tiendaCount}</b>}
              {id === 'telas' && telasCount > 0 && <b>{telasCount}</b>}
              {id === 'historial' && presupuestosCount > 0 && <b>{presupuestosCount}</b>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="profile">
            <div className="avatar">{displayName.charAt(0).toUpperCase()}</div>
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <strong style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {displayName}
              </strong>
              <small style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {isDemo ? 'Modo prueba' : userEmail || 'Sesión activa'}
              </small>
            </div>
          </div>
          <button className="logout" onClick={onLogout}>
            <LogOut size={15} /> Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  )
}
