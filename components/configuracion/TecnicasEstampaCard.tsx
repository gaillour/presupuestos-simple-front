'use client'

import React, { useState } from 'react'
import { Plus, Save, Trash2 } from 'lucide-react'
import type { TipoEstampado } from '@/lib/types'
import { TECNICAS_BASE_NOMBRES, normalizarTecnica } from '@/lib/pricing'
import { SmartNumberInput } from '@/components/ui/SmartNumberInput'

export interface TecnicasEstampaCardProps {
  tecnicas: TipoEstampado[]
  onUpdateCosto: (index: number, nuevoValor: number) => void
  onAddTecnica: (nombre: string, costo: number) => Promise<void>
  onDeleteTecnica: (item: TipoEstampado) => Promise<void>
  agregando: boolean
  saving: boolean
}

function describirEtiquetaTecnica(nombre: string): string {
  const norm = normalizarTecnica(nombre)
  if (norm === 'dtf') return 'DTF (precio por metro)'
  if (norm === 'sublimacion') return 'Sublimación (precio por metro)'
  if (norm === 'serigrafia') return 'Serigrafía (precio por prenda/bajada)'
  if (norm === 'bordado') return 'Bordado (precio unitario base)'
  return `${nombre} (costo por m o u.)`
}

export function TecnicasEstampaCard({
  tecnicas,
  onUpdateCosto,
  onAddTecnica,
  onDeleteTecnica,
  agregando,
  saving,
}: TecnicasEstampaCardProps): React.JSX.Element {
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoCosto, setNuevoCosto] = useState<number>(0)

  const handleAdd = async () => {
    const nombreLimpio = nuevoNombre.trim()
    if (!nombreLimpio) return
    try {
      await onAddTecnica(nombreLimpio, nuevoCosto)
      setNuevoNombre('')
      setNuevoCosto(0)
    } catch {
      // Error manejado en el componente padre
    }
  }

  return (
    <section className="card">
      <div className="section-heading">
        <h2>Técnicas de Estampa</h2>
      </div>

      <div className="card-body" style={{ display: 'grid', gap: '12px' }}>
        {tecnicas.map((t, idx) => {
          const esBase = TECNICAS_BASE_NOMBRES.includes(normalizarTecnica(t.nombre))
          return (
            <div
              key={t.id || `${t.nombre}-${idx}`}
              style={{
                display: 'grid',
                gridTemplateColumns: esBase ? '1fr' : '1fr auto',
                gap: '8px',
                alignItems: 'end',
              }}
            >
              <label>
                {describirEtiquetaTecnica(t.nombre)}
                <SmartNumberInput
                  step="any"
                  min="0"
                  value={t.costo}
                  onChangeValue={(val) => onUpdateCosto(idx, val)}
                />
              </label>
              {!esBase && (
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => onDeleteTecnica(t)}
                  title={`Eliminar técnica ${t.nombre}`}
                  style={{ height: '38px', width: '38px' }}
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          )
        })}

        <div
          style={{
            marginTop: '6px',
            paddingTop: '12px',
            borderTop: '1px solid var(--line)',
            display: 'grid',
            gap: '10px',
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)' }}>
            Agregar nueva técnica
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.9fr auto', gap: '8px', alignItems: 'end' }}>
            <label>
              Nombre
              <input
                type="text"
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                placeholder="Ej: Corte + Sublimado"
              />
            </label>
            <label>
              Costo ($)
              <SmartNumberInput
                step="any"
                min="0"
                value={nuevoCosto}
                onChangeValue={(val) => setNuevoCosto(val)}
              />
            </label>
            <button
              type="button"
              className="secondary"
              onClick={handleAdd}
              disabled={agregando || !nuevoNombre.trim()}
              style={{ height: '38px', padding: '0 12px' }}
            >
              <Plus size={15} /> {agregando ? '...' : 'Agregar'}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="primary full"
          disabled={saving}
          style={{ marginTop: '10px' }}
        >
          {saving ? 'Guardando...' : 'Guardar Configuración'}
          <Save size={16} />
        </button>
      </div>
    </section>
  )
}
