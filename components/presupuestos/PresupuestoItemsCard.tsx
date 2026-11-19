'use client'

import React from 'react'
import { Trash2 } from 'lucide-react'
import type { PresupuestoDraftItem, Producto } from '@/lib/types'
import { calcularPrecioUnitarioProducto } from '@/lib/pricing'
import { money } from '@/lib/utils'
import { SmartNumberInput } from '@/components/ui/SmartNumberInput'

export interface PresupuestoItemsCardProps {
  items: PresupuestoDraftItem[]
  productos: Producto[]
  multiplicador: number
  costoFijo: number
  onUpdateCantidad: (index: number, cantidad: number) => void
  onRemoveItem: (index: number) => void
}

export function PresupuestoItemsCard({
  items,
  productos,
  multiplicador,
  costoFijo,
  onUpdateCantidad,
  onRemoveItem,
}: PresupuestoItemsCardProps): React.JSX.Element {
  return (
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
                    onChangeValue={(val) => onUpdateCantidad(idx, val)}
                  />
                </div>
                <div style={{ minWidth: '110px', textAlign: 'right' }}>
                  <strong className="green tabular-nums">{money.format(subtotal)}</strong>
                </div>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => onRemoveItem(idx)}
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
  )
}
