'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { AlertCircle, Check, FileDown } from 'lucide-react'
import type {
  Producto, Configuracion, PresupuestoDraft, PresupuestoDraftItem, PresupuestoCreatePayload, ViewId,
} from '@/lib/types'
import { calcularPrecioUnitarioProducto } from '@/lib/pricing'
import { presupuestosService } from '@/lib/api/services'
import { money } from '@/lib/utils'
import { CondicionesPdfCard } from '@/components/presupuestos/CondicionesPdfCard'
import { PresupuestoItemsCard } from '@/components/presupuestos/PresupuestoItemsCard'
import { CatalogoPickerCard } from '@/components/presupuestos/CatalogoPickerCard'
import { SmartNumberInput } from '@/components/ui/SmartNumberInput'

export interface NuevoPresupuestoViewProps {
  productos: Producto[]
  config: Configuracion | null
  initialData?: PresupuestoDraft | null
  onSubmitPresupuesto?: (payload: PresupuestoCreatePayload) => Promise<void>
  setView: (v: ViewId) => void
  token?: string
  isDemo?: boolean
  onPresupuestoCreado?: () => void
  onCreateDemoPresupuesto?: (
    cliente: string, multiplicador: number, costoFijo: number,
    items: Array<{ producto_id: number; cantidad: number }>, descripcionPdf?: string
  ) => void
}

export function NuevoPresupuestoView({
  productos, config, initialData, onSubmitPresupuesto, setView,
  token, isDemo, onPresupuestoCreado, onCreateDemoPresupuesto,
}: NuevoPresupuestoViewProps) {
  const [cliente, setCliente] = useState(initialData?.cliente ?? '')
  const [multiplicador, setMultiplicador] = useState<number>(initialData?.multiplicador ?? (config?.multiplicador ?? 2.0))
  const [costoFijo, setCostoFijo] = useState<number>(initialData?.costoFijo ?? (config?.costo_fijo ?? 6000))
  const [descripcionPdf, setDescripcionPdf] = useState<string>(initialData?.descripcion_pdf ?? (config?.descripcion_pdf ?? ''))
  const [items, setItems] = useState<PresupuestoDraftItem[]>(initialData?.items ?? [])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (initialData) {
      setCliente(initialData.cliente)
      setMultiplicador(initialData.multiplicador)
      setCostoFijo(initialData.costoFijo)
      setDescripcionPdf(initialData.descripcion_pdf ?? config?.descripcion_pdf ?? '')
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
      setItems(items.map((it) => (it.producto_id === productoId ? { ...it, cantidad: it.cantidad + 1 } : it)))
    } else {
      setItems([...items, { producto_id: productoId, cantidad: 1, detalle_estampado: '' }])
    }
  }

  const handleRemoveItem = (index: number) => setItems(items.filter((_, i) => i !== index))
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
        totalPrecio += calcularPrecioUnitarioProducto(p, multiplicador, costoFijo) * it.cantidad
      }
    }
    return { totalPrendas, totalPrecio }
  }, [items, productos, multiplicador, costoFijo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cliente.trim()) return setError('Por favor ingresá el nombre o referencia del cliente.')
    if (items.length === 0) return setError('Agregá al menos una prenda al presupuesto.')
    setError('')
    setSaving(true)

    const payload: PresupuestoCreatePayload = {
      cliente: cliente.trim(),
      multiplicador: Number(multiplicador),
      costo_fijo: Number(costoFijo),
      descripcion_pdf: descripcionPdf,
      items: items.map((it) => ({
        producto_id: it.producto_id,
        cantidad: it.cantidad,
        detalle_estampado: it.detalle_estampado || undefined,
      })),
    }

    try {
      if (onSubmitPresupuesto) {
        await onSubmitPresupuesto(payload)
      } else if (isDemo) {
        onCreateDemoPresupuesto?.(payload.cliente, payload.multiplicador, payload.costo_fijo, payload.items, payload.descripcion_pdf)
      } else {
        await presupuestosService.create(payload, token || '')
      }
      onPresupuestoCreado?.()
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
          <p className="muted">Cotización multi-prenda con congelamiento histórico de costos y condiciones en PDF.</p>
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
              <div className="section-heading"><h2>Información del Cliente</h2></div>
              <div className="card-body" style={{ display: 'grid', gap: '14px' }}>
                <label>
                  Cliente / Referencia Comercial
                  <input type="text" value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Ej: Club Náutico, Marca Surf..." required />
                </label>
                <div className="form-grid-2">
                  <label>
                    Multiplicador Comercial
                    <SmartNumberInput step="0.1" min="1" value={multiplicador} onChangeValue={setMultiplicador} required />
                  </label>
                  <label>
                    Costo Fijo por Prenda ($)
                    <SmartNumberInput step="any" min="0" value={costoFijo} onChangeValue={setCostoFijo} required />
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

            <PresupuestoItemsCard
              items={items}
              productos={productos}
              multiplicador={multiplicador}
              costoFijo={costoFijo}
              onUpdateCantidad={handleUpdateCantidad}
              onRemoveItem={handleRemoveItem}
            />
          </div>

          <div className="right-column">
            <CatalogoPickerCard
              productos={productos}
              multiplicador={multiplicador}
              costoFijo={costoFijo}
              onAddItem={handleAddItem}
            />

            <section className="card quote-summary-card">
              <div className="section-heading"><h2>Total Estimado</h2></div>
              <div className="calc-breakdown">
                <div><span>Prendas totales</span><strong className="tabular-nums">{resumen.totalPrendas} u.</strong></div>
                <div><span>Multiplicador</span><strong className="tabular-nums">{multiplicador.toFixed(1)}x</strong></div>
              </div>
              <div className="calc-total">
                <span>Total Cotizado</span><strong className="tabular-nums">{money.format(resumen.totalPrecio)}</strong>
              </div>
              <div style={{ padding: '0 20px 20px' }}>
                <button type="submit" className="primary full" disabled={saving || items.length === 0}>
                  {saving ? 'Guardando...' : 'Confirmar Presupuesto'}<Check size={16} />
                </button>
              </div>
            </section>
          </div>
        </div>
      </form>
    </div>
  )
}
