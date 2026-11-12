'use client'

import React, { useState } from 'react'
import { FileDown, Pencil, Trash2, X } from 'lucide-react'
import type { Presupuesto } from '@/lib/types'
import { API_BASE, money } from '@/lib/utils'

export interface ModalDetallePresupuestoProps {
  presupuesto: Presupuesto
  token: string
  onRecotizar: (p: Presupuesto) => void
  onDelete: (id: number) => Promise<void>
  onClose: () => void
}

export function ModalDetallePresupuesto({
  presupuesto,
  token,
  onRecotizar,
  onDelete,
  onClose,
}: ModalDetallePresupuestoProps) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`¿Estás seguro de eliminar el presupuesto #${presupuesto.id} de "${presupuesto.cliente_referencia}"?`)) return
    setDeleting(true)
    try {
      await onDelete(presupuesto.id)
      onClose()
    } catch {
      setDeleting(false)
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose}>
          <X size={18} />
        </button>
        <p className="eyebrow">PRESUPUESTO #{presupuesto.id}</p>
        <h2>{presupuesto.cliente_referencia}</h2>
        <p className="muted">
          Emitido el {new Date(presupuesto.created_at).toLocaleDateString('es-AR')}
        </p>

        <div className="modal-total">
          <span>Total Final</span>
          <strong className="tabular-nums">{money.format(presupuesto.precio_total)}</strong>
        </div>

        <div className="detail-line">
          <span>Multiplicador</span>
          <strong className="tabular-nums">{Number(presupuesto.multiplicador).toFixed(1)}x</strong>
        </div>

        <div className="detail-line">
          <span>Costo Fijo por Prenda</span>
          <strong className="tabular-nums">{money.format(presupuesto.costo_fijo)}</strong>
        </div>

        <div style={{ display: 'grid', gap: '8px', marginTop: '20px' }}>
          <button
            type="button"
            className="primary full"
            onClick={() => {
              onRecotizar(presupuesto)
              onClose()
            }}
          >
            <Pencil size={15} /> Modificar y Recotizar
          </button>

          <a
            href={`${API_BASE}/api/presupuestos/${presupuesto.id}/pdf${token ? `?token=${encodeURIComponent(token)}` : ''}`}
            target="_blank"
            rel="noreferrer"
            className="secondary full"
            style={{ textDecoration: 'none' }}
          >
            <FileDown size={15} /> Descargar PDF Oficial
          </a>

          <button
            type="button"
            className="danger-btn full"
            onClick={handleDelete}
            disabled={deleting}
          >
            <Trash2 size={15} /> {deleting ? 'Eliminando...' : 'Eliminar Cotización'}
          </button>
        </div>
      </div>
    </div>
  )
}
