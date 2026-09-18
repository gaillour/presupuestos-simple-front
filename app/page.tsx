'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  AlertCircle,
  Bell,
  Calculator,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileDown,
  Home,
  LogOut,
  Menu,
  Moon,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings,
  Shirt,
  Sun,
  Table2,
  Trash2,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react'
import type { Producto, Presupuesto, Tela, Configuracion } from '@/lib/types'

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/api\/?$/, '')

const money = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 2,
})

/**
 * 1. Pantalla de Login Básico
 */
function LoginView({
  onLogin,
}: {
  onLogin: (token?: string, userEmail?: string) => void
}) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [remember, setRemember] = useState(true)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const cleanUser = username.trim()

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanUser, password }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.access_token) {
          onLogin(data.access_token, data.user?.email || cleanUser)
          setLoading(false)
          return
        }
      } else {
        const errorData = await res.json().catch(() => null)
        if (cleanUser === 'admin' && password === 'admin') {
          onLogin('', 'admin')
          setLoading(false)
          return
        }
        setError(
          errorData?.detail || 'Credenciales incorrectas. Verificá tu usuario y contraseña.'
        )
        setLoading(false)
        return
      }
    } catch {
      if (cleanUser === 'admin' && password === 'admin') {
        onLogin('', 'admin')
        setLoading(false)
        return
      }
      setError('No se pudo conectar con el servidor. Verificá tu conexión o ingresá como admin / admin.')
      setLoading(false)
      return
    }

    setLoading(false)
  }

  const handleDemo = () => {
    setUsername('admin')
    setPassword('admin')
    setError('')
    onLogin('', 'admin')
  }

  return (
    <main className="login-page">
      <div className="login-card">
        <div className="brand-mark">S</div>
        <p className="eyebrow">SIMPLE MDQ</p>
        <h1>Bienvenido de nuevo</h1>
        <p className="muted">Sistema de Gestión & Cotizaciones Textiles</p>

        <form onSubmit={handleSubmit}>
          {error && (
            <div
              className="alert"
              style={{
                margin: '0 0 16px',
                color: '#f87171',
                borderColor: '#f8717140',
                background: '#f8717115',
              }}
            >
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <label>
            Usuario / Email
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
                if (error) setError('')
              }}
              placeholder="admin o usuario@ejemplo.com"
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

        <button className="demo" type="button" onClick={handleDemo}>
          Entrar como Demo (admin / admin)
        </button>
      </div>
    </main>
  )
}

