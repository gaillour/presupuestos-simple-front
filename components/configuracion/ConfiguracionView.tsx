'use client'

import React, { useEffect, useState } from 'react'
import { AlertCircle, Check, ChevronLeft, Plus, Save, Trash2 } from 'lucide-react'
import type { Configuracion, TipoEstampado } from '@/lib/types'
import {
  TECNICAS_BASE_NOMBRES,
  normalizarTecnica,
  obtenerTecnicasEstampado,
  calcularCostoEstampadoDesdeConfig,
} from '@/lib/pricing'
import { SmartNumberInput } from '@/components/ui/SmartNumberInput'

export {
  TECNICAS_BASE_NOMBRES,
  normalizarTecnica,
  obtenerTecnicasEstampado,
  calcularCostoEstampadoDesdeConfig,
}

export function ConfiguracionView({
  config,
  tiposEstampado,
  token,
  isDemo,
  apiBase,
  onConfigActualizada,
  setView,
}: {
  config: Configuracion | null
  tiposEstampado?: TipoEstampado[]
  token: string
  isDemo?: boolean
  apiBase: string
  onConfigActualizada: (updatedConfig?: Configuracion) => void
  setView: (v: string) => void
}) {
  const [costoFijo, setCostoFijo] = useState(config?.costo_fijo ?? 6000)
  const [multiplicador, setMultiplicador] = useState(config?.multiplicador ?? 2.0)
  const [descripcionPdf, setDescripcionPdf] = useState(config?.descripcion_pdf ?? '')
  const [tecnicas, setTecnicas] = useState<TipoEstampado[]>(() =>
    obtenerTecnicasEstampado(config, tiposEstampado)
  )

  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoCosto, setNuevoCosto] = useState<number>(0)
  const [agregandoTecnica, setAgregandoTecnica] = useState(false)

  const [saving, setSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (config) {
      setCostoFijo(config.costo_fijo)
      setMultiplicador(config.multiplicador)
      setDescripcionPdf(config.descripcion_pdf ?? '')
    }
  }, [config])

  useEffect(() => {
    if (tiposEstampado && tiposEstampado.length > 0) {
      setTecnicas(tiposEstampado)
    } else if (config) {
      setTecnicas(obtenerTecnicasEstampado(config))
    }
  }, [tiposEstampado, config])

  const handleUpdateCostoTecnica = (idx: number, nuevoValor: number) => {
    setTecnicas((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, costo: nuevoValor } : item))
    )
  }

  const handleAgregarTecnica = async () => {
    const nombreLimpio = nuevoNombre.trim()
    if (!nombreLimpio) {
      setError('Ingresá el nombre de la nueva técnica de estampa (ej: Corte + Sublimado).')
      return
    }
    const claveNueva = normalizarTecnica(nombreLimpio)
    if (claveNueva === 'ninguno') {
      setError('El nombre "Ninguno" está reservado.')
      return
    }
    if (tecnicas.some((t) => normalizarTecnica(t.nombre) === claveNueva)) {
      setError(`La técnica "${nombreLimpio}" ya existe en la lista.`)
      return
    }

    setError('')
    setSavedSuccess(false)

    if (isDemo) {
      const nextId = tecnicas.reduce((acc, item) => Math.max(acc, item.id || 0), 0) + 1
      const nuevas = [...tecnicas, { id: nextId, nombre: nombreLimpio, costo: Number(nuevoCosto) }]
      setTecnicas(nuevas)
      setNuevoNombre('')
      setNuevoCosto(0)
      return
    }

    setAgregandoTecnica(true)
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(`${apiBase}/api/tipos-estampado`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          nombre: nombreLimpio,
          costo: Number(nuevoCosto),
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.detail || 'No se pudo agregar la técnica.')
      }

      const resData = await res.json().catch(() => null)
      if (resData?.tipos_estampado && Array.isArray(resData.tipos_estampado)) {
        setTecnicas(obtenerTecnicasEstampado(config, resData.tipos_estampado))
      } else if (resData?.tipo_estampado) {
        setTecnicas((prev) => [...prev, resData.tipo_estampado])
      }

      setNuevoNombre('')
      setNuevoCosto(0)
      setSavedSuccess(true)
      onConfigActualizada()
    } catch (err: any) {
      setError(err.message || 'Error al agregar la técnica de estampa.')
    } finally {
      setAgregandoTecnica(false)
    }
  }

  const handleEliminarTecnica = async (item: TipoEstampado) => {
    if (!confirm(`¿Eliminar la técnica "${item.nombre}"?`)) return
    setError('')
    setSavedSuccess(false)

    if (isDemo) {
      setTecnicas((prev) => prev.filter((t) => t.id !== item.id))
      return
    }

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(`${apiBase}/api/tipos-estampado/${item.id}`, {
        method: 'DELETE',
        headers,
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.detail || 'No se pudo eliminar la técnica.')
      }

      const resData = await res.json().catch(() => null)
      if (resData?.tipos_estampado && Array.isArray(resData.tipos_estampado)) {
        setTecnicas(obtenerTecnicasEstampado(config, resData.tipos_estampado))
      } else {
        setTecnicas((prev) => prev.filter((t) => t.id !== item.id))
      }
      onConfigActualizada()
    } catch (err: any) {
      setError(err.message || 'Error al eliminar la técnica.')
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSavedSuccess(false)
    setSaving(true)

    let listaFinal = [...tecnicas]
    const pendienteNombre = nuevoNombre.trim()
    if (pendienteNombre) {
      const clavePendiente = normalizarTecnica(pendienteNombre)
      if (
        clavePendiente !== 'ninguno' &&
        !listaFinal.some((t) => normalizarTecnica(t.nombre) === clavePendiente)
      ) {
        listaFinal.push({
          id: 0,
          nombre: pendienteNombre,
          costo: Number(nuevoCosto),
        })
      }
    }

    const buscarCostoBase = (clave: string, fallback: number) => {
      const item = listaFinal.find((t) => normalizarTecnica(t.nombre) === clave)
      return item ? Number(item.costo) : fallback
    }

    const precioDtf = buscarCostoBase('dtf', config?.precio_metro_dtf ?? 0)
    const precioSublimacion = buscarCostoBase('sublimacion', config?.precio_metro_sublimacion ?? 0)
    const precioSerigrafia = buscarCostoBase('serigrafia', config?.precio_unidad_serigrafia ?? 0)
    const precioBordado = buscarCostoBase('bordado', config?.precio_unidad_bordado ?? 0)

    if (isDemo) {
      const preciosMap: Record<string, number> = {}
      listaFinal.forEach((t, idx) => {
        if (!t.id) t.id = idx + 10
        preciosMap[normalizarTecnica(t.nombre)] = Number(t.costo)
      })
      const demoCfg: Configuracion = {
        costo_fijo: Number(costoFijo),
        multiplicador: Number(multiplicador),
        precio_metro_dtf: precioDtf,
        precio_metro_sublimacion: precioSublimacion,
        precio_unidad_serigrafia: precioSerigrafia,
        precio_unidad_bordado: precioBordado,
        descripcion_pdf: descripcionPdf,
        tipos_estampado: listaFinal,
        precios_estampado: preciosMap,
      }
      setTecnicas(listaFinal)
      setNuevoNombre('')
      setNuevoCosto(0)
      setSavedSuccess(true)
      setSaving(false)
      onConfigActualizada(demoCfg)
      return
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const res = await fetch(`${apiBase}/api/configuracion`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          costo_fijo: Number(costoFijo),
          multiplicador: Number(multiplicador),
          precio_dtf: precioDtf,
          precio_sublimacion: precioSublimacion,
          precio_serigrafia: precioSerigrafia,
          precio_bordado: precioBordado,
          descripcion_pdf: descripcionPdf,
          tipos_estampado: listaFinal.map((t) => ({
            id: t.id > 0 ? t.id : undefined,
            nombre: t.nombre,
            costo: Number(t.costo),
          })),
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.detail || 'No se pudo actualizar la configuración.')
      }

      setNuevoNombre('')
      setNuevoCosto(0)
      setSavedSuccess(true)
      onConfigActualizada()
    } catch (err: any) {
      setError(err.message || 'Error al guardar la configuración.')
    } finally {
      setSaving(false)
    }
  }

  const describirEtiquetaTecnica = (nombre: string) => {
    const norm = normalizarTecnica(nombre)
    if (norm === 'dtf') return 'DTF (precio por metro)'
    if (norm === 'sublimacion') return 'Sublimación (precio por metro)'
    if (norm === 'serigrafia') return 'Serigrafía (precio por prenda/bajada)'
    if (norm === 'bordado') return 'Bordado (precio unitario base)'
    return `${nombre} (costo por m o u.)`
  }

  return (
    <div className="module-page">
      <div className="welcome">
        <div>
          <h1>Configuración General</h1>
          <p className="muted">
            Costos fijos base, multiplicador comercial y precios de técnicas de estampado.
          </p>
        </div>
        <button className="primary" onClick={() => setView('dashboard')}>
          <ChevronLeft size={16} /> Volver al Dashboard
        </button>
      </div>

      {savedSuccess && (
        <div className="alert alert-success" style={{ margin: '0 0 20px' }}>
          <Check size={18} />
          <span>Configuración guardada correctamente y sincronizada en el sistema.</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error" style={{ margin: '0 0 20px' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave}>
        <div className="content-grid">
          <div className="main-column">
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
                    onChangeValue={(val) => setCostoFijo(val)}
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
                    onChangeValue={(val) => setMultiplicador(val)}
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
                    onChange={(e) => setDescripcionPdf(e.target.value)}
                  />
                </label>
              </div>
            </section>
          </div>

          <div className="right-column">
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
                          onChangeValue={(val) => handleUpdateCostoTecnica(idx, val)}
                        />
                      </label>
                      {!esBase && (
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => handleEliminarTecnica(t)}
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
                      onClick={handleAgregarTecnica}
                      disabled={agregandoTecnica || !nuevoNombre.trim()}
                      style={{ height: '38px', padding: '0 12px' }}
                    >
                      <Plus size={15} /> {agregandoTecnica ? '...' : 'Agregar'}
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
          </div>
        </div>
      </form>
    </div>
  )
}
