'use client'

import React, { useMemo, useState } from 'react'
import { AlertCircle, Save, Trash2, X } from 'lucide-react'
import type { Producto, Tela, TipoEstampado } from '@/lib/types'
import { calcularCostoTelaCombinada, normalizarTecnica } from '@/lib/pricing'
import { money } from '@/lib/utils'
import { SmartNumberInput } from '@/components/ui/SmartNumberInput'

export interface ModalProductoProps {
  producto?: Producto | null
  telas: Tela[]
  tiposEstampado: TipoEstampado[]
  onSave: (data: {
    nombre: string
    tela_id: number
    consumo_metros: number
    tela_secundaria_id: number | null
    consumo_metros_secundaria: number
    costo_confeccion: number
    tipo_estampado: string
    consumo_estampado: number
    nombre_avio: string
    costo_avio: number
  }) => Promise<void>
  onDelete?: (id: number) => Promise<void>
  onClose: () => void
}

export function ModalProducto({
  producto,
  telas,
  tiposEstampado,
  onSave,
  onDelete,
  onClose,
}: ModalProductoProps) {
  const isEditing = !!producto
  const [nombre, setNombre] = useState(producto?.nombre ?? '')
  const [telaId, setTelaId] = useState<number>(producto?.tela?.id ?? telas[0]?.id ?? 0)
  const [consumoMetros, setConsumoMetros] = useState<number>(producto?.consumo_metros ?? 1.2)
  const [telaSecundariaId, setTelaSecundariaId] = useState<number>(
    producto?.tela_secundaria?.id ?? 0
  )
  const [consumoMetrosSecundaria, setConsumoMetrosSecundaria] = useState<number>(
    producto?.consumo_metros_secundaria ?? 0
  )
  const [costoConfeccion, setCostoConfeccion] = useState<number>(producto?.costo_confeccion ?? 2500)
  const [tipoEstampado, setTipoEstampado] = useState<string>(producto?.tipo_estampado ?? 'Ninguno')
  const [consumoEstampado, setConsumoEstampado] = useState<number>(producto?.consumo_estampado ?? 0)
  const [nombreAvio, setNombreAvio] = useState(producto?.nombre_avio ?? '')
  const [costoAvio, setCostoAvio] = useState<number>(producto?.costo_avio ?? 0)

  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const selectedTela = useMemo(() => telas.find((t) => t.id === telaId), [telas, telaId])
  const selectedTelaSecundaria = useMemo(
    () => (telaSecundariaId > 0 ? telas.find((t) => t.id === telaSecundariaId) : undefined),
    [telas, telaSecundariaId]
  )

  const costoTelaEstimado = calcularCostoTelaCombinada(
    selectedTela,
    consumoMetros,
    telaSecundariaId > 0 ? selectedTelaSecundaria : null,
    telaSecundariaId > 0 ? consumoMetrosSecundaria : 0
  )
  const costoBaseEstimado = costoTelaEstimado + costoConfeccion + costoAvio

  const tecnicaActual = useMemo(() => {
    if (!tipoEstampado || tipoEstampado === 'Ninguno') return null
    const norm = normalizarTecnica(tipoEstampado)
    return tiposEstampado.find((t) => normalizarTecnica(t.nombre) === norm) || null
  }, [tipoEstampado, tiposEstampado])

  const esPorUnidad = useMemo(() => {
    const norm = normalizarTecnica(tipoEstampado)
    return norm === 'bordado' || norm === 'serigrafia'
  }, [tipoEstampado])

  const costoEstampadoEstimado = (tecnicaActual?.costo ?? 0) * consumoEstampado
  const costoTotalEstimado = costoBaseEstimado + costoEstampadoEstimado

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) {
      setError('El nombre de la prenda es obligatorio.')
      return
    }
    if (!telaId) {
      setError('Seleccioná una tela válida del catálogo.')
      return
    }

    const tieneSegunda = telaSecundariaId > 0 && consumoMetrosSecundaria > 0

    setSaving(true)
    setError('')
    try {
      await onSave({
        nombre: nombre.trim(),
        tela_id: Number(telaId),
        consumo_metros: Number(consumoMetros),
        tela_secundaria_id: tieneSegunda ? Number(telaSecundariaId) : null,
        consumo_metros_secundaria: tieneSegunda ? Number(consumoMetrosSecundaria) : 0,
        costo_confeccion: Number(costoConfeccion),
        tipo_estampado: tipoEstampado,
        consumo_estampado: Number(consumoEstampado),
        nombre_avio: nombreAvio.trim(),
        costo_avio: Number(costoAvio),
      })
      onClose()
    } catch (err: any) {
      setError(err.message || 'Error al guardar el producto.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!producto || !onDelete) return
    if (!confirm(`¿Estás seguro de eliminar "${producto.nombre}"?`)) return
    setDeleting(true)
    try {
      await onDelete(producto.id)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Error al eliminar el producto.')
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
        <h2>{isEditing ? `Editar ${producto?.nombre}` : 'Registrar Prenda'}</h2>
        <p className="muted" style={{ marginBottom: '18px' }}>
          Definí la tela asociada, metros requeridos y costos de taller.
        </p>

        {error && (
          <div className="alert alert-error" style={{ margin: '0 0 16px' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px' }}>
          <label>
            Nombre del Modelo
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Buzo Canguro Oversize, Remera Box Fit..."
              required
            />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.7fr', gap: '12px' }}>
            <label>
              Tela Principal
              <select value={telaId} onChange={(e) => setTelaId(Number(e.target.value))} required>
                {telas.map((t) => (
                  <option value={t.id} key={t.id}>
                    {t.nombre} ({money.format(t.precio_kilo)}/kg · {t.rendimiento} m/kg)
                  </option>
                ))}
              </select>
            </label>

            <label>
              Consumo Principal (m)
              <SmartNumberInput
                step="0.05"
                min="0.05"
                value={consumoMetros}
                onChangeValue={(val) => setConsumoMetros(val)}
                required
              />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.7fr', gap: '12px' }}>
            <label>
              Segunda Tela / Combinación (opcional)
              <select
                value={telaSecundariaId}
                onChange={(e) => {
                  const id = Number(e.target.value)
                  setTelaSecundariaId(id)
                  if (id === 0) {
                    setConsumoMetrosSecundaria(0)
                  } else if (consumoMetrosSecundaria <= 0) {
                    setConsumoMetrosSecundaria(0.2)
                  }
                }}
              >
                <option value={0}>Ninguna (solo una tela)</option>
                {telas.map((t) => (
                  <option value={t.id} key={t.id}>
                    {t.nombre} ({money.format(t.precio_kilo)}/kg · {t.rendimiento} m/kg)
                  </option>
                ))}
              </select>
            </label>

            <label>
              Consumo 2da Tela (m)
              <SmartNumberInput
                step="0.05"
                min="0"
                value={telaSecundariaId > 0 ? consumoMetrosSecundaria : 0}
                onChangeValue={(val) => setConsumoMetrosSecundaria(val)}
                disabled={telaSecundariaId === 0}
              />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
            <label>
              Costo Confección / Taller ($)
              <SmartNumberInput
                step="any"
                min="0"
                value={costoConfeccion}
                onChangeValue={(val) => setCostoConfeccion(val)}
                required
              />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <label>
              Técnica de Estampa
              <select value={tipoEstampado} onChange={(e) => setTipoEstampado(e.target.value)}>
                <option value="Ninguno">Ninguno</option>
                {tiposEstampado.map((t) => (
                  <option key={t.id || t.nombre} value={t.nombre}>
                    {t.nombre} ({money.format(t.costo)})
                  </option>
                ))}
                {tipoEstampado &&
                  tipoEstampado !== 'Ninguno' &&
                  !tiposEstampado.some(
                    (t) => normalizarTecnica(t.nombre) === normalizarTecnica(tipoEstampado)
                  ) && <option value={tipoEstampado}>{tipoEstampado}</option>}
              </select>
            </label>

            <label>
              {esPorUnidad ? 'Cantidad de bordados/estampas (u.)' : 'Metros de Estampa (m)'}
              <SmartNumberInput
                min="0"
                value={consumoEstampado}
                onChangeValue={(val) => setConsumoEstampado(val)}
                disabled={tipoEstampado === 'Ninguno'}
              />
              {tipoEstampado !== 'Ninguno' && (
                <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 400 }}>
                  Tarifa: {money.format(tecnicaActual?.costo ?? 0)} · Subtotal: <strong className="tabular-nums" style={{ color: 'var(--text)' }}>{money.format(costoEstampadoEstimado)}</strong>
                </span>
              )}
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '12px' }}>
            <label>
              Nombre del Avío (opcional)
              <input
                type="text"
                value={nombreAvio}
                onChange={(e) => setNombreAvio(e.target.value)}
                placeholder="Ej: Cordon + Ojalillos"
              />
            </label>

            <label>
              Costo Avío ($)
              <SmartNumberInput
                min="0"
                value={costoAvio}
                onChangeValue={(val) => setCostoAvio(val)}
              />
            </label>
          </div>

          <div className="modal-total">
            <span>Costo Total Estimado (Tela + Taller + Avíos + Estampa)</span>
            <strong className="tabular-nums">{money.format(costoTotalEstimado)}</strong>
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
              <Save size={15} /> {saving ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
