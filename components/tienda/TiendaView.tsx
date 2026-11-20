'use client'

import React, { useMemo, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  CloudDownload,
  Edit3,
  LayoutGrid,
  Link2,
  List,
  Percent,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  ShoppingBag,
  Upload,
} from 'lucide-react'
import type {
  TiendaBulkPricePayload,
  TiendaBulkPriceResponse,
  TiendaCategory,
  TiendaImage,
  TiendaImportResult,
  TiendaMovimiento,
  TiendanubeStatus,
  TiendaProduct,
  TiendaProductCreatePayload,
  TiendaProductUpdatePayload,
  TiendaResumen,
  TiendaSale,
  TiendaSaleCreatePayload,
  TiendaSalesSummary,
  TiendaVariant,
  TiendaVariantPatchItem,
} from '@/lib/types'
import { getMatrixTalleColumns } from '@/lib/tienda-utils'
import { money } from '@/lib/utils'
import { Metric } from '@/components/ui/Metric'
import { ModalImportarCsv } from './ModalImportarCsv'
import { ModalAjusteMasivo } from './ModalAjusteMasivo'
import { ModalProductoTienda } from './ModalProductoTienda'
import { ModalCrearVenta } from './ModalCrearVenta'
import { VentasTiendaTab } from './VentasTiendaTab'

type MainTab = 'catalogo' | 'ventas' | 'movimientos'
type ViewMode = 'matriz' | 'plana'
type FilterMode = 'todos' | 'ultimas' | 'sin_stock' | 'pendientes' | 'ocultos'

interface VariantDraft {
  stock?: number
  precio?: number
  precio_promocional?: number | null
  clear_promocional?: boolean
}

export interface TiendaViewProps {
  productos: TiendaProduct[]
  categorias: TiendaCategory[]
  resumen: TiendaResumen
  movimientos: TiendaMovimiento[]
  ventas: TiendaSale[]
  ventasResumen: TiendaSalesSummary
  tnStatus: TiendanubeStatus | null
  loading: boolean
  error: string | null
  umbralUltimas: number
  onChangeUmbralUltimas: (umbral: number) => void
  onReload: () => void
  onImportCsv: (file: File) => Promise<TiendaImportResult>
  onSaveBatch: (updates: TiendaVariantPatchItem[]) => Promise<void>
  onBulkPriceAdjustment: (payload: TiendaBulkPricePayload) => Promise<TiendaBulkPriceResponse>
  onCreateProduct: (payload: TiendaProductCreatePayload) => Promise<TiendaProduct>
  onUpdateProduct: (productId: number, payload: TiendaProductUpdatePayload) => Promise<TiendaProduct>
  onDeleteProduct: (productId: number) => Promise<void>
  onUploadPhoto: (productId: number, base64: string, filename: string, position?: number) => Promise<TiendaImage[]>
  onDeletePhoto: (productId: number, tnImageId: number) => Promise<TiendaImage[]>
  onReorderPhotos: (productId: number, imageIds: number[]) => Promise<TiendaImage[]>
  onCreateCategory: (nombre: string) => Promise<TiendaCategory>
  onCreateSale: (payload: TiendaSaleCreatePayload) => Promise<TiendaSale>
  onAnularSale: (saleId: number) => Promise<void>
  onPullTiendanube: () => Promise<{
    categorias: number
    productos: number
    variantes: number
    skus_generados: number
    productos_archivados?: number
    skus_push_fallidos?: number
  }>
  onRetryPending: () => Promise<{ productos_creados: number; variantes_sincronizadas: number; fallidas: number }>
  onConnectTiendanube: () => Promise<void>
}

const MOTIVO_LABELS: Record<TiendaMovimiento['motivo'], string> = {
  venta_local: 'Venta local',
  venta_web: 'Venta web',
  ajuste_manual: 'Ajuste manual',
  reposicion: 'Reposición',
  import_csv: 'Importación CSV',
  sync_tiendanube: 'Sync Tiendanube',
}

const MEDIO_LABELS: Record<string, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  tarjeta: 'Tarjeta',
  online: 'Online',
}

function SyncDot({ status, error }: { status: TiendaVariant['sync_status']; error?: string | null }) {
  if (status === 'synced') {
    return <span className="sync-dot ok" title="Sincronizado con Tiendanube" />
  }
  if (status === 'pending_push') {
    const title = error
      ? `Pendiente de subir a Tiendanube: ${error}`
      : 'Pendiente de subir a Tiendanube'
    return <span className="sync-dot warn" title={title} />
  }
  return <span className="sync-dot local" title="Solo en app local" />
}

