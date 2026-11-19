'use client'

import React, { useEffect, useRef, useState } from 'react'
import { ChevronRight, Menu, Moon, RefreshCw, Sun } from 'lucide-react'
import type { EditableEntity, Presupuesto, Producto, Tela, ViewId } from '@/lib/types'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useConfiguracionData } from '@/hooks/useConfiguracionData'
import { useCatalogoData } from '@/hooks/useCatalogoData'
import { usePresupuestosData } from '@/hooks/usePresupuestosData'
import { LoginView } from '@/components/auth/LoginView'
import { Sidebar } from '@/components/layout/Sidebar'
import { DashboardView } from '@/components/dashboard/DashboardView'
import { CatalogoView } from '@/components/catalogo/CatalogoView'
import { ModalProducto } from '@/components/catalogo/ModalProducto'
import { TelasView } from '@/components/telas/TelasView'
import { ModalTela } from '@/components/telas/ModalTela'
import { NuevoPresupuestoView } from '@/components/presupuestos/NuevoPresupuestoView'
import { HistorialView } from '@/components/presupuestos/HistorialView'
import { ModalDetallePresupuesto } from '@/components/presupuestos/ModalDetallePresupuesto'
import { ConfiguracionView } from '@/components/configuracion/ConfiguracionView'

const VIEW_TITLES: Record<ViewId, string> = {
  dashboard: 'Dashboard', catalogo: 'Catálogo de Prendas', telas: 'Telas & Rendimientos',
  nuevo: 'Cotizador', historial: 'Historial de Presupuestos', config: 'Configuración',
}

