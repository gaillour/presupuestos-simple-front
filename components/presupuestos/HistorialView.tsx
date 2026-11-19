'use client'

import React, { useMemo, useState } from 'react'
import { AlertCircle, Eye, FileDown, Plus, RefreshCw, Search } from 'lucide-react'
import type { Presupuesto, ViewId } from '@/lib/types'
import { money } from '@/lib/utils'
import { getPresupuestoPdfUrl } from '@/lib/api/client'
import { Metric } from '@/components/ui/Metric'

export interface HistorialViewProps {
  presupuestos: Presupuesto[]
  loading: boolean
  error: string | null
  token: string
  onReload: () => void
  onSelectPresupuesto: (p: Presupuesto) => void
  setView: (v: ViewId) => void
}

export function HistorialView({
  presupuestos,
  loading,
  error,
  token,
  onReload,
  onSelectPresupuesto,
  setView,
}: HistorialViewProps) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return presupuestos
    const q = search.toLowerCase()
    return presupuestos.filter((p) => p.cliente_referencia.toLowerCase().includes(q))
  }, [presupuestos, search])

  const totalCotizado = useMemo(() => {
    return presupuestos.reduce((acc, p) => acc + (p.precio_total || 0), 0)
  }, [presupuestos])

  const ticketPromedio = useMemo(() => {
    if (presupuestos.length === 0) return 0
    return totalCotizado / presupuestos.length
  }, [presupuestos, totalCotizado])

  return (
    <div className="module-page">
      <div className="welcome">
        <div>
          <h1>Historial de Presupuestos</h1>
          <p className="muted">
            Registro de cotizaciones entregadas, recotización y descarga de comprobantes en PDF.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="secondary" onClick={onReload} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Actualizando...' : 'Actualizar'}
          </button>
          <button className="primary" onClick={() => setView('nuevo')}>
            <Plus size={15} /> Nueva Cotización
          </button>
        </div>
      </div>

      <div className="metrics">
        <Metric
          label="Presupuestos Totales"
          value={`${presupuestos.length} emitidos`}
          note="Historial general"
        />
        <Metric
          label="Total Cotizado"
          value={money.format(totalCotizado)}
          note="Monto acumulado"
        />
        <Metric
          label="Ticket Promedio"
          value={money.format(ticketPromedio)}
          note="Por cotización emitida"
        />
      </div>

      {error && (
        <div className="alert alert-error" style={{ margin: '0 0 20px', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={18} />
            <div>
              <strong>No se pudo cargar el historial</strong>
              <small style={{ display: 'block', marginTop: '2px' }}>
                Ocurrió un error al consultar las cotizaciones.
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
          <h2>Cotizaciones Emitidas</h2>
          <div className="search" style={{ minWidth: '220px' }}>
            <Search size={15} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente..."
            />
          </div>
        </div>

        {loading && presupuestos.length === 0 ? (
          <div className="empty-state">
            <RefreshCw size={22} className="animate-spin" style={{ margin: '0 auto 12px' }} />
            <p>Cargando presupuestos...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <p>
              {search
                ? 'No se encontraron presupuestos para el cliente buscado.'
                : 'No hay presupuestos registrados.'}
            </p>
            <small>Los presupuestos creados aparecerán listados aquí.</small>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th># ID</th>
                  <th>Cliente / Referencia</th>
                  <th>Fecha de Emisión</th>
                  <th>Multiplicador</th>
                  <th>Costo Fijo</th>
                  <th>Total</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((q) => (
                  <tr key={q.id}>
                    <td className="id">#{q.id}</td>
                    <td>
                      <strong>{q.cliente_referencia}</strong>
                    </td>
                    <td>{new Date(q.created_at).toLocaleDateString('es-AR')}</td>
                    <td className="tabular-nums">{Number(q.multiplicador).toFixed(1)}x</td>
                    <td className="tabular-nums">{money.format(q.costo_fijo)}</td>
                    <td className="tabular-nums">
                      <strong className="green">{money.format(q.precio_total)}</strong>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="secondary btn-sm"
                          onClick={() => onSelectPresupuesto(q)}
                        >
                          <Eye size={13} /> Ver / Modificar
                        </button>
                        <a
                          href={getPresupuestoPdfUrl(q.id, token)}
                          target="_blank"
                          rel="noreferrer"
                          className="icon-btn"
                          title="Descargar PDF"
                        >
                          <FileDown size={15} />
                        </a>
                      </div>
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
