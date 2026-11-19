'use client'

import React, { useMemo } from 'react'
import { ChevronRight, Eye, Plus, RefreshCw } from 'lucide-react'
import type { Producto, Presupuesto, Tela, Configuracion, ViewId } from '@/lib/types'
import { money } from '@/lib/utils'
import { Metric, type MetricProps } from '@/components/ui/Metric'
import { CalculatorWidget, type CalculatorWidgetProps } from './CalculatorWidget'
import { TarifasEstampaCard, type TarifasEstampaCardProps } from './TarifasEstampaCard'

export { Metric, type MetricProps }
export { CalculatorWidget, type CalculatorWidgetProps }
export { TarifasEstampaCard, type TarifasEstampaCardProps }

export interface DashboardViewProps {
  setView: (v: ViewId) => void
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

          <TarifasEstampaCard
            config={config}
            loadingConfig={loadingConfig}
            onEditConfig={() => setView('config')}
          />
        </div>
      </div>
    </>
  )
}
