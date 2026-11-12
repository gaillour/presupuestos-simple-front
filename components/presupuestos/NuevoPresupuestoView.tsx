'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { AlertCircle, Check, FileDown, Plus, Search, Trash2, X } from 'lucide-react'
import type { Producto, Configuracion } from '@/lib/types'
import { calcularPrecioUnitarioProducto } from '@/lib/pricing'
import { API_BASE, money } from '@/lib/utils'
import { CondicionesPdfCard } from '@/components/presupuestos/CondicionesPdfCard'
import { SmartNumberInput } from '@/components/ui/SmartNumberInput'

export interface NuevoPresupuestoViewProps {
  productos: Producto[]
  config: Configuracion | null
  token: string
  isDemo?: boolean
  initialData?: {
    cliente: string
    multiplicador: number
    costoFijo: number
    descripcion_pdf?: string
    items: Array<{ producto_id: number; cantidad: number; detalle_estampado: string }>
  } | null
  onPresupuestoCreado: () => void
  onCreateDemoPresupuesto?: (
    cliente: string,
    multiplicador: number,
    costoFijo: number,
    items: Array<{ producto_id: number; cantidad: number }>,
    descripcionPdf?: string
  ) => void
  setView: (v: string) => void
}

export function NuevoPresupuestoView({
  productos,
  config,
  token,
  isDemo,
  initialData,
  onPresupuestoCreado,
  onCreateDemoPresupuesto,
  setView,
}: NuevoPresupuestoViewProps) {
  const [cliente, setCliente] = useState(initialData?.cliente ?? '')
  const [multiplicador, setMultiplicador] = useState<number>(
    initialData?.multiplicador ?? (config?.multiplicador ?? 2.0)
  )
  const [costoFijo, setCostoFijo] = useState<number>(
    initialData?.costoFijo ?? (config?.costo_fijo ?? 6000)
  )
  const [descripcionPdf, setDescripcionPdf] = useState<string>(
    initialData?.descripcion_pdf ?? (config?.descripcion_pdf ?? '')
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
  const [searchCatalogo, setSearchCatalogo] = useState('')

  const filteredCatalogo = useMemo(() => {
    if (!searchCatalogo.trim()) return productos
    const q = searchCatalogo.toLowerCase()
    return productos.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        p.tela?.nombre.toLowerCase().includes(q) ||
        p.tela_secundaria?.nombre.toLowerCase().includes(q) ||
        p.tipo_estampado?.toLowerCase().includes(q)
    )
  }, [productos, searchCatalogo])

  useEffect(() => {
    if (initialData) {
      setCliente(initialData.cliente)
      setMultiplicador(initialData.multiplicador)
      setCostoFijo(initialData.costoFijo)
      if (initialData.descripcion_pdf !== undefined) {
        setDescripcionPdf(initialData.descripcion_pdf)
      } else if (config?.descripcion_pdf) {
        setDescripcionPdf(config.descripcion_pdf)
      }
      setItems(initialData.items)
    } else if (config) {
      if (config.multiplicador && !multiplicador) setMultiplicador(config.multiplicador)
      if (config.costo_fijo && !costoFijo) setCostoFijo(config.costo_fijo)
      if (!descripcionPdf && config.descripcion_pdf) setDescripcionPdf(config.descripcion_pdf)
    }
  }, [config, initialData, multiplicador, costoFijo])

  const handleAddItem = (productoId: number) => {
    const existing = items.find((it) => it.producto_id === productoId)
    if (existing) {
      setItems(
        items.map((it) =>
          it.producto_id === productoId ? { ...it, cantidad: it.cantidad + 1 } : it
        )
      )
    } else {
      setItems([
        ...items,
        {
          producto_id: productoId,
          cantidad: 1,
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
        const unitPrice = calcularPrecioUnitarioProducto(p, multiplicador, costoFijo)
        totalPrendas += it.cantidad
        totalPrecio += unitPrice * it.cantidad
      }
    }

    return { totalPrendas, totalPrecio }
  }, [items, productos, multiplicador, costoFijo])

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

    if (isDemo) {
      if (onCreateDemoPresupuesto) {
        onCreateDemoPresupuesto(
          cliente.trim(),
          Number(multiplicador),
          Number(costoFijo),
          items,
          descripcionPdf
        )
      } else {
        onPresupuestoCreado()
        setView('historial')
      }
      setSaving(false)
      return
    }

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
          descripcion_pdf: descripcionPdf,
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
          <h1>{initialData ? 'Modificar Presupuesto' : 'Nuevo Presupuesto'}</h1>
          <p className="muted">
            Cotización multi-prenda con congelamiento histórico de costos y condiciones en PDF.
          </p>
        </div>
        <button className="secondary" onClick={() => setView('historial')}>
          <FileDown size={14} /> Ver Historial
        </button>
      </div>

      {error && (
        <div className="alert alert-error" style={{ margin: '0 0 20px' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="content-grid">
          <div className="main-column">
            <section className="card">
              <div className="section-heading">
                <h2>Información del Cliente</h2>
              </div>

              <div className="card-body" style={{ display: 'grid', gap: '14px' }}>
                <label>
                  Cliente / Referencia Comercial
                  <input
                    type="text"
                    value={cliente}
                    onChange={(e) => setCliente(e.target.value)}
                    placeholder="Ej: Club Náutico, Marca Surf..."
                    required
                  />
                </label>

                <div className="form-grid-2">
                  <label>
                    Multiplicador Comercial
                    <SmartNumberInput
                      step="0.1"
                      min="1"
                      value={multiplicador}
                      onChangeValue={(val) => setMultiplicador(val)}
                      required
                    />
                  </label>
                  <label>
                    Costo Fijo por Prenda ($)
                    <SmartNumberInput
                      step="any"
                      min="0"
                      value={costoFijo}
                      onChangeValue={(val) => setCostoFijo(val)}
                      required
                    />
                  </label>
                </div>
              </div>
            </section>

            <CondicionesPdfCard
              descripcionPdf={descripcionPdf}
              onChange={setDescripcionPdf}
              textoBase={config?.descripcion_pdf ?? ''}
              onRestablecer={() => setDescripcionPdf(config?.descripcion_pdf ?? '')}
            />

            <section className="card">
              <div className="section-heading">
                <h2>Ítems del Presupuesto</h2>
                <span className="muted" style={{ fontSize: '12px' }}>
                  {items.length} {items.length === 1 ? 'prenda' : 'prendas'}
                </span>
              </div>

              {items.length === 0 ? (
                <div className="empty-state">
                  <p>Sin prendas agregadas</p>
                  <small>Seleccioná modelos desde el panel lateral derecho para incorporarlos.</small>
                </div>
              ) : (
                <div className="card-body" style={{ display: 'grid', gap: '12px' }}>
                  {items.map((it, idx) => {
                    const prod = productos.find((p) => p.id === it.producto_id)
                    const unitPrice = calcularPrecioUnitarioProducto(prod, multiplicador, costoFijo)
                    const subtotal = unitPrice * it.cantidad

                    return (
                      <div key={idx} className="quote-item-row">
                        <div>
                          <strong>{prod?.nombre || `Producto #${it.producto_id}`}</strong>
                          <small style={{ display: 'block', color: 'var(--muted)', marginTop: '2px' }}>
                            Tela: {prod?.tela?.nombre || 'Estándar'}
                            {prod?.tela_secundaria && (prod?.consumo_metros_secundaria ?? 0) > 0
                              ? ` + ${prod.tela_secundaria.nombre}`
                              : ''}{' '}
                            · <span className="tabular-nums">{money.format(unitPrice)}</span> u.
                          </small>
                        </div>
                        <div style={{ width: '90px' }}>
                          <SmartNumberInput
                            min="1"
                            value={it.cantidad}
                            onChangeValue={(val) => handleUpdateCantidad(idx, val)}
                          />
                        </div>
                        <div style={{ minWidth: '110px', textAlign: 'right' }}>
                          <strong className="green tabular-nums">{money.format(subtotal)}</strong>
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
                <h2>Agregar al Presupuesto</h2>
              </div>

              {productos.length > 0 && (
                <div style={{ padding: '0 16px 12px' }}>
                  <div className="search" style={{ width: '100%' }}>
                    <Search size={15} />
                    <input
                      type="text"
                      value={searchCatalogo}
                      onChange={(e) => setSearchCatalogo(e.target.value)}
                      placeholder="Buscar prenda o tela..."
                    />
                    {searchCatalogo && (
                      <button
                        type="button"
                        onClick={() => setSearchCatalogo('')}
                        aria-label="Limpiar búsqueda"
                        style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--muted)', display: 'flex' }}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div style={{ padding: '0 16px 16px', display: 'grid', gap: '8px', maxHeight: '420px', overflowY: 'auto' }}>
                {productos.length === 0 ? (
                  <p style={{ color: 'var(--muted)', fontSize: '12px', textAlign: 'center', padding: '20px 0' }}>
                    No hay prendas en catálogo.
                  </p>
                ) : filteredCatalogo.length === 0 ? (
                  <p style={{ color: 'var(--muted)', fontSize: '12px', textAlign: 'center', padding: '20px 0' }}>
                    No se encontraron prendas para &quot;{searchCatalogo}&quot;.
                  </p>
                ) : (
                  filteredCatalogo.map((prod) => {
                    const dynamicPrice = calcularPrecioUnitarioProducto(prod, multiplicador, costoFijo)
                    return (
                      <div key={prod.id} className="catalog-picker-item">
                        <div>
                          <strong style={{ fontSize: '12px' }}>{prod.nombre}</strong>
                          <small style={{ display: 'block', color: 'var(--muted)', fontSize: '11px', marginTop: '2px' }} className="tabular-nums">
                            {money.format(dynamicPrice)}
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
                    )
                  })
                )}
              </div>
            </section>

            <section className="card quote-summary-card">
              <div className="section-heading">
                <h2>Total Estimado</h2>
              </div>

              <div className="calc-breakdown">
                <div>
                  <span>Prendas totales</span>
                  <strong className="tabular-nums">{resumen.totalPrendas} u.</strong>
                </div>
                <div>
                  <span>Multiplicador</span>
                  <strong className="tabular-nums">{multiplicador.toFixed(1)}x</strong>
                </div>
              </div>

              <div className="calc-total">
                <span>Total Cotizado</span>
                <strong className="tabular-nums">{money.format(resumen.totalPrecio)}</strong>
              </div>

              <div style={{ padding: '0 20px 20px' }}>
                <button
                  type="submit"
                  className="primary full"
                  disabled={saving || items.length === 0}
                >
                  {saving ? 'Guardando...' : 'Confirmar Presupuesto'}
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
