'use client'

import React from 'react'
import { SmartNumberInput } from '@/components/ui/SmartNumberInput'

export interface ParametrosComercialesCardProps {
  costoFijo: number
  multiplicador: number
  descripcionPdf: string
  onChangeCostoFijo: (val: number) => void
  onChangeMultiplicador: (val: number) => void
  onChangeDescripcionPdf: (val: string) => void
}

export function ParametrosComercialesCard({
  costoFijo,
  multiplicador,
  descripcionPdf,
  onChangeCostoFijo,
  onChangeMultiplicador,
  onChangeDescripcionPdf,
}: ParametrosComercialesCardProps): React.JSX.Element {
  return (
    <>
      <section className="card">
        <div className="section-heading">
          <h2>Parámetros Comerciales</h2>
        </div>

        <div className="card-body form-grid-2">
          <label>
            Costo Fijo Base por Prenda ($)
            <SmartNumberInput
              step="any"
              min="0"
              value={costoFijo}
              onChangeValue={onChangeCostoFijo}
              required
            />
            <small style={{ color: 'var(--muted)', fontWeight: 400 }}>
              Monto aplicado a cada prenda para gastos fijos de taller.
            </small>
          </label>

          <label>
            Multiplicador Comercial por Defecto
            <SmartNumberInput
              step="0.1"
              min="1"
              value={multiplicador}
              onChangeValue={onChangeMultiplicador}
              required
            />
            <small style={{ color: 'var(--muted)', fontWeight: 400 }}>
              Margen aplicado sobre el costo base de confección y tela.
            </small>
          </label>
        </div>
      </section>

      <section className="card">
        <div className="section-heading">
          <h2>Condiciones del Presupuesto</h2>
        </div>

        <div className="card-body">
          <label>
            Texto al pie del Comprobante PDF
            <textarea
              rows={4}
              value={descripcionPdf}
              onChange={(e) => onChangeDescripcionPdf(e.target.value)}
            />
          </label>
        </div>
      </section>
    </>
  )
}