export function TiendaView({
  productos,
  categorias,
  resumen,
  movimientos,
  ventas,
  ventasResumen,
  tnStatus,
  loading,
  error,
  umbralUltimas,
  onChangeUmbralUltimas,
  onReload,
  onImportCsv,
  onSaveBatch,
  onBulkPriceAdjustment,
  onCreateProduct,
  onUpdateProduct,
  onDeleteProduct,
  onUploadPhoto,
  onDeletePhoto,
  onReorderPhotos,
  onCreateCategory,
  onCreateSale,
  onAnularSale,
  onPullTiendanube,
  onRetryPending,
  onConnectTiendanube,
}: TiendaViewProps) {
  const [mainTab, setMainTab] = useState<MainTab>('catalogo')
  const [viewMode, setViewMode] = useState<ViewMode>('matriz')
  const [search, setSearch] = useState<string>('')
  const [filterMode, setFilterMode] = useState<FilterMode>('todos')
  const [selectedCatId, setSelectedCatId] = useState<number | 'todas'>('todas')
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([])

  const [drafts, setDrafts] = useState<Record<number, VariantDraft>>({})
  const [savingBatch, setSavingBatch] = useState<boolean>(false)
  const [syncingAction, setSyncingAction] = useState<string>('')
  const [bannerMsg, setBannerMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // Modales
  const [editingProduct, setEditingProduct] = useState<TiendaProduct | 'new' | null>(null)
  const [showVentaModal, setShowVentaModal] = useState<boolean>(false)
  const [ventaInitialProdId, setVentaInitialProdId] = useState<number | null>(null)
  const [showImportModal, setShowImportModal] = useState<boolean>(false)
  const [showBulkModal, setShowBulkModal] = useState<boolean>(false)

  const { standardCols, hasOtherCol } = useMemo(() => getMatrixTalleColumns(productos), [productos])

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase()
    return productos.filter((prod) => {
      if (selectedCatId !== 'todas' && !prod.category_ids.includes(selectedCatId)) {
        return false
      }
      if (filterMode === 'ultimas' && !prod.es_ultimas_oportunidades) return false
      if (filterMode === 'sin_stock' && !prod.sin_stock) return false
      if (filterMode === 'ocultos' && prod.published) return false
      if (filterMode === 'pendientes' && !prod.variantes.some((v) => v.sync_status === 'pending_push')) {
        return false
      }
      if (q) {
        const hay = [
          prod.nombre,
          prod.categoria,
          ...prod.categorias_nombres,
          ...prod.variantes.map((v) => `${v.talle} ${v.sku}`),
        ]
          .join(' ')
          .toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [productos, search, filterMode, selectedCatId])

  const flatRows = useMemo(() => {
    const rows: Array<{ producto: TiendaProduct; variante: TiendaVariant }> = []
    for (const prod of filteredProducts) {
      for (const v of prod.variantes) {
        if (filterMode === 'sin_stock' && v.stock > 0) continue
        if (filterMode === 'pendientes' && v.sync_status !== 'pending_push') continue
        rows.push({ producto: prod, variante: v })
      }
    }
    return rows
  }, [filteredProducts, filterMode])

  const dirtyCount = Object.keys(drafts).length

  const updateDraftField = (variante: TiendaVariant, patch: Partial<VariantDraft>) => {
    setBannerMsg(null)
    setDrafts((prev) => {
      const current = prev[variante.id] ?? {}
      const next: VariantDraft = { ...current, ...patch }
      const effStock = next.stock !== undefined ? next.stock : variante.stock
      const effPrecio = next.precio !== undefined ? next.precio : variante.precio
      const effPromo = next.clear_promocional
        ? null
        : next.precio_promocional !== undefined
          ? next.precio_promocional
          : variante.precio_promocional

      if (
        effStock === variante.stock &&
        effPrecio === variante.precio &&
        effPromo === variante.precio_promocional
      ) {
        const copy = { ...prev }
        delete copy[variante.id]
        return copy
      }
      return { ...prev, [variante.id]: next }
    })
  }

  const handleSaveBatch = async () => {
    const entries = Object.entries(drafts)
    if (entries.length === 0) return
    setSavingBatch(true)
    setBannerMsg(null)
    try {
      const updates: TiendaVariantPatchItem[] = entries.map(([idStr, d]) => ({
        variant_id: Number(idStr),
        stock: d.stock,
        precio: d.precio,
        precio_promocional: d.precio_promocional,
        clear_promocional: d.clear_promocional,
      }))
      await onSaveBatch(updates)
      setDrafts({})
      setBannerMsg({ type: 'ok', text: `${updates.length} cambio(s) guardados y sincronizando con Tiendanube.` })
    } catch (err: any) {
      setBannerMsg({ type: 'err', text: err?.message || 'Error al guardar los cambios.' })
    } finally {
      setSavingBatch(false)
    }
  }

  const handleTogglePublished = async (prod: TiendaProduct) => {
    try {
      await onUpdateProduct(prod.id, { published: !prod.published })
    } catch (err: any) {
      setBannerMsg({ type: 'err', text: err?.message || 'No se pudo cambiar la visibilidad.' })
    }
  }

  const handlePull = async () => {
    setSyncingAction('pull')
    setBannerMsg(null)
    try {
      const stats = await onPullTiendanube()
      setBannerMsg({
        type: 'ok',
        text: `Catálogo traído: ${stats.productos} prendas, ${stats.variantes} variantes y ${stats.categorias} secciones.`,
      })
    } catch (err: any) {
      setBannerMsg({ type: 'err', text: err?.message || 'Error al traer el catálogo de Tiendanube.' })
    } finally {
      setSyncingAction('')
    }
  }

  const handleRetry = async () => {
    setSyncingAction('retry')
    setBannerMsg(null)
    try {
      const stats = await onRetryPending()
      setBannerMsg({
        type: 'ok',
        text: `Reintento listo: ${stats.variantes_sincronizadas} variantes sincronizadas (${stats.fallidas} fallidas).`,
      })
    } catch (err: any) {
      setBannerMsg({ type: 'err', text: err?.message || 'No se pudieron reintentar los pendientes.' })
    } finally {
      setSyncingAction('')
    }
  }

  const toggleProductSelection = (id: number) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const renderStockCell = (v: TiendaVariant) => {
    const draft = drafts[v.id]
    const effStock = draft?.stock ?? v.stock
    const isDirty = draft !== undefined && draft.stock !== undefined
    const toneClass =
      effStock === 0 ? 'stock-zero' : effStock <= umbralUltimas ? 'stock-low' : 'stock-ok'

    return (
      <div className={`matrix-stock-cell ${toneClass} ${isDirty ? 'dirty' : ''}`}>
        <button
          type="button"
          className="matrix-step-btn"
          disabled={effStock <= 0}
          onClick={() => updateDraftField(v, { stock: Math.max(0, effStock - 1) })}
          aria-label={`Restar 1 stock talle ${v.talle}`}
          tabIndex={-1}
        >
          -
        </button>
        <input
          type="number"
          min={0}
          step={1}
          value={effStock}
          onChange={(e) => {
            const raw = e.target.value
            const parsed = raw === '' ? 0 : Math.max(0, Math.round(Number(raw)))
            if (Number.isFinite(parsed)) {
              updateDraftField(v, { stock: parsed })
            }
          }}
          aria-label={`Stock talle ${v.talle}`}
        />
        <button
          type="button"
          className="matrix-step-btn"
          onClick={() => updateDraftField(v, { stock: effStock + 1 })}
          aria-label={`Sumar 1 stock talle ${v.talle}`}
          tabIndex={-1}
        >
          +
        </button>
        <SyncDot status={v.sync_status} error={v.last_sync_error} />
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: '18px' }}>
      {/* Barra superior de estado y acciones primarias */}
      <div className="tienda-top-bar">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          <div className="filter-pills">
            <button
              type="button"
              className={mainTab === 'catalogo' ? 'pill-btn active' : 'pill-btn'}
              onClick={() => setMainTab('catalogo')}
            >
              Catálogo ({productos.length})
            </button>
            <button
              type="button"
              className={mainTab === 'ventas' ? 'pill-btn active' : 'pill-btn'}
              onClick={() => setMainTab('ventas')}
            >
              Ventas ({ventas.length})
            </button>
            <button
              type="button"
              className={mainTab === 'movimientos' ? 'pill-btn active' : 'pill-btn'}
              onClick={() => setMainTab('movimientos')}
            >
              Movimientos
            </button>
          </div>

          {resumen.tiendanube_conectado ? (
            <span className="badge-sea" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <CheckCircle2 size={12} /> Tiendanube conectada
            </span>
          ) : (
            <button
              type="button"
              className="secondary btn-sm"
              onClick={() => void onConnectTiendanube()}
              disabled={tnStatus ? !tnStatus.oauth_configurado : false}
              title={tnStatus && !tnStatus.oauth_configurado ? 'Falta configurar Client ID / Secret en el backend' : 'Conectar con OAuth de Tiendanube'}
            >
              <Link2 size={13} /> Conectar Tiendanube
            </button>
          )}

          {resumen.variantes_pendientes_sync > 0 && resumen.tiendanube_conectado && (
            <button
              type="button"
              className="secondary btn-sm"
              onClick={() => void handleRetry()}
              disabled={syncingAction === 'retry'}
            >
              <RefreshCw size={13} className={syncingAction === 'retry' ? 'spin' : ''} />
              Reintentar sync ({resumen.variantes_pendientes_sync})
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          {resumen.tiendanube_conectado && (
            <button
              type="button"
              className="secondary btn-sm"
              onClick={() => void handlePull()}
              disabled={syncingAction === 'pull'}
            >
              <CloudDownload size={14} /> {syncingAction === 'pull' ? 'Sincronizando...' : 'Traer catálogo'}
            </button>
          )}
          <button
            type="button"
            className="secondary btn-sm"
            onClick={() => setShowImportModal(true)}
            title="Respaldo manual por CSV"
          >
            <Upload size={13} /> CSV
          </button>
          <button
            type="button"
            className="secondary btn-sm"
            onClick={() => setShowBulkModal(true)}
            disabled={productos.length === 0}
          >
            <Percent size={14} /> Precios {selectedProductIds.length > 0 ? `(${selectedProductIds.length})` : '%'}
          </button>
          <button
            type="button"
            className="secondary btn-sm"
            onClick={() => {
              setVentaInitialProdId(null)
              setShowVentaModal(true)
            }}
            disabled={productos.length === 0}
          >
            <ShoppingBag size={14} /> Crear venta
          </button>
          <button
            type="button"
            className="primary btn-sm"
            onClick={() => setEditingProduct('new')}
          >
            <Plus size={14} /> Nueva prenda
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {bannerMsg && (
        <div className={`alert ${bannerMsg.type === 'err' ? 'alert-error' : 'alert-ok'}`}>
          {bannerMsg.type === 'err' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          <span>{bannerMsg.text}</span>
        </div>
      )}

      {mainTab === 'ventas' ? (
        <VentasTiendaTab ventas={ventas} resumen={ventasResumen} onAnular={onAnularSale} />
      ) : mainTab === 'movimientos' ? (
        <div className="card">
          <div className="card-h">
            <h3>Historial de movimientos de stock</h3>
            <button type="button" className="secondary btn-sm" onClick={onReload} disabled={loading}>
              <RefreshCw size={13} /> Actualizar
            </button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Prenda</th>
                  <th>Talle</th>
                  <th>Motivo</th>
                  <th className="num">Delta</th>
                  <th className="num">Stock Final</th>
                  <th>Medio de Pago</th>
                  <th>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="empty">Todavía no hay movimientos registrados.</td>
                  </tr>
                ) : (
                  movimientos.map((m) => (
                    <tr key={m.id}>
                      <td className="muted" style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                        {new Date(m.created_at).toLocaleString('es-AR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td><strong>{m.producto_nombre}</strong></td>
                      <td><span className="badge-sand">{m.talle}</span></td>
                      <td>{MOTIVO_LABELS[m.motivo]}</td>
                      <td className="num tabular-nums">
                        <strong style={{ color: m.delta > 0 ? 'var(--color-secondary)' : 'var(--danger)' }}>
                          {m.delta > 0 ? `+${m.delta}` : m.delta}
                        </strong>
                      </td>
                      <td className="num tabular-nums">{m.stock_resultante}</td>
                      <td>{m.medio_pago ? MEDIO_LABELS[m.medio_pago] || m.medio_pago : '—'}</td>
                      <td className="muted" style={{ fontSize: '12px' }}>{m.nota || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>
          {/* Métricas compactas */}
          <div className="metrics">
            <Metric label="Prendas" value={String(resumen.total_productos)} note={`${resumen.unidades_totales} unidades en stock`} />
            <Metric label="Últimas Unidades" value={String(resumen.productos_ultimas_oportunidades)} note={`Stock total ≤ ${umbralUltimas}`} />
            <Metric label="Sin Stock" value={String(resumen.variantes_sin_stock)} note="Talles en 0" />
            <Metric
              label="Sincronización"
              value={String(resumen.variantes_pendientes_sync)}
              note={resumen.tiendanube_conectado ? 'Cambios pendientes de subir' : 'Tiendanube sin conectar'}
            />
          </div>

          <div className="card">
            <div className="card-h" style={{ flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <div className="view-toggle">
                  <button
                    type="button"
                    className={viewMode === 'matriz' ? 'active' : ''}
                    onClick={() => setViewMode('matriz')}
                  >
                    <LayoutGrid size={13} /> Matriz por talle
                  </button>
                  <button
                    type="button"
                    className={viewMode === 'plana' ? 'active' : ''}
                    onClick={() => setViewMode('plana')}
                  >
                    <List size={13} /> Lista completa
                  </button>
                </div>

                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--muted)' }}>
                  Umbral últimas:
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={umbralUltimas}
                    onChange={(e) => onChangeUmbralUltimas(Number(e.target.value))}
                    style={{ width: '50px', padding: '4px 6px', fontSize: '12px' }}
                  />
                </label>
              </div>

              <button type="button" className="secondary btn-sm" onClick={onReload} disabled={loading}>
                <RefreshCw size={13} /> Actualizar
              </button>
            </div>

            {/* Filtros */}
            <div className="tienda-filter-bar">
              <div className="search-box" style={{ flex: '1 1 220px' }}>
                <Search size={15} />
                <input
                  type="text"
                  placeholder="Buscar prenda o talle..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <select
                value={selectedCatId === 'todas' ? 'todas' : String(selectedCatId)}
                onChange={(e) => setSelectedCatId(e.target.value === 'todas' ? 'todas' : Number(e.target.value))}
                style={{ width: 'auto', minWidth: '150px', padding: '7px 10px', fontSize: '12px' }}
                aria-label="Filtrar por sección"
              >
                <option value="todas">Todas las secciones</option>
                {categorias
                  .filter((c) => c.tiendanube_category_id !== null)
                  .map((c) => (
                    <option key={c.id} value={c.tiendanube_category_id!}>
                      {c.nombre}
                    </option>
                  ))}
              </select>

              <div className="filter-pills">
                {([
                  ['todos', 'Todas'],
                  ['ultimas', 'Últimas'],
                  ['sin_stock', 'Sin stock'],
                  ['ocultos', 'Ocultas'],
                  ['pendientes', 'Pendientes sync'],
                ] as const).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    className={filterMode === key ? 'pill-btn active' : 'pill-btn'}
                    onClick={() => setFilterMode(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Contenido Matriz o Plana */}
            {viewMode === 'matriz' ? (
              <div className="table-wrap">
                <table className="matrix-table">
                  <thead>
                    <tr>
                      <th style={{ width: '32px' }}>
                        <input
                          type="checkbox"
                          checked={filteredProducts.length > 0 && selectedProductIds.length === filteredProducts.length}
                          onChange={(e) =>
                            setSelectedProductIds(e.target.checked ? filteredProducts.map((p) => p.id) : [])
                          }
                          aria-label="Seleccionar todas"
                        />
                      </th>
                      <th>Prenda</th>
                      <th className="num">Precio</th>
                      {standardCols.map((t) => (
                        <th key={t} className="center">{t}</th>
                      ))}
                      {hasOtherCol && <th className="center">Otro</th>}
                      <th className="center">Tienda</th>
                      <th className="num">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={6 + standardCols.length + (hasOtherCol ? 1 : 0)} className="empty">
                          {productos.length === 0
                            ? 'No hay prendas todavía. Creá una nueva o traé tu catálogo desde Tiendanube.'
                            : 'Ninguna prenda coincide con los filtros actuales.'}
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((prod) => {
                        const thumb = prod.images[0]?.src
                        const firstVar = prod.variantes[0]
                        const byTalle = new Map<string, TiendaVariant>()
                        const otherVars: TiendaVariant[] = []
                        for (const v of prod.variantes) {
                          const up = v.talle.trim().toUpperCase()
                          if (standardCols.includes(up)) {
                            byTalle.set(up, v)
                          } else {
                            otherVars.push(v)
                          }
                        }

                        return (
                          <tr key={prod.id} style={!prod.published ? { opacity: 0.65 } : undefined}>
                            <td>
                              <input
                                type="checkbox"
                                checked={selectedProductIds.includes(prod.id)}
                                onChange={() => toggleProductSelection(prod.id)}
                                aria-label={`Seleccionar ${prod.nombre}`}
                              />
                            </td>
                            <td>
                              <div className="prod-cell">
                                {thumb ? (
                                  <img src={thumb} alt={prod.nombre} className="mini-thumb" />
                                ) : (
                                  <span className="mini-thumb placeholder" />
                                )}
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                    <strong style={{ fontSize: '13.5px' }}>{prod.nombre}</strong>
                                    {prod.es_ultimas_oportunidades && <span className="badge-warn">Últimas</span>}
                                    {prod.sin_stock && <span className="badge-danger">Sin stock</span>}
                                  </div>
                                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '3px' }}>
                                    {prod.categorias_nombres.map((cn) => (
                                      <span key={cn} className="badge-sand" style={{ fontSize: '10px', padding: '1px 6px' }}>
                                        {cn}
                                      </span>
                                    ))}
                                    <span className="muted" style={{ fontSize: '11px' }}>
                                      Total: {prod.stock_total} u.
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="num tabular-nums">
                              {firstVar ? (
                                <div>
                                  <strong>
                                    {money.format(
                                      firstVar.precio_promocional && firstVar.precio_promocional > 0
                                        ? firstVar.precio_promocional
                                        : firstVar.precio
                                    )}
                                  </strong>
                                  {firstVar.precio_promocional && firstVar.precio_promocional > 0 && (
                                    <div className="muted" style={{ fontSize: '11px', textDecoration: 'line-through' }}>
                                      {money.format(firstVar.precio)}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                '—'
                              )}
                            </td>

                            {standardCols.map((col) => {
                              const v = byTalle.get(col)
                              return (
                                <td key={col} className="center">
                                  {v ? renderStockCell(v) : <span className="muted">—</span>}
                                </td>
                              )
                            })}

                            {hasOtherCol && (
                              <td className="center">
                                {otherVars.length === 0 ? (
                                  <span className="muted">—</span>
                                ) : (
                                  <div style={{ display: 'grid', gap: '4px', justifyItems: 'center' }}>
                                    {otherVars.map((ov) => (
                                      <div key={ov.id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <small className="muted">{ov.talle}</small>
                                        {renderStockCell(ov)}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </td>
                            )}

                            <td className="center">
                              <button
                                type="button"
                                className={prod.published ? 'vis-toggle on' : 'vis-toggle'}
                                onClick={() => void handleTogglePublished(prod)}
                                title={prod.published ? 'Visible en Tiendanube (click para ocultar)' : 'Oculta en Tiendanube (click para publicar)'}
                              >
                                {prod.published ? 'Visible' : 'Oculta'}
                              </button>
                            </td>

                            <td className="num">
                              <div style={{ display: 'inline-flex', gap: '6px' }}>
                                <button
                                  type="button"
                                  className="secondary btn-sm"
                                  onClick={() => setEditingProduct(prod)}
                                  title="Editar prenda y fotos"
                                >
                                  <Edit3 size={13} />
                                </button>
                                <button
                                  type="button"
                                  className="primary btn-sm"
                                  disabled={prod.stock_total <= 0}
                                  onClick={() => {
                                    setVentaInitialProdId(prod.id)
                                    setShowVentaModal(true)
                                  }}
                                >
                                  Vender
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Vista Plana por variante */
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Prenda</th>
                      <th>Talle</th>
                      <th className="num">Precio</th>
                      <th className="num">Promo</th>
                      <th>Stock</th>
                      <th>Estado</th>
                      <th className="num">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flatRows.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="empty">No hay variantes para mostrar.</td>
                      </tr>
                    ) : (
                      flatRows.map(({ producto, variante }) => {
                        const draft = drafts[variante.id]
                        const effStock = draft?.stock ?? variante.stock
                        const effPrecio = draft?.precio ?? variante.precio
                        const effPromo = draft?.clear_promocional
                          ? ''
                          : (draft?.precio_promocional ?? variante.precio_promocional ?? '')

                        return (
                          <tr key={variante.id}>
                            <td>
                              <strong>{producto.nombre}</strong>
                              <div className="muted" style={{ fontSize: '11px' }}>
                                {producto.categorias_nombres.join(' · ') || producto.categoria || 'Sin sección'}
                              </div>
                            </td>
                            <td><span className="badge-sand">{variante.talle}</span></td>
                            <td className="num">
                              <input
                                type="number"
                                min={0}
                                step="any"
                                className={`cell-input ${draft?.precio !== undefined ? 'dirty' : ''}`}
                                value={effPrecio}
                                onChange={(e) => updateDraftField(variante, { precio: Math.max(0, Number(e.target.value) || 0) })}
                              />
                            </td>
                            <td className="num">
                              <input
                                type="number"
                                min={0}
                                step="any"
                                placeholder="—"
                                className={`cell-input ${draft?.precio_promocional !== undefined || draft?.clear_promocional ? 'dirty' : ''}`}
                                value={effPromo}
                                onChange={(e) => {
                                  const raw = e.target.value
                                  if (!raw) updateDraftField(variante, { clear_promocional: true, precio_promocional: null })
                                  else updateDraftField(variante, { clear_promocional: false, precio_promocional: Math.max(0, Number(raw) || 0) })
                                }}
                              />
                            </td>
                            <td>{renderStockCell(variante)}</td>
                            <td>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                {effStock === 0 ? (
                                  <span className="badge-danger">Sin stock</span>
                                ) : effStock <= umbralUltimas ? (
                                  <span className="badge-warn">Últimas</span>
                                ) : (
                                  <span className="badge-sea">En stock</span>
                                )}
                                <SyncDot status={variante.sync_status} error={variante.last_sync_error} />
                              </div>
                            </td>
                            <td className="num">
                              <button
                                type="button"
                                className="primary btn-sm"
                                disabled={variante.stock <= 0}
                                onClick={() => {
                                  setVentaInitialProdId(producto.id)
                                  setShowVentaModal(true)
                                }}
                              >
                                Vender
                              </button>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Barra flotante de cambios pendientes */}
            {dirtyCount > 0 && (
              <div className="dirty-bar">
                <div style={{ fontSize: '13px', fontWeight: 600 }}>
                  Tenés <strong>{dirtyCount}</strong> {dirtyCount === 1 ? 'celda modificada' : 'celdas modificadas'} sin guardar
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="secondary btn-sm"
                    onClick={() => setDrafts({})}
                    disabled={savingBatch}
                  >
                    <RotateCcw size={13} /> Descartar
                  </button>
                  <button
                    type="button"
                    className="primary btn-sm"
                    onClick={() => void handleSaveBatch()}
                    disabled={savingBatch}
                  >
                    <Save size={13} /> {savingBatch ? 'Guardando...' : 'Guardar y sincronizar'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modales */}
      {editingProduct !== null && (
        <ModalProductoTienda
          producto={editingProduct === 'new' ? null : editingProduct}
          categorias={categorias}
          tiendanubeConectado={resumen.tiendanube_conectado}
          onCreate={onCreateProduct}
          onUpdate={onUpdateProduct}
          onDelete={onDeleteProduct}
          onCreateCategoria={onCreateCategory}
          onUploadPhoto={onUploadPhoto}
          onDeletePhoto={onDeletePhoto}
          onReorderPhotos={onReorderPhotos}
          onClose={() => setEditingProduct(null)}
        />
      )}

      {showVentaModal && (
        <ModalCrearVenta
          productos={productos}
          initialProductId={ventaInitialProdId}
          onConfirm={onCreateSale}
          onClose={() => setShowVentaModal(false)}
        />
      )}

      {showImportModal && (
        <ModalImportarCsv onImport={onImportCsv} onClose={() => setShowImportModal(false)} />
      )}

      {showBulkModal && (
        <ModalAjusteMasivo
          productos={productos}
          categorias={categorias}
          initialSelectedProductIds={selectedProductIds}
          onConfirm={onBulkPriceAdjustment}
          onClose={() => setShowBulkModal(false)}
        />
      )}
    </div>
  )
}
