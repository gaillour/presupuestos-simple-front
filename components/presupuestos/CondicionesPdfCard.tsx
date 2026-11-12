'use client'

import React, { useState } from 'react'
import { ChevronDown, RefreshCw } from 'lucide-react'

interface CondicionesPdfCardProps {
  descripcionPdf: string
  onChange: (value: string) => void
  textoBase: string
  onRestablecer: () => void
}

export function CondicionesPdfCard({
  descripcionPdf,
  onChange,
  textoBase,
  onRestablecer,
}: CondicionesPdfCardProps) {
  const [expandido, setExpandido] = useState(false)

  return (
    <section className="card">
      <div
        className="section-heading"
        style={{ cursor: 'pointer', userSelect: 'none' }}
        onClick={() => setExpandido(!expandido)}
      >
        <div>
          <p className="eyebrow">COMPROBANTE PDF</p>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            Condiciones del Presupuesto
            <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--muted)' }}>
              ({expandido ? 'Ocultar' : 'Personalizar pie del PDF'})
            </span>
          </h2>
        </div>
        <button
          type="button"
          className="icon-btn"
          onClick={(e) => {
            e.stopPropagation()
            setExpandido(!expandido)
          }}
          title={expandido ? 'Colapsar' : 'Expandir'}
        >
          <ChevronDown
            size={18}
            style={{
              transform: expandido ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          />
        </button>
      </div>

      {expandido && (
        <div style={{ padding: '0 20px 20px', display: 'grid', gap: '10px' }}>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)' }}>
            Texto u observaciones legales que saldrán al pie del PDF para este cliente. Por defecto toma el configurado en Ajustes Generales.
          </p>
          <textarea
            rows={4}
            value={descripcionPdf}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Ej: Presupuesto válido por 15 días corridos. Seña del 50% para iniciar producción..."
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid var(--line)',
              background: 'var(--surface-2)',
              color: 'var(--text)',
              fontFamily: 'inherit',
              fontSize: '13px',
              resize: 'vertical',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              type="button"
              className="secondary btn-sm"
              onClick={onRestablecer}
              title="Restaurar al texto base configurado en el sistema"
            >
              <RefreshCw size={13} style={{ marginRight: '6px' }} />
              Restablecer texto base
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
