'use client'

import React, { useMemo, useState } from 'react'
import { AlertCircle, Pencil, Plus, RefreshCw, Search } from 'lucide-react'
import type { Tela } from '@/lib/types'
import { money } from '@/lib/utils'
import { Metric } from '@/components/dashboard/DashboardView'

export interface TelasViewProps {
  telas: Tela[]
  loading: boolean
  error: string | null
  onReload: () => void
  onEditTela: (tela: Tela) => void
  onNewTela: () => void
  setView: (v: string) => void
}

export function TelasView({
  telas,
  loading,
  error,
  onReload,
  onEditTela,
  onNewTela,
}: TelasViewProps) {
  const [search, setSearch] = useState('')

  const filteredTelas = useMemo(() => {
    if (!search.trim()) return telas
    const q = search.toLowerCase()
    return telas.filter(
      (t) =>
        t.nombre?.toLowerCase().includes(q) ||
        (t.descripcion && t.descripcion.toLowerCase().includes(q))
    )
  }, [telas, search])

  const precioPromedioKilo = useMemo(() => {
    if (telas.length === 0) return 0
    const sum = telas.reduce((acc, t) => acc + (Number(t.precio_kilo) || 0), 0)
    return sum / telas.length
  }, [telas])

  const rendimientoPromedio = useMemo(() => {
    if (telas.length === 0) return 0
    const sum = telas.reduce((acc, t) => acc + (Number(t.rendimiento) || 0), 0)
    return sum / telas.length
  }, [telas])

  return (
    <div className="module-page">
      <div className="welcome">
        <div>
          <h1>Telas y Rendimientos</h1>
          <p className="muted">
            Costos por kilo, rendimiento métrico y cálculo del metro lineal para corte.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="secondary" onClick={onReload} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Actualizando...' : 'Actualizar'}
          </button>
          <button className="primary" onClick={onNewTela}>
            <Plus size={15} /> Nueva Tela
          </button>
        </div>
      </div>

      <div className="metrics">
        <Metric
          label="Telas en catálogo"
          value={`${telas.length} telas`}
          note="Insumos activos"
        />
        <Metric
          label="Precio Promedio / Kg"
          value={money.format(precioPromedioKilo)}
          note="Costo textil base"
        />
        <Metric
          label="Rendimiento Promedio"
          value={rendimientoPromedio > 0 ? `${rendimientoPromedio.toFixed(2)} m/kg` : '-'}
          note="Metros lineales por kilo"
        />
      </div>

      {error && (
        <div className="alert alert-error" style={{ margin: '0 0 20px', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={18} />
            <div>
              <strong>No se pudieron cargar las telas</strong>
              <small style={{ display: 'block', marginTop: '2px' }}>
                Ocurrió un inconveniente al comunicarse con el servidor.
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
          <h2>Catálogo de Telas</h2>
          <div className="search" style={{ minWidth: '220px' }}>
            <Search size={15} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar tela..."
            />
          </div>
        </div>

        {loading && telas.length === 0 ? (
          <div className="empty-state">
            <RefreshCw size={22} className="animate-spin" style={{ margin: '0 auto 12px' }} />
            <p>Cargando telas...</p>
          </div>
        ) : filteredTelas.length === 0 ? (
          <div className="empty-state">
            <p>
              {search
                ? 'No se encontraron telas para la búsqueda ingresada.'
                : 'No hay telas registradas en el catálogo.'}
            </p>
            <small>Hacé clic en &quot;Nueva Tela&quot; para agregar insumos al catálogo.</small>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th># ID</th>
                  <th>Nombre de la Tela</th>
                  <th>Descripción / Composición</th>
                  <th>Rendimiento</th>
                  <th>Precio / Kilo</th>
                  <th>Precio / Metro</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {filteredTelas.map((tela) => {
                  const precioMetro =
                    tela.precio_metro ||
                    (tela.rendimiento > 0 ? tela.precio_kilo / tela.rendimiento : 0)

                  return (
                    <tr key={tela.id}>
                      <td className="id">#{tela.id}</td>
                      <td>
                        <strong>{tela.nombre}</strong>
                      </td>
                      <td>
                        <span className="muted">{tela.descripcion || 'Sin descripción'}</span>
                      </td>
                      <td className="tabular-nums">
                        <strong>
                          {tela.rendimiento ? `${Number(tela.rendimiento).toFixed(2)} m/kg` : '-'}
                        </strong>
                      </td>
                      <td className="tabular-nums">
                        <strong>{money.format(tela.precio_kilo)}</strong>
                      </td>
                      <td className="tabular-nums">
                        <strong className="green">{money.format(precioMetro)}</strong>
                      </td>
                      <td>
                        <button
                          className="secondary btn-sm"
                          onClick={() => onEditTela(tela)}
                          title="Editar tela"
                        >
                          <Pencil size={13} /> Editar
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
