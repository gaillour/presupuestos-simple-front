'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ChevronRight,
  Menu,
  Moon,
  RefreshCw,
  Sun,
} from 'lucide-react'
import type { Producto, Presupuesto, Tela, Configuracion, TipoEstampado } from '@/lib/types'
import {
  obtenerTecnicasEstampado,
  calcularCostoEstampadoDesdeConfig,
  calcularPrecioUnitarioProducto,
} from '@/lib/pricing'
import { API_BASE, getGreetingName, isTokenExpired } from '@/lib/utils'
import { DEMO_TELAS, DEMO_PRODUCTOS, DEMO_PRESUPUESTOS } from '@/lib/demo-data'

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

export default function Page() {
  const [auth, setAuth] = useState(false)
  const [isDemo, setIsDemo] = useState(false)
  const [token, setToken] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [sessionNotice, setSessionNotice] = useState<string | null>(null)
  const [view, setView] = useState('dashboard')
  const [dark, setDark] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Estados de datos de la API
  const [telas, setTelas] = useState<Tela[]>([])
  const [loadingTelas, setLoadingTelas] = useState<boolean>(false)
  const [errorTelas, setErrorTelas] = useState<string | null>(null)

  const [productos, setProductos] = useState<Producto[]>([])
  const [loadingProductos, setLoadingProductos] = useState<boolean>(false)
  const [errorProductos, setErrorProductos] = useState<string | null>(null)

  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([])
  const [loadingPresupuestos, setLoadingPresupuestos] = useState<boolean>(false)
  const [errorPresupuestos, setErrorPresupuestos] = useState<string | null>(null)

  const [config, setConfig] = useState<Configuracion | null>(null)
  const [loadingConfig, setLoadingConfig] = useState<boolean>(false)

  const [tiposEstampado, setTiposEstampado] = useState<TipoEstampado[]>(() =>
    obtenerTecnicasEstampado(null)
  )
  const [loadingTiposEstampado, setLoadingTiposEstampado] = useState<boolean>(false)

  // Estados de modales interactivos
  const [editingTela, setEditingTela] = useState<Tela | null | 'new'>(null)
  const [editingProducto, setEditingProducto] = useState<Producto | null | 'new'>(null)
  const [selectedPresupuesto, setSelectedPresupuesto] = useState<Presupuesto | null>(null)

  // Datos precargados para el cotizador
  const [presupuestoInitialData, setPresupuestoInitialData] = useState<{
    cliente: string
    multiplicador: number
    costoFijo: number
    descripcion_pdf?: string
    items: Array<{ producto_id: number; cantidad: number; detalle_estampado: string }>
  } | null>(null)

  const handleSessionExpired = useCallback((message?: string) => {
    setAuth(false)
    setIsDemo(false)
    setToken('')
    setUserEmail('')
    setTelas([])
    setProductos([])
    setPresupuestos([])
    setLoadingTelas(false)
    setLoadingProductos(false)
    setLoadingPresupuestos(false)
    setLoadingConfig(false)
    try {
      localStorage.removeItem('simple_mdq_auth')
      localStorage.removeItem('simple_mdq_token')
      localStorage.removeItem('simple_mdq_email')
    } catch {}
    setSessionNotice(message || 'Tu sesión expiró. Por favor, iniciá sesión nuevamente.')
  }, [])

  const getHeaders = useCallback(
    (customToken?: string) => {
      const active = customToken !== undefined ? customToken : token
      const h: Record<string, string> = { 'Content-Type': 'application/json' }
      if (active) h['Authorization'] = `Bearer ${active}`
      return h
    },
    [token]
  )

  const fetchTelas = useCallback(
    async (customToken?: string) => {
      const active = customToken !== undefined ? customToken : token
      if (!active) return
      setLoadingTelas(true)
      setErrorTelas(null)
      try {
        const res = await fetch(`${API_BASE}/api/telas`, { headers: getHeaders(active) })
        if (res.status === 401 || res.status === 403) {
          handleSessionExpired('Tu sesión expiró. Por favor, iniciá sesión nuevamente.')
          return
        }
        if (!res.ok) throw new Error('Error al obtener telas')
        const data = await res.json()
        setTelas(Array.isArray(data) ? data : [])
      } catch (err: any) {
        setErrorTelas(err.message || 'Error de conexión')
      } finally {
        setLoadingTelas(false)
      }
    },
    [getHeaders, token, handleSessionExpired]
  )

  const fetchProductos = useCallback(
    async (customToken?: string) => {
      const active = customToken !== undefined ? customToken : token
      if (!active) return
      setLoadingProductos(true)
      setErrorProductos(null)
      try {
        const res = await fetch(`${API_BASE}/api/productos`, { headers: getHeaders(active) })
        if (res.status === 401 || res.status === 403) {
          handleSessionExpired('Tu sesión expiró. Por favor, iniciá sesión nuevamente.')
          return
        }
        if (!res.ok) throw new Error('Error al obtener productos')
        const data = await res.json()
        setProductos(Array.isArray(data) ? data : [])
      } catch (err: any) {
        setErrorProductos(err.message || 'Error de conexión')
      } finally {
        setLoadingProductos(false)
      }
    },
    [getHeaders, token, handleSessionExpired]
  )

  const fetchPresupuestos = useCallback(
    async (customToken?: string) => {
      const active = customToken !== undefined ? customToken : token
      if (!active) return
      setLoadingPresupuestos(true)
      setErrorPresupuestos(null)
      try {
        const res = await fetch(`${API_BASE}/api/presupuestos`, { headers: getHeaders(active) })
        if (res.status === 401 || res.status === 403) {
          handleSessionExpired('Tu sesión expiró. Por favor, iniciá sesión nuevamente.')
          return
        }
        if (!res.ok) throw new Error('Error al obtener presupuestos')
        const data = await res.json()
        setPresupuestos(Array.isArray(data) ? data : [])
      } catch (err: any) {
        setErrorPresupuestos(err.message || 'Error de conexión')
      } finally {
        setLoadingPresupuestos(false)
      }
    },
    [getHeaders, token, handleSessionExpired]
  )

  const fetchTiposEstampado = useCallback(
    async (customToken?: string) => {
      const active = customToken !== undefined ? customToken : token
      if (!active) return
      setLoadingTiposEstampado(true)
      try {
        const res = await fetch(`${API_BASE}/api/tipos-estampado`, { headers: getHeaders(active) })
        if (res.status === 401 || res.status === 403) {
          handleSessionExpired('Tu sesión expiró. Por favor, iniciá sesión nuevamente.')
          return
        }
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) {
            setTiposEstampado((prev) => obtenerTecnicasEstampado(null, data))
          }
        }
      } catch {} finally {
        setLoadingTiposEstampado(false)
      }
    },
    [getHeaders, token, handleSessionExpired]
  )

  const fetchConfig = useCallback(
    async (customToken?: string) => {
      const active = customToken !== undefined ? customToken : token
      if (!active) return
      setLoadingConfig(true)
      try {
        const res = await fetch(`${API_BASE}/api/configuracion`, { headers: getHeaders(active) })
        if (res.status === 401 || res.status === 403) {
          handleSessionExpired('Tu sesión expiró. Por favor, iniciá sesión nuevamente.')
          return
        }
        if (res.ok) {
          const data = await res.json()
          setConfig(data)
          if (Array.isArray(data?.tipos_estampado) && data.tipos_estampado.length > 0) {
            setTiposEstampado(obtenerTecnicasEstampado(data, data.tipos_estampado))
          }
        }
      } catch {} finally {
        setLoadingConfig(false)
      }
    },
    [getHeaders, token, handleSessionExpired]
  )

  const loadAllData = useCallback(
    (customToken?: string) => {
      const active = customToken !== undefined ? customToken : token
      if (!active) return
      fetchTelas(active)
      fetchProductos(active)
      fetchPresupuestos(active)
      fetchConfig(active)
      fetchTiposEstampado(active)
    },
    [fetchTelas, fetchProductos, fetchPresupuestos, fetchConfig, fetchTiposEstampado, token]
  )

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
        setAuth(true)
        setIsDemo(false)
        setToken(savedToken)
        if (savedEmail) setUserEmail(savedEmail)
      } else {
        setAuth(false)
        setIsDemo(false)
        setToken('')
        setUserEmail('')
        localStorage.removeItem('simple_mdq_auth')
        localStorage.removeItem('simple_mdq_token')
        localStorage.removeItem('simple_mdq_email')
      }
    } catch {}
  }, [handleSessionExpired])

  const loadedTokenRef = useRef<string | null>(null)

  useEffect(() => {
    if (auth && !isDemo && token) {
      if (loadedTokenRef.current !== token) {
        loadedTokenRef.current = token
        loadAllData(token)
      }
    } else {
      loadedTokenRef.current = null
    }
  }, [auth, isDemo, token, loadAllData])

  const handleLogin = (jwtToken: string, email: string) => {
    setSessionNotice(null)
    setAuth(true)
    setIsDemo(false)
    const activeToken = jwtToken || ''
    const activeEmail = email || 'Administrador'
    setToken(activeToken)
    setUserEmail(activeEmail)

    try {
      localStorage.setItem('simple_mdq_auth', 'true')
      if (activeToken) localStorage.setItem('simple_mdq_token', activeToken)
      if (activeEmail) localStorage.setItem('simple_mdq_email', activeEmail)
    } catch {}

    loadAllData(activeToken)
  }

  const handleEnterDemo = () => {
    setSessionNotice(null)
    setAuth(true)
    setIsDemo(true)
    setToken('')
    setUserEmail('Administrador')
    setTelas(DEMO_TELAS)
    setProductos(DEMO_PRODUCTOS)
    setPresupuestos(DEMO_PRESUPUESTOS)
    setTiposEstampado(obtenerTecnicasEstampado(null))
    setConfig({
      costo_fijo: 6000,
      multiplicador: 2.0,
      precio_metro_dtf: 10000,
      precio_metro_sublimacion: 2900,
      precio_unidad_serigrafia: 1500,
      precio_unidad_bordado: 2500,
      descripcion_pdf: 'Presupuesto de demostración textil.',
    })
  }

  const handleLogout = () => {
    setSessionNotice(null)
    setAuth(false)
    setIsDemo(false)
    setToken('')
    setUserEmail('')
    setTelas([])
    setProductos([])
    setPresupuestos([])
    setMobileMenuOpen(false)
    try {
      localStorage.removeItem('simple_mdq_auth')
      localStorage.removeItem('simple_mdq_token')
      localStorage.removeItem('simple_mdq_email')
    } catch {}
  }

  // Operaciones CRUD de Telas
  const handleSaveTela = async (data: { nombre: string; precio_kilo: number; rendimiento: number; descripcion: string }) => {
    if (isDemo) {
      const isEdit = editingTela && editingTela !== 'new'
      const precioMetro = data.rendimiento > 0 ? data.precio_kilo / data.rendimiento : 0
      if (isEdit) {
        setTelas(
          telas.map((t) =>
            t.id === editingTela.id ? { ...t, ...data, precio_metro: precioMetro } : t
          )
        )
      } else {
        const nextId = telas.length > 0 ? Math.max(...telas.map((t) => t.id)) + 1 : 1
        setTelas([...telas, { id: nextId, ...data, precio_metro: precioMetro }])
      }
      return
    }

    const isEdit = editingTela && editingTela !== 'new'
    const url = isEdit ? `${API_BASE}/api/telas/${editingTela.id}` : `${API_BASE}/api/telas`
    const method = isEdit ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: getHeaders(),
      body: JSON.stringify(data),
    })

    if (res.status === 401 || res.status === 403) {
      handleSessionExpired('Tu sesión expiró. Por favor, iniciá sesión nuevamente.')
      return
    }

    if (!res.ok) {
      const err = await res.json().catch(() => null)
      throw new Error(err?.detail || 'Error al guardar la tela')
    }

    await fetchTelas()
    await fetchProductos()
  }

  const handleDeleteTela = async (id: number) => {
    if (isDemo) {
      setTelas(telas.filter((t) => t.id !== id))
      return
    }

    const res = await fetch(`${API_BASE}/api/telas/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    })

    if (res.status === 401 || res.status === 403) {
      handleSessionExpired('Tu sesión expiró. Por favor, iniciá sesión nuevamente.')
      return
    }

    if (!res.ok) {
      const err = await res.json().catch(() => null)
      throw new Error(err?.detail || 'Error al eliminar la tela')
    }

    await fetchTelas()
    await fetchProductos()
  }

  // Operaciones CRUD de Productos
  const handleSaveProducto = async (data: {
    nombre: string
    tela_id: number
    consumo_metros: number
    tela_secundaria_id: number | null
    consumo_metros_secundaria: number
    costo_confeccion: number
    tipo_estampado: string
    consumo_estampado: number
    nombre_avio: string
    costo_avio: number
  }) => {
    if (isDemo) {
      const telaObj: Tela = telas.find((t) => t.id === data.tela_id) || {
        id: data.tela_id,
        nombre: 'Tela Demo',
        descripcion: '',
        precio_kilo: 0,
        rendimiento: 1,
        precio_metro: 0,
      }
      const telaSecObj: Tela | null =
        data.tela_secundaria_id && data.consumo_metros_secundaria > 0
          ? telas.find((t) => t.id === data.tela_secundaria_id) || null
          : null
      const costoTela =
        (telaObj.precio_metro || 0) * data.consumo_metros +
        (telaSecObj ? (telaSecObj.precio_metro || 0) * data.consumo_metros_secundaria : 0)
      const costoBase = costoTela + data.costo_confeccion + data.costo_avio
      const costoEst = calcularCostoEstampadoDesdeConfig(
        data.tipo_estampado,
        data.consumo_estampado,
        config,
        tiposEstampado
      )
      const mult = config?.multiplicador ?? 2.0
      const fijo = config?.costo_fijo ?? 6000
      const precioVenta = (costoBase + costoEst) * mult + fijo
      const isEdit = editingProducto && editingProducto !== 'new'
      if (isEdit) {
        setProductos(
          productos.map((p) =>
            p.id === editingProducto.id
              ? {
                  ...p,
                  ...data,
                  tela: telaObj,
                  tela_secundaria: telaSecObj,
                  consumo_metros_secundaria: telaSecObj ? data.consumo_metros_secundaria : 0,
                  costo_tela: costoTela,
                  costo_base: costoBase,
                  costo_estampado: costoEst,
                  costo_produccion: costoBase + costoEst,
                  precio_venta: precioVenta,
                }
              : p
          )
        )
      } else {
        const nextId = productos.length > 0 ? Math.max(...productos.map((p) => p.id)) + 1 : 1
        setProductos([
          ...productos,
          {
            id: nextId,
            ...data,
            tela: telaObj,
            tela_secundaria: telaSecObj,
            consumo_metros_secundaria: telaSecObj ? data.consumo_metros_secundaria : 0,
            costo_tela: costoTela,
            costo_base: costoBase,
            costo_estampado: costoEst,
            costo_produccion: costoBase + costoEst,
            precio_venta: precioVenta,
          },
        ])
      }
      return
    }

    const isEdit = editingProducto && editingProducto !== 'new'
    const url = isEdit ? `${API_BASE}/api/productos/${editingProducto.id}` : `${API_BASE}/api/productos`
    const method = isEdit ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: getHeaders(),
      body: JSON.stringify(data),
    })

    if (res.status === 401 || res.status === 403) {
      handleSessionExpired('Tu sesión expiró. Por favor, iniciá sesión nuevamente.')
      return
    }

    if (!res.ok) {
      const err = await res.json().catch(() => null)
      throw new Error(err?.detail || 'Error al guardar el producto')
    }

    await fetchProductos()
  }

  const handleDeleteProducto = async (id: number) => {
    if (isDemo) {
      setProductos(productos.filter((p) => p.id !== id))
      return
    }

    const res = await fetch(`${API_BASE}/api/productos/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    })

    if (res.status === 401 || res.status === 403) {
      handleSessionExpired('Tu sesión expiró. Por favor, iniciá sesión nuevamente.')
      return
    }

    if (!res.ok) {
      const err = await res.json().catch(() => null)
      throw new Error(err?.detail || 'Error al eliminar el producto')
    }

    await fetchProductos()
  }

  // Operaciones CRUD de Presupuestos
  const handleDeletePresupuesto = async (id: number) => {
    if (isDemo) {
      setPresupuestos(presupuestos.filter((p) => p.id !== id))
      return
    }

    const res = await fetch(`${API_BASE}/api/presupuestos/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    })

    if (res.status === 401 || res.status === 403) {
      handleSessionExpired('Tu sesión expiró. Por favor, iniciá sesión nuevamente.')
      return
    }

    if (!res.ok) {
      const err = await res.json().catch(() => null)
      throw new Error(err?.detail || 'Error al eliminar el presupuesto')
    }

    await fetchPresupuestos()
  }

  const handleCreateDemoPresupuesto = (
    cliente: string,
    mult: number,
    fijo: number,
    items: Array<{ producto_id: number; cantidad: number }>,
    descripcionPdf?: string
  ) => {
    let total = 0
    for (const it of items) {
      const p = productos.find((prod) => prod.id === it.producto_id)
      if (p) {
        total += calcularPrecioUnitarioProducto(p, mult, fijo) * it.cantidad
      }
    }
    const nextId = presupuestos.length > 0 ? Math.max(...presupuestos.map((p) => p.id)) + 1 : 1
    const nuevo: Presupuesto = {
      id: nextId,
      cliente_referencia: cliente,
      multiplicador: mult,
      costo_fijo: fijo,
      precio_total: total,
      created_at: new Date().toISOString(),
      descripcion_pdf: descripcionPdf,
    }
    setPresupuestos([nuevo, ...presupuestos])
    setPresupuestoInitialData(null)
    setView('historial')
  }

  const handleRecotizarPresupuesto = async (p: Presupuesto) => {
    if (isDemo) {
      setPresupuestoInitialData({
        cliente: p.cliente_referencia,
        multiplicador: p.multiplicador,
        costoFijo: p.costo_fijo,
        descripcion_pdf: p.descripcion_pdf,
        items: productos.length > 0 ? [{ producto_id: productos[0].id, cantidad: 10, detalle_estampado: '' }] : [],
      })
      setView('nuevo')
      return
    }

    try {
      const res = await fetch(`${API_BASE}/api/presupuestos/${p.id}`, {
        headers: getHeaders(),
      })
      if (res.status === 401 || res.status === 403) {
        handleSessionExpired('Tu sesión expiró. Por favor, iniciá sesión nuevamente.')
        return
      }
      if (res.ok) {
        const data = await res.json()
        const detalles = data.detalles || []
        setPresupuestoInitialData({
          cliente: p.cliente_referencia,
          multiplicador: p.multiplicador,
          costoFijo: p.costo_fijo,
          descripcion_pdf: data.presupuesto?.descripcion_pdf ?? p.descripcion_pdf,
          items: detalles.map((d: any) => ({
            producto_id: d.producto_id,
            cantidad: d.cantidad,
            detalle_estampado: '',
          })),
        })
      } else {
        setPresupuestoInitialData({
          cliente: p.cliente_referencia,
          multiplicador: p.multiplicador,
          costoFijo: p.costo_fijo,
          descripcion_pdf: p.descripcion_pdf,
          items: [],
        })
      }
    } catch {
      setPresupuestoInitialData({
        cliente: p.cliente_referencia,
        multiplicador: p.multiplicador,
        costoFijo: p.costo_fijo,
        descripcion_pdf: p.descripcion_pdf,
        items: [],
      })
    }
    setView('nuevo')
  }

  const isSyncing =
    !isDemo &&
    auth &&
    (loadingTelas || loadingProductos || loadingPresupuestos || loadingConfig || loadingTiposEstampado)

  const isInitialLoading =
    isSyncing &&
    telas.length === 0 &&
    productos.length === 0 &&
    presupuestos.length === 0

  const [isColdStarting, setIsColdStarting] = useState(false)

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined
    if (isInitialLoading) {
      timer = setTimeout(() => {
        setIsColdStarting(true)
      }, 2500)
    } else {
      setIsColdStarting(false)
    }
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [isInitialLoading])

  if (!auth) {
    return (
      <LoginView
        onLogin={handleLogin}
        onEnterDemo={handleEnterDemo}
        notice={sessionNotice}
      />
    )
  }

  const displayName = getGreetingName(userEmail, isDemo)
  const tecnicasDisponibles =
    tiposEstampado.length > 0 ? tiposEstampado : obtenerTecnicasEstampado(config)

  return (
    <div className={dark ? 'app dark' : 'app'}>
      <Sidebar
        view={view}
        setView={setView}
        onLogout={handleLogout}
        telasCount={telas.length}
        productosCount={productos.length}
        presupuestosCount={presupuestos.length}
        displayName={displayName}
        userEmail={userEmail}
        isDemo={isDemo}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />
      <main className="shell">
        <header className="topbar">
          <button
            type="button"
            className="mobile-menu icon-btn"
            onClick={() => setMobileMenuOpen(true)}
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
              onClick={() => setDark(!dark)}
              aria-label="Cambiar tema"
            >
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <div className="top-avatar" title={displayName}>
              {displayName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="page-content">
          {view === 'dashboard' ? (
            <DashboardView
              setView={setView}
              telas={telas}
              productos={productos}
              presupuestos={presupuestos}
              config={config}
              displayName={displayName}
              onSelectPresupuesto={setSelectedPresupuesto}
              loadingTelas={loadingTelas}
              loadingProductos={loadingProductos}
              loadingPresupuestos={loadingPresupuestos}
              loadingConfig={loadingConfig}
            />
          ) : view === 'catalogo' ? (
            <CatalogoView
              productos={productos}
              loading={loadingProductos}
              error={errorProductos}
              onReload={() => fetchProductos()}
              onEditProducto={(p) => setEditingProducto(p)}
              onNewProducto={() => setEditingProducto('new')}
              setView={setView}
            />
          ) : view === 'telas' ? (
            <TelasView
              telas={telas}
              loading={loadingTelas}
              error={errorTelas}
              onReload={() => fetchTelas()}
              onEditTela={(t) => setEditingTela(t)}
              onNewTela={() => setEditingTela('new')}
              setView={setView}
            />
          ) : view === 'nuevo' ? (
            <NuevoPresupuestoView
              productos={productos}
              config={config}
              token={token}
              isDemo={isDemo}
              initialData={presupuestoInitialData}
              onPresupuestoCreado={() => {
                setPresupuestoInitialData(null)
                fetchPresupuestos()
              }}
              onCreateDemoPresupuesto={handleCreateDemoPresupuesto}
              setView={setView}
            />
          ) : view === 'historial' ? (
            <HistorialView
              presupuestos={presupuestos}
              loading={loadingPresupuestos}
              error={errorPresupuestos}
              token={token}
              onReload={() => fetchPresupuestos()}
              onSelectPresupuesto={setSelectedPresupuesto}
              setView={setView}
            />
          ) : (
            <ConfiguracionView
              config={config}
              tiposEstampado={tecnicasDisponibles}
              token={token}
              isDemo={isDemo}
              apiBase={API_BASE}
              onConfigActualizada={(updatedDemoConfig) => {
                if (isDemo && updatedDemoConfig) {
                  setConfig(updatedDemoConfig)
                  if (updatedDemoConfig.tipos_estampado) {
                    setTiposEstampado(
                      obtenerTecnicasEstampado(
                        updatedDemoConfig,
                        updatedDemoConfig.tipos_estampado
                      )
                    )
                  }
                  setProductos((prev) =>
                    prev.map((p) => {
                      const cEst = calcularCostoEstampadoDesdeConfig(
                        p.tipo_estampado,
                        p.consumo_estampado,
                        updatedDemoConfig,
                        updatedDemoConfig.tipos_estampado
                      )
                      const pVenta =
                        (p.costo_base + cEst) * updatedDemoConfig.multiplicador +
                        updatedDemoConfig.costo_fijo
                      return {
                        ...p,
                        costo_estampado: cEst,
                        costo_produccion: p.costo_base + cEst,
                        precio_venta: pVenta,
                      }
                    })
                  )
                  return
                }
                fetchConfig()
                fetchTiposEstampado()
                fetchProductos()
              }}
              setView={setView}
            />
          )}
        </div>
      </main>

      {/* Modal: Editar o Crear Tela */}
      {editingTela && (
        <ModalTela
          tela={editingTela === 'new' ? null : editingTela}
          onSave={handleSaveTela}
          onDelete={editingTela === 'new' ? undefined : handleDeleteTela}
          onClose={() => setEditingTela(null)}
        />
      )}

      {/* Modal: Editar o Crear Producto */}
      {editingProducto && (
        <ModalProducto
          producto={editingProducto === 'new' ? null : editingProducto}
          telas={telas}
          tiposEstampado={tecnicasDisponibles}
          onSave={handleSaveProducto}
          onDelete={editingProducto === 'new' ? undefined : handleDeleteProducto}
          onClose={() => setEditingProducto(null)}
        />
      )}

      {/* Modal: Detalle, Recotización y Eliminación de Presupuesto */}
      {selectedPresupuesto && (
        <ModalDetallePresupuesto
          presupuesto={selectedPresupuesto}
          token={token}
          onRecotizar={handleRecotizarPresupuesto}
          onDelete={handleDeletePresupuesto}
          onClose={() => setSelectedPresupuesto(null)}
        />
      )}
    </div>
  )
}