function Sidebar({
  view,
  setView,
  onLogout,
  telasCount,
  productosCount,
  presupuestosCount,
  userEmail,
}: {
  view: string
  setView: (v: string) => void
  onLogout: () => void
  telasCount: number
  productosCount: number
  presupuestosCount: number
  userEmail: string
}) {
  const items = [
    [Home, 'Dashboard', 'dashboard'],
    [Shirt, 'Catálogo de Productos', 'catalogo'],
    [Table2, 'Telas & Rendimientos', 'telas'],
    [Zap, 'Nuevo Presupuesto', 'nuevo'],
    [FileDown, 'Historial de Presupuestos', 'historial'],
    [Settings, 'Configuración General', 'config'],
  ] as const

  return (
    <aside className="sidebar">
      <div className="logo">
        <span className="brand-mark small">S</span>
        <div>
          <strong>SIMPLE MDQ</strong>
          <small>GESTIÓN TEXTIL</small>
        </div>
      </div>
      <div className="api">
        <span /> Sistema Conectado
      </div>
      <nav>
        {items.map(([Icon, label, id]) => (
          <button
            key={id}
            className={view === id ? 'nav-item active' : 'nav-item'}
            onClick={() => setView(id)}
          >
            <Icon size={18} />
            {label}
            {id === 'catalogo' && productosCount > 0 && <b>{productosCount}</b>}
            {id === 'telas' && telasCount > 0 && <b>{telasCount}</b>}
            {id === 'historial' && presupuestosCount > 0 && <b>{presupuestosCount}</b>}
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="profile">
          <div className="avatar">A</div>
          <div>
            <strong>{userEmail || 'Administrador'}</strong>
            <small>Sesión activa</small>
          </div>
        </div>
        <button className="logout" onClick={onLogout}>
          <LogOut size={16} /> Cerrar sesión
        </button>
      </div>
    </aside>
  )
}

function Metric({
  label,
  value,
  note,
  icon: Icon,
  accent,
}: {
  label: string
  value: string
  note: string
  icon: typeof Activity
  accent: string
}) {
  return (
    <div className="metric">
      <div className={'metric-icon ' + accent}>
        <Icon size={18} />
      </div>
      <p>{label}</p>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  )
}

function CalculatorWidget({
  productos,
  setView,
}: {
  productos: Producto[]
  setView: (v: string) => void
}) {
  const [productId, setProductId] = useState<number>(productos[0]?.id ?? 0)
  const [quantity, setQuantity] = useState(15)

  useEffect(() => {
    if (productos.length > 0 && (!productId || !productos.some((p) => p.id === productId))) {
      setProductId(productos[0].id)
    }
  }, [productos, productId])

  const product = productos.find((p) => p.id === productId) ?? productos[0]
  const total = product ? product.precio_venta * quantity : 0

  if (productos.length === 0) {
    return (
      <section className="card calculator">
        <div className="section-heading">
          <div>
            <p className="eyebrow">COTIZADOR RÁPIDO</p>
            <h2>Simulá una cotización</h2>
          </div>
          <Calculator size={20} />
        </div>
        <div style={{ padding: '24px 20px', textAlign: 'center', color: 'var(--muted)' }}>
          <p style={{ margin: '0 0 8px', fontWeight: 600 }}>Sin modelos en catálogo</p>
          <small style={{ display: 'block', marginBottom: '16px' }}>
            Los productos cargados en el catálogo aparecerán disponibles para cotizar.
          </small>
          <button className="secondary full" onClick={() => setView('telas')}>
            Ver Telas & Rendimientos
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="card calculator">
      <div className="section-heading">
        <div>
          <p className="eyebrow">COTIZADOR RÁPIDO</p>
          <h2>Simulá una cotización</h2>
        </div>
        <Calculator size={20} />
      </div>
      <div className="form-row">
        <label>
          Prenda
          <select
            value={productId}
            onChange={(e) => setProductId(Number(e.target.value))}
          >
            {productos.map((p) => (
              <option value={p.id} key={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </label>
        <label>
          Unidades
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
          />
        </label>
      </div>
      <div className="calc-breakdown">
        <div>
          <span>Costo base + tela</span>
          <strong>{money.format(product.costo_base)}</strong>
        </div>
        <div>
          <span>Estampa ({product.tipo_estampado})</span>
          <strong>{money.format(product.costo_estampado)}</strong>
        </div>
        <div>
          <span>Precio unitario final</span>
          <strong className="green">{money.format(product.precio_venta)}</strong>
        </div>
      </div>
      <div className="calc-total">
        <span>
          Total estimado <small>{quantity} unidades</small>
        </span>
        <strong>{money.format(total)}</strong>
      </div>
      <button className="primary full" onClick={() => setView('nuevo')}>
        <Plus size={16} /> Pasar a presupuesto formal
      </button>
    </section>
  )
}

function Dashboard({
  setView,
  telas,
  productos,
  presupuestos,
  config,
  onSelectPresupuesto,
}: {
  setView: (v: string) => void
  telas: Tela[]
  productos: Producto[]
  presupuestos: Presupuesto[]
  config: Configuracion | null
  onSelectPresupuesto: (p: Presupuesto) => void
}) {
  const totalCotizado = useMemo(() => {
    return presupuestos.reduce((acc, p) => acc + (p.precio_total || 0), 0)
  }, [presupuestos])

  return (
    <>
      <div className="welcome">
        <div>
          <p className="eyebrow">PANEL GENERAL</p>
          <h1>Buen día, Administrador</h1>
          <p className="muted">Resumen operativo y comercial de SIMPLE MDQ.</p>
        </div>
        <button className="primary" onClick={() => setView('nuevo')}>
          <Plus size={17} /> Nueva cotización
        </button>
      </div>

      <div className="metrics">
        <Metric
          label="Telas registradas"
          value={`${telas.length} telas`}
          note="Catálogo de insumos"
          icon={Table2}
          accent="violet"
        />
        <Metric
          label="Prendas en catálogo"
          value={`${productos.length} modelos`}
          note="Listos para cotizar"
          icon={Shirt}
          accent="blue"
        />
        <Metric
          label="Presupuestos emitidos"
          value={`${presupuestos.length} cotizaciones`}
          note="Historial general"
          icon={Package}
          accent="amber"
        />
        <Metric
          label="Total cotizado"
          value={money.format(totalCotizado)}
          note="Suma de presupuestos"
          icon={TrendingUp}
          accent="green"
        />
      </div>

      <div className="content-grid">
        <div className="main-column">
          <div className="quick-actions">
            <button className="primary" onClick={() => setView('nuevo')}>
              <Plus size={16} /> Generar presupuesto
            </button>
            <button className="secondary" onClick={() => setView('catalogo')}>
              <Shirt size={16} /> Ver catálogo ({productos.length})
            </button>
            <button className="secondary" onClick={() => setView('telas')}>
              <Table2 size={16} /> Telas & Rendimientos ({telas.length})
            </button>
          </div>

          <section className="card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">ACTIVIDAD RECIENTE</p>
                <h2>Últimos presupuestos</h2>
              </div>
              <button className="link" onClick={() => setView('historial')}>
                Ver historial completo <ChevronRight size={14} />
              </button>
            </div>

            {presupuestos.length === 0 ? (
              <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--muted)' }}>
                <p style={{ margin: '0 0 6px', fontWeight: 600 }}>No hay presupuestos registrados</p>
                <small>Las cotizaciones que generes se reflejarán automáticamente en este panel.</small>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th># ID</th>
                      <th>Cliente</th>
                      <th>Fecha</th>
                      <th>Multiplicador</th>
                      <th>Total</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {presupuestos.slice(0, 6).map((q) => (
                      <tr key={q.id}>
                        <td className="id">#{q.id}</td>
                        <td>
                          <strong>{q.cliente_referencia}</strong>
                        </td>
                        <td>{new Date(q.created_at).toLocaleDateString('es-AR')}</td>
                        <td>{Number(q.multiplicador).toFixed(1)}x</td>
                        <td>
                          <strong>{money.format(q.precio_total)}</strong>
                        </td>
                        <td>
                          <button
                            className="secondary btn-sm"
                            onClick={() => onSelectPresupuesto(q)}
                          >
                            <Eye size={13} /> Ver Detalle
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <div className="right-column">
          <CalculatorWidget productos={productos} setView={setView} />

          <section className="card supplies">
            <div className="section-heading">
              <div>
                <p className="eyebrow">INSUMOS & TÉCNICAS</p>
                <h2>Costos vigentes</h2>
              </div>
              <button className="icon-btn" onClick={() => setView('config')} title="Editar costos">
                <Pencil size={15} />
              </button>
            </div>

            {[
              ['DTF × metro', money.format(config?.precio_metro_dtf ?? 0), 'violet'],
              ['Sublimación × metro', money.format(config?.precio_metro_sublimacion ?? 0), 'blue'],
              ['Serigrafía × unidad', money.format(config?.precio_unidad_serigrafia ?? 0), 'amber'],
              ['Bordado × unidad', money.format(config?.precio_unidad_bordado ?? 0), 'green'],
            ].map(([name, price, color]) => (
              <div className="supply" key={name}>
                <span className={'dot ' + color} />
                <span>{name}</span>
                <strong>{price}</strong>
              </div>
            ))}

            <div
              className="alert"
              onClick={() => setView('telas')}
              style={{ cursor: 'pointer', margin: '14px 20px' }}
            >
              <Activity size={15} />
              <span>
                <strong>{telas.length} telas registradas en catálogo</strong>
                <small>Hacé clic para revisar rendimientos y costos por kilo.</small>
              </span>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}

/**
 * 2. Sección Telas & Rendimientos (Con edición completa)
 */
function TelasView({
  telas,
  loading,
  error,
  onReload,
  onEditTela,
  onNewTela,
  setView,
}: {
  telas: Tela[]
  loading: boolean
  error: string | null
  onReload: () => void
  onEditTela: (tela: Tela) => void
  onNewTela: () => void
  setView: (v: string) => void
}) {
  const [search, setSearch] = useState('')

  const filteredTelas = useMemo(() => {
    if (!search.trim()) return telas
    const q = search.toLowerCase()
    return telas.filter(
      (t) =>
        t.nombre?.toLowerCase().includes(q) ||
        (t.descripcion && t.descripcion.toLowerCase().includes(q))
    )
  }, [telas, search])

  const precioPromedioKilo = useMemo(() => {
    if (telas.length === 0) return 0
    const sum = telas.reduce((acc, t) => acc + (Number(t.precio_kilo) || 0), 0)
    return sum / telas.length
  }, [telas])

  const rendimientoPromedio = useMemo(() => {
    if (telas.length === 0) return 0
    const sum = telas.reduce((acc, t) => acc + (Number(t.rendimiento) || 0), 0)
    return sum / telas.length
  }, [telas])

  return (
    <div className="module-page">
      <div className="welcome">
        <div>
          <p className="eyebrow">INSUMOS & RENDIMIENTOS</p>
          <h1>Telas & Rendimientos</h1>
          <p className="muted">
            Costos por kilo, rendimientos y cálculo del costo por metro para corte y confección.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="secondary" onClick={onReload} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Actualizando...' : 'Actualizar'}
          </button>
          <button className="primary" onClick={onNewTela}>
            <Plus size={16} /> Nueva Tela
          </button>
        </div>
      </div>

      <div className="metrics">
        <Metric
          label="Telas en catálogo"
          value={`${telas.length} telas`}
          note="Insumos activos"
          icon={Table2}
          accent="violet"
        />
        <Metric
          label="Precio Promedio / Kg"
          value={money.format(precioPromedioKilo)}
          note="Base textil"
          icon={TrendingUp}
          accent="blue"
        />
        <Metric
          label="Rendimiento Promedio"
          value={rendimientoPromedio > 0 ? `${rendimientoPromedio.toFixed(2)} m/kg` : '-'}
          note="Metros por kilo"
          icon={Shirt}
          accent="amber"
        />
        <Metric
          label="Estado del Catálogo"
          value={loading ? 'Actualizando...' : error ? 'Atención' : 'Al día'}
          note={error ? 'Verificar conexión' : 'Precios vigentes'}
          icon={Settings}
          accent={error ? 'amber' : 'green'}
        />
      </div>

      {error && (
        <div
          className="alert"
          style={{
            margin: '0 0 20px',
            background: '#ef444415',
            borderColor: '#ef444440',
            color: '#f87171',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={18} />
            <div>
              <strong>No se pudieron cargar las telas</strong>
              <small style={{ color: '#fca5a5', display: 'block', marginTop: '2px' }}>
                Ocurrió un inconveniente al comunicarse con el servidor. Por favor, reintentá.
              </small>
            </div>
          </div>
          <button
            className="secondary"
            onClick={onReload}
            style={{ fontSize: '11px', padding: '6px 12px' }}
          >
            Reintentar
          </button>
        </div>
      )}

      <section className="card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">REGISTRO DE TELAS</p>
            <h2>Costos por Kilo, Rendimientos y Costo por Metro</h2>
          </div>
          <div className="search" style={{ minWidth: '220px' }}>
            <Search size={15} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar tela..."
              style={{ background: 'transparent', border: 'none', padding: 0, outline: 'none' }}
            />
          </div>
        </div>

        {loading && telas.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
            <p>Cargando telas...</p>
          </div>
        ) : filteredTelas.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
            <p style={{ fontWeight: 600, margin: '0 0 6px' }}>
              {search
                ? 'No se encontraron telas para la búsqueda ingresada.'
                : 'No hay telas registradas en el catálogo.'}
            </p>
            <small>Hacé clic en &quot;Nueva Tela&quot; para agregar insumos al catálogo.</small>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th># ID</th>
                  <th>Nombre de la Tela</th>
                  <th>Descripción / Composición</th>
                  <th>Rendimiento</th>
                  <th>Precio / Kilo</th>
                  <th>Precio / Metro</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {filteredTelas.map((tela) => {
                  const precioMetro =
                    tela.precio_metro ||
                    (tela.rendimiento > 0 ? tela.precio_kilo / tela.rendimiento : 0)

                  return (
                    <tr key={tela.id}>
                      <td className="id">#{tela.id}</td>
                      <td>
                        <strong>{tela.nombre}</strong>
                      </td>
                      <td>
                        <span className="muted">{tela.descripcion || 'Sin descripción'}</span>
                      </td>
                      <td>
                        <strong>
                          {tela.rendimiento ? `${Number(tela.rendimiento).toFixed(2)} m/kg` : '-'}
                        </strong>
                      </td>
                      <td>
                        <strong>{money.format(tela.precio_kilo)}</strong>
                      </td>
                      <td>
                        <strong className="green">{money.format(precioMetro)}</strong>
                      </td>
                      <td>
                        <button
                          className="secondary btn-sm"
                          onClick={() => onEditTela(tela)}
                          title="Editar tela"
                        >
                          <Pencil size={13} /> Editar
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

/**
 * 3. Sección Catálogo de Productos (Con edición completa)
 */
function CatalogoView({
  productos,
  loading,
  error,
  onReload,
  onEditProducto,
  onNewProducto,
  setView,
}: {
  productos: Producto[]
  loading: boolean
  error: string | null
  onReload: () => void
  onEditProducto: (prod: Producto) => void
  onNewProducto: () => void
  setView: (v: string) => void
}) {
  const [search, setSearch] = useState('')

  const filteredProductos = useMemo(() => {
    if (!search.trim()) return productos
    const q = search.toLowerCase()
    return productos.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        p.tela?.nombre.toLowerCase().includes(q) ||
        p.tipo_estampado?.toLowerCase().includes(q)
    )
  }, [productos, search])

  const precioPromedioVenta = useMemo(() => {
    if (productos.length === 0) return 0
    return productos.reduce((acc, p) => acc + (p.precio_venta || 0), 0) / productos.length
  }, [productos])

  const costoPromedioProd = useMemo(() => {
    if (productos.length === 0) return 0
    return productos.reduce((acc, p) => acc + (p.costo_produccion || 0), 0) / productos.length
  }, [productos])

  return (
    <div className="module-page">
      <div className="welcome">
        <div>
          <p className="eyebrow">CATÁLOGO DE PRENDAS</p>
          <h1>Catálogo de Productos</h1>
          <p className="muted">
            Modelos de confección con consumo de tela, costos de taller y precio de venta final.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="secondary" onClick={onReload} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Actualizando...' : 'Actualizar'}
          </button>
          <button className="primary" onClick={onNewProducto}>
            <Plus size={16} /> Nueva Prenda
          </button>
        </div>
      </div>

      <div className="metrics">
        <Metric
          label="Prendas en catálogo"
          value={`${productos.length} modelos`}
          note="Activos para venta"
          icon={Shirt}
          accent="blue"
        />
        <Metric
          label="Precio Promedio Venta"
          value={money.format(precioPromedioVenta)}
          note="PVP unitario"
          icon={TrendingUp}
          accent="green"
        />
        <Metric
          label="Costo Promedio Producción"
          value={money.format(costoPromedioProd)}
          note="Tela + Taller + Avíos"
          icon={Package}
          accent="violet"
        />
        <Metric
          label="Estado de Catálogo"
          value={loading ? 'Actualizando...' : error ? 'Atención' : 'Al día'}
          note={error ? 'Verificar conexión' : 'Sincronizado'}
          icon={Settings}
          accent={error ? 'amber' : 'green'}
        />
      </div>

      {error && (
        <div
          className="alert"
          style={{
            margin: '0 0 20px',
            background: '#ef444415',
            borderColor: '#ef444440',
            color: '#f87171',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={18} />
            <div>
              <strong>No se pudieron cargar los productos</strong>
              <small style={{ color: '#fca5a5', display: 'block', marginTop: '2px' }}>
                Ocurrió un error al consultar el catálogo.
              </small>
            </div>
          </div>
          <button
            className="secondary"
            onClick={onReload}
            style={{ fontSize: '11px', padding: '6px 12px' }}
          >
            Reintentar
          </button>
        </div>
      )}

      <section className="card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">LISTADO DE PRENDAS</p>
            <h2>Modelos y estructura de costos</h2>
          </div>
          <div className="search" style={{ minWidth: '220px' }}>
            <Search size={15} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar prenda o tela..."
              style={{ background: 'transparent', border: 'none', padding: 0, outline: 'none' }}
            />
          </div>
        </div>

        {loading && productos.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
            <p>Cargando productos...</p>
          </div>
        ) : filteredProductos.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
            <p style={{ fontWeight: 600, margin: '0 0 6px' }}>
              {search
                ? 'No se encontraron prendas para la búsqueda ingresada.'
                : 'No hay prendas registradas en el catálogo.'}
            </p>
            <small>Hacé clic en &quot;Nueva Prenda&quot; para registrar un modelo.</small>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th># ID</th>
                  <th>Modelo / Prenda</th>
                  <th>Tela Asociada</th>
                  <th>Consumo</th>
                  <th>Confección</th>
                  <th>Estampa</th>
                  <th>Costo Producción</th>
                  <th>Precio Venta</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {filteredProductos.map((p) => (
                  <tr key={p.id}>
                    <td className="id">#{p.id}</td>
                    <td>
                      <strong>{p.nombre}</strong>
                      {p.nombre_avio && (
                        <small style={{ display: 'block', color: 'var(--muted)' }}>
                          Avío: {p.nombre_avio}
                        </small>
                      )}
                    </td>
                    <td>
                      <span>{p.tela?.nombre || 'Sin tela'}</span>
                      {p.tela?.precio_metro ? (
                        <small style={{ display: 'block', color: 'var(--muted)' }}>
                          {money.format(p.tela.precio_metro)} / m
                        </small>
                      ) : null}
                    </td>
                    <td>{p.consumo_metros} m</td>
                    <td>{money.format(p.costo_confeccion)}</td>
                    <td>
                      {p.tipo_estampado || 'Ninguno'}
                      {p.costo_estampado > 0 && (
                        <small style={{ display: 'block', color: 'var(--muted)' }}>
                          {money.format(p.costo_estampado)}
                        </small>
                      )}
                    </td>
                    <td>
                      <strong>{money.format(p.costo_produccion)}</strong>
                    </td>
                    <td>
                      <strong className="green">{money.format(p.precio_venta)}</strong>
                    </td>
                    <td>
                      <button
                        className="secondary btn-sm"
                        onClick={() => onEditProducto(p)}
                        title="Editar producto"
                      >
                        <Pencil size={13} /> Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

/**
 * 4. Sección Historial de Presupuestos (Con edición y detalle)
 */
function HistorialView({
  presupuestos,
  loading,
  error,
  token,
  onReload,
  onSelectPresupuesto,
  setView,
}: {
  presupuestos: Presupuesto[]
  loading: boolean
  error: string | null
  token: string
  onReload: () => void
  onSelectPresupuesto: (p: Presupuesto) => void
  setView: (v: string) => void
}) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return presupuestos
    const q = search.toLowerCase()
    return presupuestos.filter((p) => p.cliente_referencia.toLowerCase().includes(q))
  }, [presupuestos, search])

  const totalCotizado = useMemo(() => {
    return presupuestos.reduce((acc, p) => acc + (p.precio_total || 0), 0)
  }, [presupuestos])

  const ticketPromedio = useMemo(() => {
    if (presupuestos.length === 0) return 0
    return totalCotizado / presupuestos.length
  }, [presupuestos, totalCotizado])

  return (
    <div className="module-page">
      <div className="welcome">
        <div>
          <p className="eyebrow">COTIZACIONES EMITIDAS</p>
          <h1>Historial de Presupuestos</h1>
          <p className="muted">
            Registro de presupuestos entregados a clientes con opción de edición, recotización y comprobantes.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="secondary" onClick={onReload} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Actualizando...' : 'Actualizar'}
          </button>
          <button className="primary" onClick={() => setView('nuevo')}>
            <Plus size={16} /> Nueva Cotización
          </button>
        </div>
      </div>

      <div className="metrics">
        <Metric
          label="Presupuestos Totales"
          value={`${presupuestos.length} emitidos`}
          note="Historial general"
          icon={Package}
          accent="amber"
        />
        <Metric
          label="Total Cotizado"
          value={money.format(totalCotizado)}
          note="Monto acumulado"
          icon={TrendingUp}
          accent="green"
        />
        <Metric
          label="Ticket Promedio"
          value={money.format(ticketPromedio)}
          note="Por cotización"
          icon={Calculator}
          accent="blue"
        />
        <Metric
          label="Estado del Historial"
          value={loading ? 'Actualizando...' : error ? 'Atención' : 'Al día'}
          note={error ? 'Verificar conexión' : 'Actualizado'}
          icon={Settings}
          accent={error ? 'amber' : 'green'}
        />
      </div>

      {error && (
        <div
          className="alert"
          style={{
            margin: '0 0 20px',
            background: '#ef444415',
            borderColor: '#ef444440',
            color: '#f87171',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={18} />
            <div>
              <strong>No se pudo cargar el historial</strong>
              <small style={{ color: '#fca5a5', display: 'block', marginTop: '2px' }}>
                Ocurrió un error al consultar las cotizaciones.
              </small>
            </div>
          </div>
          <button
            className="secondary"
            onClick={onReload}
            style={{ fontSize: '11px', padding: '6px 12px' }}
          >
            Reintentar
          </button>
        </div>
      )}

      <section className="card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">REGISTRO HISTÓRICO</p>
            <h2>Cotizaciones realizadas</h2>
          </div>
          <div className="search" style={{ minWidth: '220px' }}>
            <Search size={15} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente..."
              style={{ background: 'transparent', border: 'none', padding: 0, outline: 'none' }}
            />
          </div>
        </div>

        {loading && presupuestos.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
            <p>Cargando presupuestos...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
            <p style={{ fontWeight: 600, margin: '0 0 6px' }}>
              {search
                ? 'No se encontraron presupuestos para el cliente buscado.'
                : 'No hay presupuestos registrados.'}
            </p>
            <small>Los presupuestos creados aparecerán listados aquí.</small>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th># ID</th>
                  <th>Cliente / Referencia</th>
                  <th>Fecha de Emisión</th>
                  <th>Multiplicador</th>
                  <th>Costo Fijo</th>
                  <th>Total</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((q) => (
                  <tr key={q.id}>
                    <td className="id">#{q.id}</td>
                    <td>
                      <strong>{q.cliente_referencia}</strong>
                    </td>
                    <td>{new Date(q.created_at).toLocaleDateString('es-AR')}</td>
                    <td>{Number(q.multiplicador).toFixed(1)}x</td>
                    <td>{money.format(q.costo_fijo)}</td>
                    <td>
                      <strong className="green">{money.format(q.precio_total)}</strong>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="secondary btn-sm"
                          onClick={() => onSelectPresupuesto(q)}
                        >
                          <Eye size={13} /> Ver / Modificar
                        </button>
                        <a
                          href={`${API_BASE}/api/presupuestos/${q.id}/pdf${token ? `?token=${encodeURIComponent(token)}` : ''}`}
                          target="_blank"
                          rel="noreferrer"
                          className="icon-btn"
                          title="Descargar PDF"
                        >
                          <FileDown size={16} />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

/**
 * 5. Sección Nuevo Presupuesto (Cotizador formal con precarga para edición)
 */
function NuevoPresupuestoView({
  productos,
  config,
  token,
  initialData,
  onPresupuestoCreado,
  setView,
}: {
  productos: Producto[]
  config: Configuracion | null
  token: string
  initialData?: {
    cliente: string
    multiplicador: number
    costoFijo: number
    items: Array<{ producto_id: number; cantidad: number; detalle_estampado: string }>
  } | null
  onPresupuestoCreado: () => void
  setView: (v: string) => void
}) {
  const [cliente, setCliente] = useState(initialData?.cliente ?? '')
  const [multiplicador, setMultiplicador] = useState<number>(
    initialData?.multiplicador ?? (config?.multiplicador ?? 2.0)
  )
  const [costoFijo, setCostoFijo] = useState<number>(
    initialData?.costoFijo ?? (config?.costo_fijo ?? 6000)
  )

  const [items, setItems] = useState<
    Array<{
      producto_id: number
      cantidad: number
      detalle_estampado: string
    }>
  >(initialData?.items ?? [])

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (initialData) {
      setCliente(initialData.cliente)
      setMultiplicador(initialData.multiplicador)
      setCostoFijo(initialData.costoFijo)
      setItems(initialData.items)
    } else if (config) {
      if (config.multiplicador && !multiplicador) setMultiplicador(config.multiplicador)
      if (config.costo_fijo && !costoFijo) setCostoFijo(config.costo_fijo)
    }
  }, [config, initialData, multiplicador, costoFijo])

  const handleAddItem = (productoId: number) => {
    const existing = items.find((it) => it.producto_id === productoId)
    if (existing) {
      setItems(
        items.map((it) =>
          it.producto_id === productoId ? { ...it, cantidad: it.cantidad + 10 } : it
        )
      )
    } else {
      setItems([
        ...items,
        {
          producto_id: productoId,
          cantidad: 20,
          detalle_estampado: '',
        },
      ])
    }
  }

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleUpdateCantidad = (index: number, val: number) => {
    const c = Math.max(1, val)
    setItems(items.map((it, i) => (i === index ? { ...it, cantidad: c } : it)))
  }

  const resumen = useMemo(() => {
    let totalPrendas = 0
    let totalPrecio = 0

    for (const it of items) {
      const p = productos.find((prod) => prod.id === it.producto_id)
      if (p) {
        totalPrendas += it.cantidad
        totalPrecio += p.precio_venta * it.cantidad
      }
    }

    return { totalPrendas, totalPrecio }
  }, [items, productos])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cliente.trim()) {
      setError('Por favor ingresá el nombre o referencia del cliente.')
      return
    }
    if (items.length === 0) {
      setError('Agregá al menos una prenda al presupuesto.')
      return
    }

    setError('')
    setSaving(true)

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const res = await fetch(`${API_BASE}/api/presupuestos`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          cliente: cliente.trim(),
          multiplicador: Number(multiplicador),
          costo_fijo: Number(costoFijo),
          items: items.map((it) => ({
            producto_id: it.producto_id,
            cantidad: it.cantidad,
            detalle_estampado: it.detalle_estampado || undefined,
          })),
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.detail || 'No se pudo guardar el presupuesto.')
      }

      onPresupuestoCreado()
      setView('historial')
    } catch (err: any) {
      setError(err.message || 'Error al guardar el presupuesto.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="module-page">
      <div className="welcome">
        <div>
          <p className="eyebrow">COTIZADOR FORMAL</p>
          <h1>{initialData ? 'Recotizar / Modificar Presupuesto' : 'Nuevo Presupuesto'}</h1>
          <p className="muted">
            Armá una cotización combinando prendas del catálogo, cantidades y parámetros de ganancia.
          </p>
        </div>
        <button className="secondary" onClick={() => setView('historial')}>
          <FileDown size={15} /> Ver Historial
        </button>
      </div>

      {error && (
        <div
          className="alert"
          style={{
            margin: '0 0 20px',
            background: '#ef444415',
            borderColor: '#ef444440',
            color: '#f87171',
          }}
        >
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="content-grid">
          <div className="main-column">
            <section className="card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">DATOS PRINCIPALES</p>
                  <h2>Información del Cliente</h2>
                </div>
              </div>

              <div style={{ padding: '0 20px 20px', display: 'grid', gap: '14px' }}>
                <label>
                  Cliente / Referencia Comercial
                  <input
                    type="text"
                    value={cliente}
                    onChange={(e) => setCliente(e.target.value)}
                    placeholder="Ej: Club Náutico, Marca Surf Local..."
                    required
                  />
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <label>
                    Multiplicador Comercial
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      value={multiplicador}
                      onChange={(e) => setMultiplicador(Number(e.target.value))}
                      required
                    />
                  </label>
                  <label>
                    Costo Fijo por Prenda ($)
                    <input
                      type="number"
                      step="100"
                      min="0"
                      value={costoFijo}
                      onChange={(e) => setCostoFijo(Number(e.target.value))}
                      required
                    />
                  </label>
                </div>
              </div>
            </section>

            <section className="card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">PRENDAS A COTIZAR</p>
                  <h2>Ítems del Presupuesto</h2>
                </div>
                <span className="muted" style={{ fontSize: '12px' }}>
                  {items.length} prendas agregadas
                </span>
              </div>

              {items.length === 0 ? (
                <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--muted)' }}>
                  <p style={{ margin: '0 0 6px', fontWeight: 600 }}>No agregaste prendas todavía</p>
                  <small>Seleccioná modelos desde el panel lateral derecho para incorporarlos.</small>
                </div>
              ) : (
                <div style={{ padding: '0 20px 20px', display: 'grid', gap: '12px' }}>
                  {items.map((it, idx) => {
                    const prod = productos.find((p) => p.id === it.producto_id)
                    const unitPrice = prod?.precio_venta ?? 0
                    const subtotal = unitPrice * it.cantidad

                    return (
                      <div
                        key={idx}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr auto auto auto',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px',
                          border: '1px solid var(--line)',
                          borderRadius: '8px',
                          background: 'var(--surface-2)',
                        }}
                      >
                        <div>
                          <strong>{prod?.nombre || `Producto #${it.producto_id}`}</strong>
                          <small style={{ display: 'block', color: 'var(--muted)' }}>
                            Tela: {prod?.tela?.nombre || 'Estándar'} · {money.format(unitPrice)} u.
                          </small>
                        </div>
                        <div style={{ width: '90px' }}>
                          <input
                            type="number"
                            min="1"
                            value={it.cantidad}
                            onChange={(e) => handleUpdateCantidad(idx, Number(e.target.value))}
                          />
                        </div>
                        <div style={{ minWidth: '110px', textAlign: 'right' }}>
                          <strong className="green">{money.format(subtotal)}</strong>
                        </div>
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => handleRemoveItem(idx)}
                          title="Eliminar ítem"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          </div>

          <div className="right-column">
            <section className="card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">CATÁLOGO DISPONIBLE</p>
                  <h2>Agregar al presupuesto</h2>
                </div>
              </div>

              <div style={{ padding: '0 16px 16px', display: 'grid', gap: '8px', maxHeight: '420px', overflowY: 'auto' }}>
                {productos.length === 0 ? (
                  <p style={{ color: 'var(--muted)', fontSize: '12px', textAlign: 'center', padding: '20px 0' }}>
                    No hay prendas en catálogo.
                  </p>
                ) : (
                  productos.map((prod) => (
                    <div
                      key={prod.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        border: '1px solid var(--line)',
                        borderRadius: '7px',
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '12px' }}>{prod.nombre}</strong>
                        <small style={{ display: 'block', color: 'var(--muted)', fontSize: '11px' }}>
                          {money.format(prod.precio_venta)}
                        </small>
                      </div>
                      <button
                        type="button"
                        className="secondary btn-sm"
                        onClick={() => handleAddItem(prod.id)}
                      >
                        <Plus size={14} /> Agregar
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">RESUMEN</p>
                  <h2>Total Estimado</h2>
                </div>
              </div>

              <div className="calc-breakdown">
                <div>
                  <span>Prendas totales</span>
                  <strong>{resumen.totalPrendas} unidades</strong>
                </div>
                <div>
                  <span>Multiplicador aplicado</span>
                  <strong>{multiplicador.toFixed(1)}x</strong>
                </div>
              </div>

              <div className="calc-total">
                <span>Total Cotizado</span>
                <strong className="green">{money.format(resumen.totalPrecio)}</strong>
              </div>

              <div style={{ padding: '0 20px 20px' }}>
                <button
                  type="submit"
                  className="primary full"
                  disabled={saving || items.length === 0}
                >
                  {saving ? 'Guardando...' : 'Confirmar y Guardar Presupuesto'}
                  <Check size={16} />
                </button>
              </div>
            </section>
          </div>
        </div>
      </form>
    </div>
  )
}

/**
 * 6. Sección Configuración General (Editable)
 */
function ConfiguracionView({
  config,
  token,
  onConfigActualizada,
  setView,
}: {
  config: Configuracion | null
  token: string
  onConfigActualizada: () => void
  setView: (v: string) => void
}) {
  const [costoFijo, setCostoFijo] = useState(config?.costo_fijo ?? 6000)
  const [multiplicador, setMultiplicador] = useState(config?.multiplicador ?? 2.0)
  const [precioDtf, setPrecioDtf] = useState(config?.precio_metro_dtf ?? 10000)
  const [precioSublimacion, setPrecioSublimacion] = useState(config?.precio_metro_sublimacion ?? 2900)
  const [precioSerigrafia, setPrecioSerigrafia] = useState(config?.precio_unidad_serigrafia ?? 1500)
  const [precioBordado, setPrecioBordado] = useState(config?.precio_unidad_bordado ?? 0)
  const [descripcionPdf, setDescripcionPdf] = useState(config?.descripcion_pdf ?? '')

  const [saving, setSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (config) {
      setCostoFijo(config.costo_fijo)
      setMultiplicador(config.multiplicador)
      setPrecioDtf(config.precio_metro_dtf)
      setPrecioSublimacion(config.precio_metro_sublimacion)
      setPrecioSerigrafia(config.precio_unidad_serigrafia)
      setPrecioBordado(config.precio_unidad_bordado)
      setDescripcionPdf(config.descripcion_pdf || '')
    }
  }, [config])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSavedSuccess(false)
    setSaving(true)

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const res = await fetch(`${API_BASE}/api/configuracion`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          costo_fijo: Number(costoFijo),
          multiplicador: Number(multiplicador),
          precio_dtf: Number(precioDtf),
          precio_sublimacion: Number(precioSublimacion),
          precio_serigrafia: Number(precioSerigrafia),
          precio_bordado: Number(precioBordado),
          descripcion_pdf: descripcionPdf,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.detail || 'No se pudo actualizar la configuración.')
      }

      setSavedSuccess(true)
      onConfigActualizada()
    } catch (err: any) {
      setError(err.message || 'Error al guardar la configuración.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="module-page">
      <div className="welcome">
        <div>
          <p className="eyebrow">PARÁMETROS DEL SISTEMA</p>
          <h1>Configuración General</h1>
          <p className="muted">
            Costos fijos base, multiplicador comercial y precios de técnicas de estampado.
          </p>
        </div>
        <button className="primary" onClick={() => setView('dashboard')}>
          <ChevronLeft size={16} /> Volver al Dashboard
        </button>
      </div>

      {savedSuccess && (
        <div
          className="alert"
          style={{
            margin: '0 0 20px',
            background: '#32b8751a',
            borderColor: '#32b87550',
            color: 'var(--green)',
          }}
        >
          <Check size={18} />
          <span>Configuración guardada correctamente y sincronizada en el sistema.</span>
        </div>
      )}

      {error && (
        <div
          className="alert"
          style={{
            margin: '0 0 20px',
            background: '#ef444415',
            borderColor: '#ef444440',
            color: '#f87171',
          }}
        >
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave}>
        <div className="content-grid">
          <div className="main-column">
            <section className="card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">BASES DE CÁLCULO</p>
                  <h2>Parámetros Comerciales</h2>
                </div>
              </div>

              <div style={{ padding: '0 20px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <label>
                  Costo Fijo Base por Prenda ($)
                  <input
                    type="number"
                    step="100"
                    min="0"
                    value={costoFijo}
                    onChange={(e) => setCostoFijo(Number(e.target.value))}
                    required
                  />
                  <small style={{ color: 'var(--muted)', fontWeight: 400 }}>
                    Monto aplicado a cada prenda para gastos fijos de taller.
                  </small>
                </label>

                <label>
                  Multiplicador Comercial por Defecto
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={multiplicador}
                    onChange={(e) => setMultiplicador(Number(e.target.value))}
                    required
                  />
                  <small style={{ color: 'var(--muted)', fontWeight: 400 }}>
                    Margen aplicado sobre el costo de producción total.
                  </small>
                </label>
              </div>
            </section>

            <section className="card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">COMPROBANTES</p>
                  <h2>Leyenda y Condiciones de Presupuesto</h2>
                </div>
              </div>

              <div style={{ padding: '0 20px 20px' }}>
                <label>
                  Texto al pie del Comprobante PDF
                  <textarea
                    rows={4}
                    value={descripcionPdf}
                    onChange={(e) => setDescripcionPdf(e.target.value)}
                  />
                </label>
              </div>
            </section>
          </div>

          <div className="right-column">
            <section className="card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">TÉCNICAS DE ESTAMPA</p>
                  <h2>Costos Unitarios</h2>
                </div>
              </div>

              <div style={{ padding: '0 20px 20px', display: 'grid', gap: '12px' }}>
                <label>
                  DTF (precio por metro)
                  <input
                    type="number"
                    step="100"
                    min="0"
                    value={precioDtf}
                    onChange={(e) => setPrecioDtf(Number(e.target.value))}
                  />
                </label>

                <label>
                  Sublimación (precio por metro)
                  <input
                    type="number"
                    step="100"
                    min="0"
                    value={precioSublimacion}
                    onChange={(e) => setPrecioSublimacion(Number(e.target.value))}
                  />
                </label>

                <label>
                  Serigrafía (precio por prenda/bajada)
                  <input
                    type="number"
                    step="50"
                    min="0"
                    value={precioSerigrafia}
                    onChange={(e) => setPrecioSerigrafia(Number(e.target.value))}
                  />
                </label>

                <label>
                  Bordado (precio unitario base)
                  <input
                    type="number"
                    step="50"
                    min="0"
                    value={precioBordado}
                    onChange={(e) => setPrecioBordado(Number(e.target.value))}
                  />
                </label>

                <button type="submit" className="primary full" disabled={saving} style={{ marginTop: '10px' }}>
                  {saving ? 'Guardando...' : 'Guardar Configuración'}
                  <Save size={16} />
                </button>
              </div>
            </section>
          </div>
        </div>
      </form>
    </div>
  )
}

/**
 * 7. MODALES DE EDICIÓN Y CREACIÓN (CRUD TOTAL)
 */

// Modal: Editar o Crear Tela
function ModalTela({
  tela,
  onSave,
  onDelete,
  onClose,
}: {
  tela?: Tela | null
  onSave: (data: { nombre: string; precio_kilo: number; rendimiento: number; descripcion: string }) => Promise<void>
  onDelete?: (id: number) => Promise<void>
  onClose: () => void
}) {
  const isEditing = !!tela
  const [nombre, setNombre] = useState(tela?.nombre ?? '')
  const [precioKilo, setPrecioKilo] = useState<number>(tela?.precio_kilo ?? 12000)
  const [rendimiento, setRendimiento] = useState<number>(tela?.rendimiento ?? 2.5)
  const [descripcion, setDescripcion] = useState(tela?.descripcion ?? '')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const precioMetroEstimado = useMemo(() => {
    if (!rendimiento || rendimiento <= 0) return 0
    return precioKilo / rendimiento
  }, [precioKilo, rendimiento])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) {
      setError('El nombre de la tela es obligatorio.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave({
        nombre: nombre.trim(),
        precio_kilo: Number(precioKilo),
        rendimiento: Number(rendimiento),
        descripcion: descripcion.trim(),
      })
      onClose()
    } catch (err: any) {
      setError(err.message || 'Error al guardar la tela.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!tela || !onDelete) return
    if (!confirm(`¿Estás seguro de eliminar la tela "${tela.nombre}"?`)) return
    setDeleting(true)
    try {
      await onDelete(tela.id)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Error al eliminar la tela.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose}>
          <X size={18} />
        </button>
        <p className="eyebrow">{isEditing ? `EDITAR TELA #${tela?.id}` : 'NUEVA TELA'}</p>
        <h2>{isEditing ? tela?.nombre : 'Registrar Nueva Tela'}</h2>
        <p className="muted" style={{ marginBottom: '18px' }}>
          Configurá el costo por kilo y el rendimiento para calcular el metro lineal.
        </p>

        {error && (
          <div className="alert" style={{ margin: '0 0 16px', color: '#f87171', background: '#ef444415' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px' }}>
          <label>
            Nombre de la Tela
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Rústico Invisible, Jersey 24/1..."
              required
            />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <label>
              Precio por Kilo ($)
              <input
                type="number"
                step="100"
                min="0"
                value={precioKilo}
                onChange={(e) => setPrecioKilo(Number(e.target.value))}
                required
              />
            </label>

            <label>
              Rendimiento (m/kg)
              <input
                type="number"
                step="0.05"
                min="0.1"
                value={rendimiento}
                onChange={(e) => setRendimiento(Number(e.target.value))}
                required
              />
            </label>
          </div>

          <label>
            Descripción / Composición (opcional)
            <textarea
              rows={2}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej: 100% Algodón Peinado, frisado liviano..."
            />
          </label>

          <div className="modal-total">
            <span>Costo Calculado por Metro Lineal</span>
            <strong className="green">{money.format(precioMetroEstimado)}</strong>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            {isEditing && onDelete && (
              <button
                type="button"
                className="danger-btn"
                onClick={handleDelete}
                disabled={deleting || saving}
              >
                <Trash2 size={15} /> {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            )}
            <button
              type="submit"
              className="primary"
              style={{ flex: 1 }}
              disabled={saving || deleting}
            >
              <Save size={15} /> {saving ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Tela'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Modal: Editar o Crear Producto
function ModalProducto({
  producto,
  telas,
  onSave,
  onDelete,
  onClose,
}: {
  producto?: Producto | null
  telas: Tela[]
  onSave: (data: {
    nombre: string
    tela_id: number
    consumo_metros: number
    costo_confeccion: number
    tipo_estampado: string
    consumo_estampado: number
    nombre_avio: string
    costo_avio: number
  }) => Promise<void>
  onDelete?: (id: number) => Promise<void>
  onClose: () => void
}) {
  const isEditing = !!producto
  const [nombre, setNombre] = useState(producto?.nombre ?? '')
  const [telaId, setTelaId] = useState<number>(producto?.tela?.id ?? telas[0]?.id ?? 0)
  const [consumoMetros, setConsumoMetros] = useState<number>(producto?.consumo_metros ?? 1.2)
  const [costoConfeccion, setCostoConfeccion] = useState<number>(producto?.costo_confeccion ?? 2500)
  const [tipoEstampado, setTipoEstampado] = useState<string>(producto?.tipo_estampado ?? 'Ninguno')
  const [consumoEstampado, setConsumoEstampado] = useState<number>(producto?.consumo_estampado ?? 0)
  const [nombreAvio, setNombreAvio] = useState(producto?.nombre_avio ?? '')
  const [costoAvio, setCostoAvio] = useState<number>(producto?.costo_avio ?? 0)

  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const selectedTela = useMemo(() => telas.find((t) => t.id === telaId), [telas, telaId])

  const precioMetroTela = selectedTela
    ? selectedTela.precio_metro || (selectedTela.rendimiento > 0 ? selectedTela.precio_kilo / selectedTela.rendimiento : 0)
    : 0

  const costoTelaEstimado = precioMetroTela * consumoMetros
  const costoBaseEstimado = costoTelaEstimado + costoConfeccion + costoAvio

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) {
      setError('El nombre de la prenda es obligatorio.')
      return
    }
    if (!telaId) {
      setError('Seleccioná una tela válida del catálogo.')
      return
    }

    setSaving(true)
    setError('')
    try {
      await onSave({
        nombre: nombre.trim(),
        tela_id: Number(telaId),
        consumo_metros: Number(consumoMetros),
        costo_confeccion: Number(costoConfeccion),
        tipo_estampado: tipoEstampado,
        consumo_estampado: Number(consumoEstampado),
        nombre_avio: nombreAvio.trim(),
        costo_avio: Number(costoAvio),
      })
      onClose()
    } catch (err: any) {
      setError(err.message || 'Error al guardar el producto.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!producto || !onDelete) return
    if (!confirm(`¿Estás seguro de eliminar "${producto.nombre}"?`)) return
    setDeleting(true)
    try {
      await onDelete(producto.id)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Error al eliminar el producto.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose}>
          <X size={18} />
        </button>
        <p className="eyebrow">{isEditing ? `EDITAR PRODUCTO #${producto?.id}` : 'NUEVO PRODUCTO'}</p>
        <h2>{isEditing ? producto?.nombre : 'Registrar Nueva Prenda'}</h2>
        <p className="muted" style={{ marginBottom: '18px' }}>
          Definí la tela asociada, metros necesarios y costos de confección para el cálculo de costos.
        </p>

        {error && (
          <div className="alert" style={{ margin: '0 0 16px', color: '#f87171', background: '#ef444415' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px' }}>
          <label>
            Nombre del Modelo / Prenda
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Buzo Canguro Oversize, Remera Box Fit..."
              required
            />
          </label>

          <label>
            Tela Asignada
            <select value={telaId} onChange={(e) => setTelaId(Number(e.target.value))} required>
              {telas.map((t) => (
                <option value={t.id} key={t.id}>
                  {t.nombre} ({money.format(t.precio_kilo)}/kg · {t.rendimiento} m/kg)
                </option>
              ))}
            </select>
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <label>
              Consumo de Tela (metros)
              <input
                type="number"
                step="0.05"
                min="0.1"
                value={consumoMetros}
                onChange={(e) => setConsumoMetros(Number(e.target.value))}
                required
              />
            </label>

            <label>
              Costo Confección / Taller ($)
              <input
                type="number"
                step="100"
                min="0"
                value={costoConfeccion}
                onChange={(e) => setCostoConfeccion(Number(e.target.value))}
                required
              />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <label>
              Técnica de Estampa
              <select value={tipoEstampado} onChange={(e) => setTipoEstampado(e.target.value)}>
                <option value="Ninguno">Ninguno</option>
                <option value="DTF">DTF</option>
                <option value="Sublimación">Sublimación</option>
                <option value="Serigrafía">Serigrafía</option>
                <option value="Bordado">Bordado</option>
              </select>
            </label>

            <label>
              Consumo de Estampa (m o u.)
              <input
                type="number"
                step="0.05"
                min="0"
                value={consumoEstampado}
                onChange={(e) => setConsumoEstampado(Number(e.target.value))}
              />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '12px' }}>
            <label>
              Nombre del Avío (opcional)
              <input
                type="text"
                value={nombreAvio}
                onChange={(e) => setNombreAvio(e.target.value)}
                placeholder="Ej: Cordon + Ojalillos"
              />
            </label>

            <label>
              Costo Avío ($)
              <input
                type="number"
                step="50"
                min="0"
                value={costoAvio}
                onChange={(e) => setCostoAvio(Number(e.target.value))}
              />
            </label>
          </div>

          <div className="modal-total">
            <span>Costo Base Estimado (Tela + Confección + Avíos)</span>
            <strong className="green">{money.format(costoBaseEstimado)}</strong>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            {isEditing && onDelete && (
              <button
                type="button"
                className="danger-btn"
                onClick={handleDelete}
                disabled={deleting || saving}
              >
                <Trash2 size={15} /> {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            )}
            <button
              type="submit"
              className="primary"
              style={{ flex: 1 }}
              disabled={saving || deleting}
            >
              <Save size={15} /> {saving ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Modal: Detalle y Acciones de Presupuesto
function ModalDetallePresupuesto({
  presupuesto,
  token,
  onRecotizar,
  onDelete,
  onClose,
}: {
  presupuesto: Presupuesto
  token: string
  onRecotizar: (p: Presupuesto) => void
  onDelete: (id: number) => Promise<void>
  onClose: () => void
}) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`¿Estás seguro de eliminar el presupuesto #${presupuesto.id} de "${presupuesto.cliente_referencia}"?`)) return
    setDeleting(true)
    try {
      await onDelete(presupuesto.id)
      onClose()
    } catch {
      setDeleting(false)
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose}>
          <X size={18} />
        </button>
        <p className="eyebrow">PRESUPUESTO #{presupuesto.id}</p>
        <h2>{presupuesto.cliente_referencia}</h2>
        <p className="muted">
          Emitido el {new Date(presupuesto.created_at).toLocaleDateString('es-AR')}
        </p>

        <div className="modal-total">
          <span>Total Cotizado Final</span>
          <strong>{money.format(presupuesto.precio_total)}</strong>
        </div>

        <div className="detail-line">
          <span>Multiplicador Comercial</span>
          <strong>{Number(presupuesto.multiplicador).toFixed(1)}x</strong>
        </div>

        <div className="detail-line">
          <span>Costo Fijo por Prenda</span>
          <strong>{money.format(presupuesto.costo_fijo)}</strong>
        </div>

        <div style={{ display: 'grid', gap: '8px', marginTop: '20px' }}>
          <button
            type="button"
            className="primary full"
            onClick={() => {
              onRecotizar(presupuesto)
              onClose()
            }}
          >
            <Pencil size={15} /> Modificar y Recotizar en Cotizador
          </button>

          <a
            href={`${API_BASE}/api/presupuestos/${presupuesto.id}/pdf${token ? `?token=${encodeURIComponent(token)}` : ''}`}
            target="_blank"
            rel="noreferrer"
            className="secondary full"
            style={{ textDecoration: 'none' }}
          >
            <FileDown size={15} /> Descargar Comprobante Oficial PDF
          </a>

          <button
            type="button"
            className="danger-btn full"
            onClick={handleDelete}
            disabled={deleting}
          >
            <Trash2 size={15} /> {deleting ? 'Eliminando...' : 'Eliminar Cotización'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Page() {
  const [auth, setAuth] = useState(false)
  const [token, setToken] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [view, setView] = useState('dashboard')
  const [dark, setDark] = useState(true)

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

  // Estados de modales interactivos
  const [editingTela, setEditingTela] = useState<Tela | null | 'new'>(null)
  const [editingProducto, setEditingProducto] = useState<Producto | null | 'new'>(null)
  const [selectedPresupuesto, setSelectedPresupuesto] = useState<Presupuesto | null>(null)

  // Datos precargados para el cotizador
  const [presupuestoInitialData, setPresupuestoInitialData] = useState<{
    cliente: string
    multiplicador: number
    costoFijo: number
    items: Array<{ producto_id: number; cantidad: number; detalle_estampado: string }>
  } | null>(null)

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
      setLoadingTelas(true)
      setErrorTelas(null)
      try {
        const res = await fetch(`${API_BASE}/api/telas`, { headers: getHeaders(customToken) })
        if (!res.ok) throw new Error('Error al obtener telas')
        const data = await res.json()
        setTelas(Array.isArray(data) ? data : [])
      } catch (err: any) {
        setErrorTelas(err.message || 'Error de conexión')
      } finally {
        setLoadingTelas(false)
      }
    },
    [getHeaders]
  )

  const fetchProductos = useCallback(
    async (customToken?: string) => {
      setLoadingProductos(true)
      setErrorProductos(null)
      try {
        const res = await fetch(`${API_BASE}/api/productos`, { headers: getHeaders(customToken) })
        if (!res.ok) throw new Error('Error al obtener productos')
        const data = await res.json()
        setProductos(Array.isArray(data) ? data : [])
      } catch (err: any) {
        setErrorProductos(err.message || 'Error de conexión')
      } finally {
        setLoadingProductos(false)
      }
    },
    [getHeaders]
  )

  const fetchPresupuestos = useCallback(
    async (customToken?: string) => {
      setLoadingPresupuestos(true)
      setErrorPresupuestos(null)
      try {
        const res = await fetch(`${API_BASE}/api/presupuestos`, { headers: getHeaders(customToken) })
        if (!res.ok) throw new Error('Error al obtener presupuestos')
        const data = await res.json()
        setPresupuestos(Array.isArray(data) ? data : [])
      } catch (err: any) {
        setErrorPresupuestos(err.message || 'Error de conexión')
      } finally {
        setLoadingPresupuestos(false)
      }
    },
    [getHeaders]
  )

  const fetchConfig = useCallback(
    async (customToken?: string) => {
      try {
        const res = await fetch(`${API_BASE}/api/configuracion`, { headers: getHeaders(customToken) })
        if (res.ok) {
          const data = await res.json()
          setConfig(data)
        }
      } catch {}
    },
    [getHeaders]
  )

  const loadAllData = useCallback(
    (customToken?: string) => {
      fetchTelas(customToken)
      fetchProductos(customToken)
      fetchPresupuestos(customToken)
      fetchConfig(customToken)
    },
    [fetchTelas, fetchProductos, fetchPresupuestos, fetchConfig]
  )

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('simple_mdq_token')
      const savedAuth = localStorage.getItem('simple_mdq_auth')
      const savedEmail = localStorage.getItem('simple_mdq_email')
      if (savedAuth === 'true') {
        setAuth(true)
        if (savedToken) setToken(savedToken)
        if (savedEmail) setUserEmail(savedEmail)
        loadAllData(savedToken || '')
      }
    } catch {}
  }, [loadAllData])

  useEffect(() => {
    if (auth) {
      loadAllData()
    }
  }, [auth, loadAllData])

  const handleLogin = (jwtToken?: string, email?: string) => {
    setAuth(true)
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

  const handleLogout = () => {
    setAuth(false)
    setToken('')
    setUserEmail('')
    setTelas([])
    setProductos([])
    setPresupuestos([])
    try {
      localStorage.removeItem('simple_mdq_auth')
      localStorage.removeItem('simple_mdq_token')
      localStorage.removeItem('simple_mdq_email')
    } catch {}
  }

  // Operaciones CRUD de Telas
  const handleSaveTela = async (data: { nombre: string; precio_kilo: number; rendimiento: number; descripcion: string }) => {
    const isEdit = editingTela && editingTela !== 'new'
    const url = isEdit ? `${API_BASE}/api/telas/${editingTela.id}` : `${API_BASE}/api/telas`
    const method = isEdit ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: getHeaders(),
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => null)
      throw new Error(err?.detail || 'Error al guardar la tela')
    }

    await fetchTelas()
    await fetchProductos()
  }

  const handleDeleteTela = async (id: number) => {
    const res = await fetch(`${API_BASE}/api/telas/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    })

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
    costo_confeccion: number
    tipo_estampado: string
    consumo_estampado: number
    nombre_avio: string
    costo_avio: number
  }) => {
    const isEdit = editingProducto && editingProducto !== 'new'
    const url = isEdit ? `${API_BASE}/api/productos/${editingProducto.id}` : `${API_BASE}/api/productos`
    const method = isEdit ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: getHeaders(),
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => null)
      throw new Error(err?.detail || 'Error al guardar el producto')
    }

    await fetchProductos()
  }

  const handleDeleteProducto = async (id: number) => {
    const res = await fetch(`${API_BASE}/api/productos/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => null)
      throw new Error(err?.detail || 'Error al eliminar el producto')
    }

    await fetchProductos()
  }

  // Operaciones CRUD de Presupuestos
  const handleDeletePresupuesto = async (id: number) => {
    const res = await fetch(`${API_BASE}/api/presupuestos/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => null)
      throw new Error(err?.detail || 'Error al eliminar el presupuesto')
    }

    await fetchPresupuestos()
  }

  const handleRecotizarPresupuesto = async (p: Presupuesto) => {
    try {
      const res = await fetch(`${API_BASE}/api/presupuestos/${p.id}`, {
        headers: getHeaders(),
      })
      if (res.ok) {
        const data = await res.json()
        const detalles = data.detalles || []
        setPresupuestoInitialData({
          cliente: p.cliente_referencia,
          multiplicador: p.multiplicador,
          costoFijo: p.costo_fijo,
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
          items: [],
        })
      }
    } catch {
      setPresupuestoInitialData({
        cliente: p.cliente_referencia,
        multiplicador: p.multiplicador,
        costoFijo: p.costo_fijo,
        items: [],
      })
    }
    setView('nuevo')
  }

  if (!auth) {
    return <LoginView onLogin={handleLogin} />
  }

  return (
    <div className={dark ? 'app dark' : 'app'}>
      <Sidebar
        view={view}
        setView={setView}
        onLogout={handleLogout}
        telasCount={telas.length}
        productosCount={productos.length}
        presupuestosCount={presupuestos.length}
        userEmail={userEmail}
      />
      <main className="shell">
        <header className="topbar">
          <button className="mobile-menu icon-btn">
            <Menu size={18} />
          </button>
          <div className="breadcrumbs">
            <span>Workspace</span>
            <ChevronRight size={14} />
            <strong>
              {view === 'dashboard'
                ? 'Dashboard'
                : view === 'catalogo'
                ? 'Catálogo de Productos'
                : view === 'telas'
                ? 'Telas & Rendimientos'
                : view === 'nuevo'
                ? 'Nuevo Presupuesto'
                : view === 'historial'
                ? 'Historial de Presupuestos'
                : 'Configuración General'}
            </strong>
          </div>
          <div className="top-actions">
            <div className="search">
              <Search size={16} />
              <span>Buscar en SIMPLE MDQ</span>
              <kbd>⌘ K</kbd>
            </div>
            <button className="icon-btn">
              <Bell size={17} />
            </button>
            <button
              className="icon-btn"
              onClick={() => setDark(!dark)}
              aria-label="Cambiar tema"
            >
              {dark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <div className="top-avatar">A</div>
          </div>
        </header>

        <div className="page-content">
          {view === 'dashboard' ? (
            <Dashboard
              setView={setView}
              telas={telas}
              productos={productos}
              presupuestos={presupuestos}
              config={config}
              onSelectPresupuesto={setSelectedPresupuesto}
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
              initialData={presupuestoInitialData}
              onPresupuestoCreado={() => {
                setPresupuestoInitialData(null)
                fetchPresupuestos()
              }}
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
              token={token}
              onConfigActualizada={() => fetchConfig()}
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
