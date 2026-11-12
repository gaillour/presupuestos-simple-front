'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  ChevronRight,
  Eye,
  Pencil,
  Plus,
  RefreshCw,
} from 'lucide-react'
import type { Producto, Presupuesto, Tela, Configuracion } from '@/lib/types'
import { money } from '@/lib/utils'
import { SmartNumberInput } from '@/components/ui/SmartNumberInput'

export interface MetricProps {
  label: string
  value: string
  note: string
  loading?: boolean
}

export function Metric({
  label,
  value,
  note,
  loading = false,
}: MetricProps) {
  return (
    <div className="metric">
      <p>{label}</p>
      {loading ? (
        <>
          <div className="skeleton-box skeleton-metric-value" />
          <div className="skeleton-box skeleton-metric-note" />
        </>
      ) : (
        <>
          <strong className="tabular-nums">{value}</strong>
          <small>{note}</small>
        </>
      )}
    </div>
  )
}

export interface CalculatorWidgetProps {
  productos: Producto[]
  setView: (v: string) => void
  loading?: boolean
}

export function CalculatorWidget({
  productos,
  setView,
  loading = false,
}: CalculatorWidgetProps) {
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

export interface DashboardViewProps {
  setView: (v: string) => void
  telas: Tela[]
  productos: Producto[]
  presupuestos: Presupuesto[]
  config: Configuracion | null
  displayName: string
  onSelectPresupuesto: (p: Presupuesto) => void
  loadingTelas?: boolean
  loadingProductos?: boolean
  loadingPresupuestos?: boolean
  loadingConfig?: boolean
}

export function DashboardView({
  setView,
  telas,
  productos,
  presupuestos,
  config,
  onSelectPresupuesto,
  loadingTelas = false,
  loadingProductos = false,
  loadingPresupuestos = false,
  loadingConfig = false,
}: DashboardViewProps) {
  const totalCotizado = useMemo(() => {
    return presupuestos.reduce((acc, p) => acc + (p.precio_total || 0), 0)
  }, [presupuestos])

  return (
    <>
      <div className="welcome">
        <div>
          <h1>Resumen Operativo</h1>
          <p className="muted">Costos textiles, catálogo y cotizaciones recientes</p>
        </div>
        <button className="primary" onClick={() => setView('nuevo')}>
          <Plus size={16} /> Nueva cotización
        </button>
      </div>

      <div className="metrics">
        <Metric
          label="Telas registradas"
          value={`${telas.length} telas`}
          note="Insumos activos"
          loading={loadingTelas && telas.length === 0}
        />
        <Metric
          label="Prendas en catálogo"
          value={`${productos.length} modelos`}
          note="Fichas de corte"
          loading={loadingProductos && productos.length === 0}
        />
        <Metric
          label="Presupuestos emitidos"
          value={`${presupuestos.length} cotizaciones`}
          note="Historial emitido"
          loading={loadingPresupuestos && presupuestos.length === 0}
        />
        <Metric
          label="Total cotizado"
          value={money.format(totalCotizado)}
          note="Volumen acumulado"
          loading={loadingPresupuestos && presupuestos.length === 0}
        />
      </div>

      <div className="content-grid">
        <div className="main-column">
          <section className="card">
            <div className="section-heading">
              <h2>Últimas cotizaciones</h2>
              <button className="link" onClick={() => setView('historial')}>
                Ver todo <ChevronRight size={14} />
              </button>
            </div>

            {loadingPresupuestos && presupuestos.length === 0 ? (
              <div className="card-loading-center">
                <RefreshCw size={20} className="animate-spin" />
                <p style={{ margin: 0 }}>Cargando cotizaciones...</p>
              </div>
            ) : presupuestos.length === 0 ? (
              <div className="empty-state">
                <p>Sin cotizaciones emitidas</p>
                <small>Las cotizaciones generadas aparecerán aquí.</small>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th># ID</th>
                      <th>Cliente</th>
                      <th>Fecha</th>
                      <th>Margen</th>
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
                        <td className="tabular-nums">{Number(q.multiplicador).toFixed(1)}x</td>
                        <td>
                          <strong className="tabular-nums">{money.format(q.precio_total)}</strong>
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
          <CalculatorWidget
            productos={productos}
            setView={setView}
            loading={loadingProductos && productos.length === 0}
          />

          <section className="card supplies">
            <div className="section-heading">
              <h2>Tarifas de Estampa</h2>
              <button className="icon-btn" onClick={() => setView('config')} title="Editar costos">
                <Pencil size={15} />
              </button>
            </div>

            {[
              ['DTF / metro', config?.precio_metro_dtf],
              ['Sublimación / metro', config?.precio_metro_sublimacion],
              ['Serigrafía / unidad', config?.precio_unidad_serigrafia],
              ['Bordado / unidad', config?.precio_unidad_bordado],
            ].map(([name, price]) => (
              <div className="supply" key={name as string}>
                <span className="dot" />
                <span>{name}</span>
                {config === null && loadingConfig ? (
                  <span className="skeleton-box skeleton-supply-price" />
                ) : (
                  <strong className="tabular-nums">{money.format(Number(price ?? 0))}</strong>
                )}
              </div>
            ))}
          </section>
        </div>
      </div>
    </>
  )
}
