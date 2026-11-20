'use client'

import React, { useMemo, useState } from 'react'
import { AlertCircle, ArrowDownRight, ArrowUpRight, Percent, X } from 'lucide-react'
import type {
  TiendaBulkPricePayload,
  TiendaBulkPriceResponse,
  TiendaCategory,
  TiendaProduct,
} from '@/lib/types'
import { calcularPrecioAjustado } from '@/lib/tienda-utils'
import { money } from '@/lib/utils'
import { SmartNumberInput } from '@/components/ui/SmartNumberInput'

export interface ModalAjusteMasivoProps {
  productos: TiendaProduct[]
  categorias: TiendaCategory[]
  initialSelectedProductIds?: number[]
  onConfirm: (payload: TiendaBulkPricePayload) => Promise<TiendaBulkPriceResponse>
  onClose: () => void
}

const REDONDEOS = [
  { value: 100, label: 'Redondear a $100' },
  { value: 500, label: 'Redondear a $500' },
  { value: 1000, label: 'Redondear a $1.000' },
  { value: 1, label: 'Sin redondeo' },
]

export function ModalAjusteMasivo({
  productos,
  categorias,
  initialSelectedProductIds = [],
  onConfirm,
  onClose,
}: ModalAjusteMasivoProps) {
  const [modo, setModo] = useState<'aumento' | 'descuento'>('aumento')
  const [magnitud, setMagnitud] = useState<number>(10)
  const [alcance, setAlcance] = useState<'todas' | 'seccion' | 'seleccion'>(
    initialSelectedProductIds.length > 0 ? 'seleccion' : 'todas'
  )
  const [selectedCatId, setSelectedCatId] = useState<number | ''>('')
  const [selectedProdIds, setSelectedProdIds] = useState<number[]>(initialSelectedProductIds)
  const [searchProd, setSearchProd] = useState<string>('')
  const [redondeo, setRedondeo] = useState<number>(100)
  const [aplicarPromo, setAplicarPromo] = useState<boolean>(false)
  const [saving, setSaving] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  const porcentajeEfectivo = modo === 'aumento' ? Math.abs(magnitud) : -Math.abs(magnitud)

  const productosFiltradosLista = useMemo(() => {
    const q = searchProd.trim().toLowerCase()
    if (!q) return productos
    return productos.filter((p) => p.nombre.toLowerCase().includes(q))
  }, [productos, searchProd])

  const productosAfectados = useMemo(() => {
    if (alcance === 'seleccion') {
      const set = new Set(selectedProdIds)
      return productos.filter((p) => set.has(p.id))
    }
    if (alcance === 'seccion' && selectedCatId !== '') {
      return productos.filter((p) => p.category_ids.includes(Number(selectedCatId)))
    }
    return productos
  }, [productos, alcance, selectedCatId, selectedProdIds])

  const variantesAfectadas = useMemo(
    () =>
      productosAfectados.flatMap((p) =>
        p.variantes.map((v) => ({ productoNombre: p.nombre, variante: v }))
      ),
    [productosAfectados]
  )

  const muestra = variantesAfectadas[0]
  const precioMuestraNuevo = muestra
    ? calcularPrecioAjustado(muestra.variante.precio, porcentajeEfectivo, redondeo)
    : 0

  const toggleProdSelection = (id: number) => {
    setSelectedProdIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!Number.isFinite(magnitud) || magnitud <= 0) {
      setError('Ingresá un porcentaje mayor a 0.')
      return
    }
    if (modo === 'descuento' && magnitud > 90) {
      setError('El descuento máximo permitido es 90%.')
      return
    }
    if (modo === 'aumento' && magnitud > 500) {
      setError('El aumento máximo permitido es 500%.')
      return
    }
    if (alcance === 'seleccion' && selectedProdIds.length === 0) {
      setError('Seleccioná al menos una prenda para aplicar el ajuste.')
      return
    }
    if (alcance === 'seccion' && selectedCatId === '') {
      setError('Elegí una sección para filtrar.')
      return
    }
    if (variantesAfectadas.length === 0) {
      setError('No hay prendas afectadas por el filtro actual.')
      return
    }

    setSaving(true)
    setError('')
    try {
      await onConfirm({
        porcentaje: porcentajeEfectivo,
        category_id: alcance === 'seccion' && selectedCatId !== '' ? Number(selectedCatId) : null,
        product_ids: alcance === 'seleccion' ? selectedProdIds : null,
        redondeo,
        aplicar_a_promocional: aplicarPromo,
      })
      onClose()
    } catch (err: any) {
      setError(err?.message || 'No se pudo aplicar el ajuste masivo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="close" onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>

        <h2>Ajuste Masivo de Precios</h2>
        <p className="muted" style={{ marginBottom: '14px' }}>
          Aplicá aumentos o descuentos a todo el catálogo, a una sección o a prendas específicas y sincronizalo directo con Tiendanube.
        </p>

        {error && (
          <div className="alert alert-error" style={{ margin: '0 0 14px' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              className={modo === 'aumento' ? 'pill-btn active' : 'pill-btn'}
              style={{ padding: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              onClick={() => setModo('aumento')}
            >
              <ArrowUpRight size={16} /> Aumento (+%)
            </button>
            <button
              type="button"
              className={modo === 'descuento' ? 'pill-btn active' : 'pill-btn'}
              style={{ padding: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              onClick={() => setModo('descuento')}
            >
              <ArrowDownRight size={16} /> Descuento (-%)
            </button>
          </div>

          <div className="form-grid-2">
            <label>
              Porcentaje ({modo === 'aumento' ? '+' : '-'}%)
              <SmartNumberInput
                min={1}
                max={modo === 'descuento' ? 90 : 500}
                step="any"
                fallback={10}
                value={magnitud}
                onChangeValue={(val) => setMagnitud(Math.abs(val))}
                required
              />
            </label>

            <label>
              Regla de redondeo
              <select
                value={redondeo}
                onChange={(e) => setRedondeo(Number(e.target.value))}
              >
                {REDONDEOS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div>
            <span className="field-label-sm">Aplicar a:</span>
            <div className="filter-pills" style={{ marginTop: '6px' }}>
              <button
                type="button"
                className={alcance === 'todas' ? 'pill-btn active' : 'pill-btn'}
                onClick={() => setAlcance('todas')}
              >
                Todo el catálogo ({productos.length})
              </button>
              <button
                type="button"
                className={alcance === 'seccion' ? 'pill-btn active' : 'pill-btn'}
                onClick={() => setAlcance('seccion')}
              >
                Por sección
              </button>
              <button
                type="button"
                className={alcance === 'seleccion' ? 'pill-btn active' : 'pill-btn'}
                onClick={() => setAlcance('seleccion')}
              >
                Prendas elegidas ({selectedProdIds.length})
              </button>
            </div>
          </div>

          {alcance === 'seccion' && (
            <label>
              Elegir sección
              <select
                value={selectedCatId}
                onChange={(e) => setSelectedCatId(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">Seleccioná una sección...</option>
                {categorias
                  .filter((c) => c.tiendanube_category_id !== null)
                  .map((cat) => (
                    <option key={cat.id} value={cat.tiendanube_category_id!}>
                      {cat.nombre}
                    </option>
                  ))}
              </select>
            </label>
          )}

          {alcance === 'seleccion' && (
            <div className="bulk-select-box">
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                <input
                  type="text"
                  placeholder="Filtrar prendas..."
                  value={searchProd}
                  onChange={(e) => setSearchProd(e.target.value)}
                  style={{ flex: 1, padding: '6px 10px', fontSize: '12px' }}
                />
                <button
                  type="button"
                  className="secondary btn-sm"
                  onClick={() => setSelectedProdIds(productosFiltradosLista.map((p) => p.id))}
                >
                  Todas
                </button>
                <button
                  type="button"
                  className="secondary btn-sm"
                  onClick={() => setSelectedProdIds([])}
                >
                  Ninguna
                </button>
              </div>
              <div className="bulk-select-list">
                {productosFiltradosLista.map((p) => {
                  const checked = selectedProdIds.includes(p.id)
                  return (
                    <label key={p.id} className="check" style={{ padding: '4px 6px', fontSize: '13px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleProdSelection(p.id)}
                      />
                      <span style={{ flex: 1 }}>{p.nombre}</span>
                      <span className="muted tabular-nums" style={{ fontSize: '12px' }}>
                        {p.variantes[0] ? money.format(p.variantes[0].precio) : '—'}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          <label className="check" style={{ cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={aplicarPromo}
              onChange={(e) => setAplicarPromo(e.target.checked)}
            />
            <span>Aplicar también al precio promocional (si tiene)</span>
          </label>

          <div className="modal-total">
            <span>Prendas: {productosAfectados.length} · Variantes: {variantesAfectadas.length}</span>
            {muestra ? (
              <strong className="tabular-nums" style={{ fontSize: '15px' }}>
                Ej. {muestra.productoNombre} ({muestra.variante.talle}):{' '}
                {money.format(muestra.variante.precio)} → {money.format(precioMuestraNuevo)}
              </strong>
            ) : (
              <strong style={{ fontSize: '14px' }}>Sin prendas seleccionadas</strong>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button type="button" className="secondary" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button
              type="submit"
              className="primary"
              style={{ flex: 1 }}
              disabled={saving || variantesAfectadas.length === 0}
            >
              <Percent size={15} />{' '}
              {saving
                ? 'Aplicando y sincronizando...'
                : `Aplicar ${modo === 'aumento' ? '+' : '-'}${magnitud}%`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
