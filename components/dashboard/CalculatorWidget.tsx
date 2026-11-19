'use client'

import React, { useEffect, useState } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import type { Producto, ViewId } from '@/lib/types'
import { money } from '@/lib/utils'
import { SmartNumberInput } from '@/components/ui/SmartNumberInput'

export interface CalculatorWidgetProps {
  productos: Producto[]
  setView: (v: ViewId) => void
  loading?: boolean
}

export function CalculatorWidget({
  productos,
  setView,
  loading = false,
}: CalculatorWidgetProps): React.JSX.Element {
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
          <h2>Simulador Rápido</h2>
        </div>
        {loading ? (
          <div className="card-loading-center">
            <RefreshCw size={18} className="animate-spin" />
            <p style={{ margin: 0 }}>Cargando catálogo...</p>
          </div>
        ) : (
          <div className="empty-state">
            <p>Sin modelos en catálogo</p>
            <small style={{ display: 'block', marginBottom: '16px' }}>
              Cargá prendas en el catálogo para simular costos.
            </small>
            <button className="secondary full" onClick={() => setView('telas')}>
              Ver Telas
            </button>
          </div>
        )}
      </section>
    )
  }

  return (
    <section className="card calculator">
      <div className="section-heading">
        <h2>Simulador Rápido</h2>
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
          <SmartNumberInput
            min="1"
            value={quantity}
            onChangeValue={(val) => setQuantity(Math.max(1, val))}
          />
        </label>
      </div>
      <div className="calc-breakdown">
        <div>
          <span>Costo base</span>
          <strong className="tabular-nums">{money.format(product.costo_base)}</strong>
        </div>
        <div>
          <span>Estampa ({product.tipo_estampado})</span>
          <strong className="tabular-nums">{money.format(product.costo_estampado)}</strong>
        </div>
        <div>
          <span>Unitario sugerido</span>
          <strong className="green tabular-nums">{money.format(product.precio_venta)}</strong>
        </div>
      </div>
      <div className="calc-total">
        <span>
          Total estimado <small>{quantity} u.</small>
        </span>
        <strong className="tabular-nums">{money.format(total)}</strong>
      </div>
      <button className="primary full" onClick={() => setView('nuevo')}>
        <Plus size={15} /> Cotizar presupuesto
      </button>
    </section>
  )
}
