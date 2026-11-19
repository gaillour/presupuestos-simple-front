import React from 'react'
import { Pencil } from 'lucide-react'
import type { Configuracion } from '@/lib/types'
import { money } from '@/lib/utils'

export interface TarifasEstampaCardProps {
  config: Configuracion | null
  loadingConfig?: boolean
  onEditConfig: () => void
}

export function TarifasEstampaCard({
  config,
  loadingConfig = false,
  onEditConfig,
}: TarifasEstampaCardProps): React.JSX.Element {
  return (
    <section className="card supplies">
      <div className="section-heading">
        <h2>Tarifas de Estampa</h2>
        <button className="icon-btn" onClick={onEditConfig} title="Editar costos">
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
  )
}
