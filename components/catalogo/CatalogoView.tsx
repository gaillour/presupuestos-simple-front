'use client'

import React, { useMemo, useState } from 'react'
import { AlertCircle, Pencil, Plus, RefreshCw, Search } from 'lucide-react'
import type { Producto, ViewId } from '@/lib/types'
import { money } from '@/lib/utils'
import { Metric } from '@/components/ui/Metric'

export interface CatalogoViewProps {
  productos: Producto[]
  loading: boolean
  error: string | null
  onReload: () => void
  onEditProducto: (prod: Producto) => void
  onNewProducto: () => void
  setView: (v: ViewId) => void
}

export function CatalogoView({
  productos,
  loading,
  error,
  onReload,
  onEditProducto,
  onNewProducto,
}: CatalogoViewProps) {
  const [search, setSearch] = useState('')

  const filteredProductos = useMemo(() => {
    if (!search.trim()) return productos
    const q = search.toLowerCase()
    return productos.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        p.tela?.nombre.toLowerCase().includes(q) ||
        p.tela_secundaria?.nombre.toLowerCase().includes(q) ||
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
          <h1>Catálogo de Prendas</h1>
          <p className="muted">
            Fichas técnicas con consumo textil, confección y precio de venta calculado.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="secondary" onClick={onReload} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Actualizando...' : 'Actualizar'}
          </button>
          <button className="primary" onClick={onNewProducto}>
            <Plus size={15} /> Nueva Prenda
          </button>
        </div>
      </div>

      <div className="metrics">
        <Metric
          label="Prendas en catálogo"
          value={`${productos.length} modelos`}
          note="Fichas de corte activas"
        />
        <Metric
          label="Precio Promedio Venta"
          value={money.format(precioPromedioVenta)}
          note="PVP unitario promedio"
        />
        <Metric
          label="Costo Promedio Producción"
          value={money.format(costoPromedioProd)}
          note="Tela + Taller + Avíos"
        />
      </div>

      {error && (
        <div className="alert alert-error" style={{ margin: '0 0 20px', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={18} />
            <div>
              <strong>No se pudieron cargar los productos</strong>
              <small style={{ display: 'block', marginTop: '2px' }}>
                Ocurrió un error al consultar el catálogo.
              </small>
            </div>
          </div>
          <button
            className="secondary btn-sm"
            onClick={onReload}
          >
            Reintentar
          </button>
        </div>
      )}

      <section className="card">
        <div className="section-heading">
          <h2>Modelos Registrados</h2>
          <div className="search" style={{ minWidth: '220px' }}>
            <Search size={15} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar prenda o tela..."
            />
          </div>
        </div>

        {loading && productos.length === 0 ? (
          <div className="empty-state">
            <RefreshCw size={22} className="animate-spin" style={{ margin: '0 auto 12px' }} />
            <p>Cargando productos...</p>
          </div>
        ) : filteredProductos.length === 0 ? (
          <div className="empty-state">
            <p>
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
                      <span className="badge-sand">{p.tela?.nombre || 'Sin tela'}</span>
                      {p.tela?.precio_metro ? (
                        <small style={{ display: 'block', color: 'var(--muted)', marginTop: '2px' }} className="tabular-nums">
                          {money.format(p.tela.precio_metro)} / m
                        </small>
                      ) : null}
                      {p.tela_secundaria && (p.consumo_metros_secundaria ?? 0) > 0 && (
                        <div style={{ marginTop: '4px', paddingTop: '4px', borderTop: '1px dashed var(--line)' }}>
                          <span className="badge-sand">+ {p.tela_secundaria.nombre}</span>
                          {p.tela_secundaria.precio_metro ? (
                            <small style={{ display: 'block', color: 'var(--muted)', marginTop: '2px' }} className="tabular-nums">
                              {money.format(p.tela_secundaria.precio_metro)} / m
                            </small>
                          ) : null}
                        </div>
                      )}
                    </td>
                    <td className="tabular-nums">
                      <div>{p.consumo_metros} m</div>
                      {p.tela_secundaria && (p.consumo_metros_secundaria ?? 0) > 0 && (
                        <small style={{ display: 'block', color: 'var(--muted)', marginTop: '2px' }}>
                          + {p.consumo_metros_secundaria} m
                        </small>
                      )}
                    </td>
                    <td className="tabular-nums">{money.format(p.costo_confeccion)}</td>
                    <td>
                      <span className={p.tipo_estampado && p.tipo_estampado !== 'Ninguno' ? 'badge-sea' : 'muted'}>
                        {p.tipo_estampado || 'Ninguno'}
                      </span>
                      {p.costo_estampado > 0 && (
                        <small style={{ display: 'block', color: 'var(--muted)', marginTop: '2px' }} className="tabular-nums">
                          {money.format(p.costo_estampado)}
                        </small>
                      )}
                    </td>
                    <td className="tabular-nums">
                      <strong>{money.format(p.costo_produccion)}</strong>
                    </td>
                    <td className="tabular-nums">
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
