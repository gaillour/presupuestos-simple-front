'use client'

import React, { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, RotateCcw, Store, Globe } from 'lucide-react'
import type { TiendaSale, TiendaSalesSummary } from '@/lib/types'
import { money } from '@/lib/utils'
import { Metric } from '@/components/ui/Metric'

export interface VentasTiendaTabProps {
  ventas: TiendaSale[]
  resumen: TiendaSalesSummary
  onAnular: (saleId: number) => Promise<void>
}

const MEDIO_LABELS: Record<string, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  tarjeta: 'Tarjeta',
  online: 'Tiendanube',
}

export function VentasTiendaTab({ ventas, resumen, onAnular }: VentasTiendaTabProps) {
  const [canalFilter, setCanalFilter] = useState<'todas' | 'local' | 'web'>('todas')
  const [desde, setDesde] = useState<string>('')
  const [hasta, setHasta] = useState<string>('')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [anulandoId, setAnulandoId] = useState<number | null>(null)

  const filtered = useMemo(() => {
    return ventas.filter((v) => {
      if (canalFilter !== 'todas' && v.canal !== canalFilter) return false
      const day = v.created_at.slice(0, 10)
      if (desde && day < desde) return false
      if (hasta && day > hasta) return false
      return true
    })
  }, [ventas, canalFilter, desde, hasta])

  const resumenFiltrado = useMemo(() => {
    let total = 0
    let local = 0
    let web = 0
    let count = 0
    for (const v of filtered) {
      if (v.estado !== 'completada') continue
      count++
      total += v.total
      if (v.canal === 'local') local += v.total
      else web += v.total
    }
    return { count, total, local, web }
  }, [filtered])

  const handleAnular = async (saleId: number) => {
    if (!window.confirm('¿Anular esta venta? El stock volverá a sumarse en la app y en Tiendanube.')) {
      return
    }
    setAnulandoId(saleId)
    try {
      await onAnular(saleId)
    } finally {
      setAnulandoId(null)
    }
  }

  return (
    <div style={{ display: 'grid', gap: '16px' }}>
      <div className="metrics">
        <Metric label="Total Vendido" value={money.format(resumenFiltrado.total)} note={`${resumenFiltrado.count} ventas activas`} />
        <Metric label="Ventas Local" value={money.format(resumenFiltrado.local)} note="Showroom / presencial" />
        <Metric label="Ventas Tiendanube" value={money.format(resumenFiltrado.web)} note="Web sincronizadas" />
        <Metric
          label="Por Medio de Pago"
          value={
            Object.entries(resumen.por_medio_pago)
              .map(([k, v]) => `${MEDIO_LABELS[k] || k}: ${money.format(v)}`)
              .join(' · ') || '—'
          }
          note="Totales históricos cargados"
        />
      </div>

      <div className="card">
        <div className="tienda-filter-bar" style={{ paddingTop: '14px' }}>
          <div className="filter-pills">
            <button
              type="button"
              className={canalFilter === 'todas' ? 'pill-btn active' : 'pill-btn'}
              onClick={() => setCanalFilter('todas')}
            >
              Todas ({ventas.length})
            </button>
            <button
              type="button"
              className={canalFilter === 'local' ? 'pill-btn active' : 'pill-btn'}
              onClick={() => setCanalFilter('local')}
            >
              Local
            </button>
            <button
              type="button"
              className={canalFilter === 'web' ? 'pill-btn active' : 'pill-btn'}
              onClick={() => setCanalFilter('web')}
            >
              Tiendanube
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: 'auto', flexWrap: 'wrap' }}>
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              style={{ fontSize: '12px', padding: '5px 8px' }}
              aria-label="Desde"
            />
            <span className="muted" style={{ fontSize: '12px' }}>a</span>
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              style={{ fontSize: '12px', padding: '5px 8px' }}
              aria-label="Hasta"
            />
            {(desde || hasta) && (
              <button type="button" className="secondary btn-sm" onClick={() => { setDesde(''); setHasta('') }}>
                Limpiar
              </button>
            )}
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th></th>
                <th>Fecha</th>
                <th>Canal</th>
                <th>Prendas</th>
                <th>Medio de Pago</th>
                <th className="num">Total</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty">
                    Todavía no hay ventas registradas con estos filtros.
                  </td>
                </tr>
              ) : (
                filtered.map((sale) => {
                  const isOpen = expandedId === sale.id
                  const totalUnits = sale.items.reduce((a, it) => a + it.cantidad, 0)
                  const isAnulada = sale.estado === 'anulada'
                  return (
                    <React.Fragment key={sale.id}>
                      <tr style={isAnulada ? { opacity: 0.6 } : undefined}>
                        <td style={{ width: '28px' }}>
                          <button
                            type="button"
                            className="icon-btn"
                            onClick={() => setExpandedId(isOpen ? null : sale.id)}
                            aria-label="Ver detalle"
                          >
                            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </button>
                        </td>
                        <td className="muted" style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                          {new Date(sale.created_at).toLocaleString('es-AR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td>
                          {sale.canal === 'local' ? (
                            <span className="badge-sand" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Store size={11} /> Local #{sale.id}
                            </span>
                          ) : (
                            <span className="badge-sea" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Globe size={11} /> Web #{sale.tiendanube_order_number || sale.tiendanube_order_id}
                            </span>
                          )}
                        </td>
                        <td>
                          {totalUnits} {totalUnits === 1 ? 'prenda' : 'prendas'}
                          {sale.items[0] && (
                            <span className="muted" style={{ fontSize: '12px', marginLeft: '6px' }}>
                              ({sale.items[0].producto_nombre}{sale.items.length > 1 ? ` +${sale.items.length - 1}` : ''})
                            </span>
                          )}
                        </td>
                        <td>{sale.medio_pago ? MEDIO_LABELS[sale.medio_pago] || sale.medio_pago : '—'}</td>
                        <td className="num tabular-nums">
                          <strong>{money.format(sale.total)}</strong>
                          {sale.descuento_valor > 0 && (
                            <div className="muted" style={{ fontSize: '11px' }}>
                              Desc. {sale.descuento_tipo === 'porcentaje' ? `${sale.descuento_valor}%` : money.format(sale.descuento_valor)}
                            </div>
                          )}
                        </td>
                        <td>
                          {isAnulada ? (
                            <span className="badge-danger">Anulada</span>
                          ) : (
                            <span className="badge-sea">Completada</span>
                          )}
                        </td>
                        <td className="num">
                          {!isAnulada && (
                            <button
                              type="button"
                              className="secondary btn-sm"
                              disabled={anulandoId === sale.id}
                              onClick={() => void handleAnular(sale.id)}
                            >
                              <RotateCcw size={12} /> {anulandoId === sale.id ? '...' : 'Anular'}
                            </button>
                          )}
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="venta-detail-row">
                          <td colSpan={8}>
                            <div style={{ padding: '6px 12px', display: 'grid', gap: '4px' }}>
                              {sale.items.map((it) => (
                                <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                  <span>
                                    <strong>{it.cantidad}×</strong> {it.producto_nombre} <span className="badge-sand">{it.talle}</span>
                                  </span>
                                  <span className="tabular-nums">{money.format(it.precio_unitario * it.cantidad)}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
