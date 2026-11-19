'use client'

import React, { useMemo, useState } from 'react'
import { Plus, Search, X } from 'lucide-react'
import type { Producto } from '@/lib/types'
import { calcularPrecioUnitarioProducto } from '@/lib/pricing'
import { money } from '@/lib/utils'

export interface CatalogoPickerCardProps {
  productos: Producto[]
  multiplicador: number
  costoFijo: number
  onAddItem: (productoId: number) => void
}

export function CatalogoPickerCard({
  productos,
  multiplicador,
  costoFijo,
  onAddItem,
}: CatalogoPickerCardProps): React.JSX.Element {
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

  return (
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
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: 'var(--muted)',
                  display: 'flex',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      <div
        style={{
          padding: '0 16px 16px',
          display: 'grid',
          gap: '8px',
          maxHeight: '420px',
          overflowY: 'auto',
        }}
      >
        {productos.length === 0 ? (
          <p
            style={{
              color: 'var(--muted)',
              fontSize: '12px',
              textAlign: 'center',
              padding: '20px 0',
            }}
          >
            No hay prendas en catálogo.
          </p>
        ) : filteredCatalogo.length === 0 ? (
          <p
            style={{
              color: 'var(--muted)',
              fontSize: '12px',
              textAlign: 'center',
              padding: '20px 0',
            }}
          >
            No se encontraron prendas para &quot;{searchCatalogo}&quot;.
          </p>
        ) : (
          filteredCatalogo.map((prod) => {
            const dynamicPrice = calcularPrecioUnitarioProducto(prod, multiplicador, costoFijo)
            return (
              <div key={prod.id} className="catalog-picker-item">
                <div>
                  <strong style={{ fontSize: '12px' }}>{prod.nombre}</strong>
                  <small
                    style={{
                      display: 'block',
                      color: 'var(--muted)',
                      fontSize: '11px',
                      marginTop: '2px',
                    }}
                    className="tabular-nums"
                  >
                    {money.format(dynamicPrice)}
                  </small>
                </div>
                <button
                  type="button"
                  className="secondary btn-sm"
                  onClick={() => onAddItem(prod.id)}
                >
                  <Plus size={14} /> Agregar
                </button>
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}
