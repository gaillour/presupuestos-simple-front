'use client'

import React, { useState } from 'react'
import { AlertCircle, Save, Trash2, X } from 'lucide-react'
import type { Tela } from '@/lib/types'
import { money } from '@/lib/utils'
import { SmartNumberInput } from '@/components/ui/SmartNumberInput'

export interface ModalTelaProps {
  tela?: Tela | null
  onSave: (data: {
    nombre: string
    precio_kilo: number
    rendimiento: number
    descripcion: string
  }) => Promise<void>
  onDelete?: (id: number) => Promise<void>
  onClose: () => void
}

export function ModalTela({ tela, onSave, onDelete, onClose }: ModalTelaProps) {
  const isEditing = !!tela
  const [nombre, setNombre] = useState(tela?.nombre ?? '')
  const [precioKilo, setPrecioKilo] = useState<number>(tela?.precio_kilo ?? 0)
  const [rendimiento, setRendimiento] = useState<number>(tela?.rendimiento ?? 1)
  const [descripcion, setDescripcion] = useState(tela?.descripcion ?? '')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const precioMetroEstimado = rendimiento > 0 ? precioKilo / rendimiento : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) {
      setError('El nombre de la tela es obligatorio.')
      return
    }
    if (rendimiento <= 0) {
      setError('El rendimiento debe ser mayor a 0 m/kg.')
      return
    }

    setSaving(true)
    setError('')
    try {
      await onSave({
        nombre: nombre.trim(),
        precio_kilo: Number(precioKilo),
        rendimiento: Number(rendimiento),
        descripcion: descripcion.trim(),
      })
      onClose()
    } catch (err: any) {
      setError(err.message || 'Error al guardar la tela.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!tela || !onDelete) return
    if (!confirm(`¿Estás seguro de eliminar "${tela.nombre}"?`)) return
    setDeleting(true)
    try {
      await onDelete(tela.id)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Error al eliminar la tela.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose}>
          <X size={18} />
        </button>
        <h2>{isEditing ? `Editar ${tela?.nombre}` : 'Registrar Tela'}</h2>
        <p className="muted" style={{ marginBottom: '18px' }}>
          Definí el precio por kilo y rendimiento en metros para el cálculo automático.
        </p>

        {error && (
          <div className="alert alert-error" style={{ margin: '0 0 16px' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px' }}>
          <label>
            Nombre de la Tela
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Rústico Invisible 24/1, Frisa Pesada..."
              required
            />
          </label>

          <label>
            Descripción / Composición (opcional)
            <input
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej: 100% Algodón Peinado, Tubular 90cm..."
            />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <label>
              Precio por Kilo ($)
              <SmartNumberInput
                step="any"
                min="0"
                value={precioKilo}
                onChangeValue={(val) => setPrecioKilo(val)}
                required
              />
            </label>

            <label>
              Rendimiento (m / kg)
              <SmartNumberInput
                step="0.05"
                min="0.05"
                value={rendimiento}
                onChangeValue={(val) => setRendimiento(val)}
                required
              />
            </label>
          </div>

          <div className="modal-total">
            <span>Costo Resultante por Metro Lineal</span>
            <strong className="tabular-nums">{money.format(precioMetroEstimado)} / m</strong>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            {isEditing && onDelete && (
              <button
                type="button"
                className="danger-btn"
                onClick={handleDelete}
                disabled={deleting || saving}
              >
                <Trash2 size={15} /> {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            )}
            <button
              type="submit"
              className="primary"
              style={{ flex: 1 }}
              disabled={saving || deleting}
            >
              <Save size={15} /> {saving ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Tela'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