export function AppShellClient(): React.JSX.Element {
  const [view, setView] = useState<ViewId>('dashboard')
  const [dark, setDark] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [editingTela, setEditingTela] = useState<EditableEntity<Tela>>(null)
  const [editingProducto, setEditingProducto] = useState<EditableEntity<Producto>>(null)
  const [selectedPresupuesto, setSelectedPresupuesto] = useState<Presupuesto | null>(null)
  const [isColdStarting, setIsColdStarting] = useState(false)

  const auth = useAuthSession()
  const { session, displayName } = auth

  const configData = useConfiguracionData({
    token: session.token, isDemo: session.isDemo, onUnauthorized: auth.handleSessionExpired,
    onDemoConfigChange: (cfg) => catalogoData.syncDemoProductosWithConfig(cfg),
    onRemoteConfigUpdated: () => catalogoData.fetchProductos(),
  })
  const catalogoData = useCatalogoData({
    token: session.token, isDemo: session.isDemo, config: configData.config,
    tiposEstampado: configData.tecnicasDisponibles, onUnauthorized: auth.handleSessionExpired,
  })
  const presupuestosData = usePresupuestosData({
    token: session.token, isDemo: session.isDemo, productos: catalogoData.productos,
    onUnauthorized: auth.handleSessionExpired,
  })

  const loadedTokenRef = useRef<string | null>(null)
  useEffect(() => {
    if (session.auth && !session.isDemo && session.token) {
      if (loadedTokenRef.current !== session.token) {
        loadedTokenRef.current = session.token
        catalogoData.fetchTelas(session.token); catalogoData.fetchProductos(session.token)
        presupuestosData.fetchPresupuestos(session.token)
        configData.fetchConfig(session.token); configData.fetchTiposEstampado(session.token)
      }
    } else {
      loadedTokenRef.current = null
    }
  }, [session.auth, session.isDemo, session.token, catalogoData, presupuestosData, configData])

  const isSyncing = !session.isDemo && session.auth && (
    catalogoData.loadingTelas || catalogoData.loadingProductos ||
    presupuestosData.loadingPresupuestos || configData.loadingConfig || configData.loadingTiposEstampado
  )
  const isInitialLoading = isSyncing &&
    catalogoData.telas.length === 0 && catalogoData.productos.length === 0 && presupuestosData.presupuestos.length === 0

  useEffect(() => {
    if (!isInitialLoading) { setIsColdStarting(false); return }
    const timer = setTimeout(() => setIsColdStarting(true), 2500)
    return () => clearTimeout(timer)
  }, [isInitialLoading])

  if (!session.auth) {
    return (
      <LoginView
        onLogin={auth.login}
        onEnterDemo={() => {
          auth.enterDemo(); configData.loadDemoConfig(); catalogoData.loadDemoCatalogo(); presupuestosData.loadDemoPresupuestos()
        }}
        notice={session.sessionNotice}
      />
    )
  }

  const handleLogout = () => {
    auth.logout(); catalogoData.resetCatalogo(); presupuestosData.resetPresupuestos()
    configData.resetConfig(); setMobileMenuOpen(false)
  }

  return (
    <div className={dark ? 'app dark' : 'app'}>
      <Sidebar
        view={view} setView={setView} onLogout={handleLogout}
        telasCount={catalogoData.telas.length} productosCount={catalogoData.productos.length}
        presupuestosCount={presupuestosData.presupuestos.length} displayName={displayName}
        userEmail={session.userEmail} isDemo={session.isDemo} mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />
      <main className="shell">
        <header className="topbar">
          <button type="button" className="mobile-menu icon-btn" onClick={() => setMobileMenuOpen(true)} aria-label="Desplegar barra lateral"><Menu size={18} /></button>
          <div className="breadcrumbs"><span>Sistema</span><ChevronRight size={14} /><strong>{VIEW_TITLES[view] ?? 'Dashboard'}</strong></div>
          <div className="top-actions">
            {isSyncing && (
              <div className={`sync-pill ${isColdStarting ? 'cold-start' : ''}`} title={isColdStarting ? 'El servidor en la nube se está iniciando' : 'Actualizando datos con el servidor'}>
                <RefreshCw size={12} className="animate-spin" /><span>{isColdStarting ? 'Iniciando servidor...' : 'Sincronizando...'}</span>
              </div>
            )}
            <button className="icon-btn" onClick={() => setDark(!dark)} aria-label="Cambiar tema">{dark ? <Sun size={16} /> : <Moon size={16} />}</button>
            <div className="top-avatar" title={displayName}>{displayName.charAt(0).toUpperCase()}</div>
          </div>
        </header>

        <div className="page-content">
          {view === 'dashboard' ? (
            <DashboardView
              setView={(v) => setView(v as ViewId)} telas={catalogoData.telas} productos={catalogoData.productos}
              presupuestos={presupuestosData.presupuestos} config={configData.config} displayName={displayName}
              onSelectPresupuesto={setSelectedPresupuesto} loadingTelas={catalogoData.loadingTelas}
              loadingProductos={catalogoData.loadingProductos} loadingPresupuestos={presupuestosData.loadingPresupuestos} loadingConfig={configData.loadingConfig}
            />
          ) : view === 'catalogo' ? (
            <CatalogoView
              productos={catalogoData.productos} loading={catalogoData.loadingProductos} error={catalogoData.errorProductos}
              onReload={() => catalogoData.fetchProductos()} onEditProducto={(p) => setEditingProducto(p)} onNewProducto={() => setEditingProducto('new')} setView={setView}
            />
          ) : view === 'telas' ? (
            <TelasView
              telas={catalogoData.telas} loading={catalogoData.loadingTelas} error={catalogoData.errorTelas}
              onReload={() => catalogoData.fetchTelas()} onEditTela={(t) => setEditingTela(t)} onNewTela={() => setEditingTela('new')} setView={setView}
            />
          ) : view === 'nuevo' ? (
            <NuevoPresupuestoView
              productos={catalogoData.productos} config={configData.config} token={session.token} isDemo={session.isDemo}
              initialData={presupuestosData.presupuestoInitialData} onSubmitPresupuesto={async (payload) => { await presupuestosData.createPresupuesto(payload) }} setView={setView}
            />
          ) : view === 'historial' ? (
            <HistorialView
              presupuestos={presupuestosData.presupuestos} loading={presupuestosData.loadingPresupuestos} error={presupuestosData.errorPresupuestos}
              token={session.token} onReload={() => presupuestosData.fetchPresupuestos()} onSelectPresupuesto={setSelectedPresupuesto} setView={setView}
            />
          ) : (
            <ConfiguracionView
              config={configData.config} tiposEstampado={configData.tecnicasDisponibles} token={session.token} isDemo={session.isDemo}
              onConfigActualizada={(updatedDemoConfig) => {
                if (session.isDemo && updatedDemoConfig) {
                  configData.saveConfiguracion(updatedDemoConfig as any, updatedDemoConfig)
                } else {
                  configData.fetchConfig(); configData.fetchTiposEstampado(); catalogoData.fetchProductos()
                }
              }}
              setView={(v) => setView(v as ViewId)}
            />
          )}
        </div>
      </main>

      {editingTela && (
        <ModalTela
          tela={editingTela === 'new' ? null : editingTela} onSave={(data) => catalogoData.saveTela(data, editingTela)}
          onDelete={editingTela === 'new' ? undefined : (id) => catalogoData.deleteTela(id)} onClose={() => setEditingTela(null)}
        />
      )}
      {editingProducto && (
        <ModalProducto
          producto={editingProducto === 'new' ? null : editingProducto} telas={catalogoData.telas} tiposEstampado={configData.tecnicasDisponibles}
          onSave={(data) => catalogoData.saveProducto(data, editingProducto)} onDelete={editingProducto === 'new' ? undefined : (id) => catalogoData.deleteProducto(id)} onClose={() => setEditingProducto(null)}
        />
      )}
      {selectedPresupuesto && (
        <ModalDetallePresupuesto
          presupuesto={selectedPresupuesto} token={session.token}
          onRecotizar={async (p) => { await presupuestosData.prepareRecotizacion(p); setSelectedPresupuesto(null); setView('nuevo') }}
          onDelete={async (id) => { await presupuestosData.deletePresupuesto(id); setSelectedPresupuesto(null) }} onClose={() => setSelectedPresupuesto(null)}
        />
      )}
    </div>
  )
}
