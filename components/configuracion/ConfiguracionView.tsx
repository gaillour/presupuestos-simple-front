'use client'

import React, { useEffect, useState } from 'react'
import { AlertCircle, Check, ChevronLeft } from 'lucide-react'
import type { Configuracion, TipoEstampado } from '@/lib/types'
import { normalizarTecnica, obtenerTecnicasEstampado } from '@/lib/pricing'
import { configuracionService } from '@/lib/api/services'
import { ParametrosComercialesCard } from './ParametrosComercialesCard'
import { TecnicasEstampaCard } from './TecnicasEstampaCard'

interface ConfiguracionViewProps {
  config: Configuracion | null; tiposEstampado?: TipoEstampado[]; token: string
  isDemo?: boolean; apiBase?: string; onConfigActualizada: (updatedConfig?: Configuracion) => void; setView: (v: string) => void
}

export function ConfiguracionView({
  config, tiposEstampado, token, isDemo, onConfigActualizada, setView,
}: ConfiguracionViewProps) {
  const [costoFijo, setCostoFijo] = useState(config?.costo_fijo ?? 6000)
  const [multiplicador, setMultiplicador] = useState(config?.multiplicador ?? 2.0)
  const [descripcionPdf, setDescripcionPdf] = useState(config?.descripcion_pdf ?? '')
  const [tecnicas, setTecnicas] = useState<TipoEstampado[]>(() => obtenerTecnicasEstampado(config, tiposEstampado))
  const [agregandoTecnica, setAgregandoTecnica] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!config) return
    setCostoFijo(config.costo_fijo)
    setMultiplicador(config.multiplicador)
    setDescripcionPdf(config.descripcion_pdf ?? '')
  }, [config])

  useEffect(() => {
    if (tiposEstampado?.length) setTecnicas(tiposEstampado)
    else if (config) setTecnicas(obtenerTecnicasEstampado(config))
  }, [tiposEstampado, config])

  const handleUpdateCostoTecnica = (idx: number, nuevoValor: number) =>
    setTecnicas((prev) => prev.map((item, i) => (i === idx ? { ...item, costo: nuevoValor } : item)))

  const handleAgregarTecnica = async (nombre: string, costo: number) => {
    const nombreLimpio = nombre.trim()
    const clave = normalizarTecnica(nombreLimpio)
    if (!nombreLimpio) {
      setError('Ingresá el nombre de la nueva técnica de estampa (ej: Corte + Sublimado).')
      throw new Error('Nombre inválido')
    }
    if (clave === 'ninguno') {
      setError('El nombre "Ninguno" está reservado.')
      throw new Error('Nombre reservado')
    }
    if (tecnicas.some((t) => normalizarTecnica(t.nombre) === clave)) {
      setError(`La técnica "${nombreLimpio}" ya existe en la lista.`)
      throw new Error('Técnica duplicada')
    }

    setError('')
    setSavedSuccess(false)
    if (isDemo) {
      const nextId = tecnicas.reduce((acc, item) => Math.max(acc, item.id || 0), 0) + 1
      setTecnicas([...tecnicas, { id: nextId, nombre: nombreLimpio, costo: Number(costo) }])
      return
    }

    setAgregandoTecnica(true)
    try {
      const res = await configuracionService.createTipoEstampado({ nombre: nombreLimpio, costo: Number(costo) }, token)
      if (res?.tipos_estampado && Array.isArray(res.tipos_estampado)) {
        setTecnicas(obtenerTecnicasEstampado(config, res.tipos_estampado))
      } else if (res?.tipo_estampado) {
        setTecnicas((prev) => [...prev, res.tipo_estampado!])
      }
      setSavedSuccess(true)
      onConfigActualizada()
    } catch (err: any) {
      setError(err.message || 'Error al agregar la técnica de estampa.')
      throw err
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
      const res = await configuracionService.deleteTipoEstampado(item.id, token)
      if (res?.tipos_estampado && Array.isArray(res.tipos_estampado)) {
        setTecnicas(obtenerTecnicasEstampado(config, res.tipos_estampado))
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

    const cBase = (c: string, fb: number) => Number(tecnicas.find((t) => normalizarTecnica(t.nombre) === c)?.costo ?? fb)
    const [precioDtf, precioSublimacion, precioSerigrafia, precioBordado] = [
      cBase('dtf', config?.precio_metro_dtf ?? 0),
      cBase('sublimacion', config?.precio_metro_sublimacion ?? 0),
      cBase('serigrafia', config?.precio_unidad_serigrafia ?? 0),
      cBase('bordado', config?.precio_unidad_bordado ?? 0),
    ]

    if (isDemo) {
      setSavedSuccess(true)
      setSaving(false)
      onConfigActualizada({
        costo_fijo: Number(costoFijo),
        multiplicador: Number(multiplicador),
        precio_metro_dtf: precioDtf,
        precio_metro_sublimacion: precioSublimacion,
        precio_unidad_serigrafia: precioSerigrafia,
        precio_unidad_bordado: precioBordado,
        descripcion_pdf: descripcionPdf,
        tipos_estampado: tecnicas.map((t, idx) => ({ ...t, id: t.id || idx + 10 })),
        precios_estampado: Object.fromEntries(tecnicas.map((t) => [normalizarTecnica(t.nombre), Number(t.costo)])),
      })
      return
    }

    try {
      await configuracionService.update({
        costo_fijo: Number(costoFijo),
        multiplicador: Number(multiplicador),
        precio_dtf: precioDtf,
        precio_sublimacion: precioSublimacion,
        precio_serigrafia: precioSerigrafia,
        precio_bordado: precioBordado,
        descripcion_pdf: descripcionPdf,
        tipos_estampado: tecnicas.map((t) => ({ id: t.id > 0 ? t.id : undefined, nombre: t.nombre, costo: Number(t.costo) })),
      }, token)
      setSavedSuccess(true)
      onConfigActualizada()
    } catch (err: any) {
      setError(err.message || 'Error al guardar la configuración.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="module-page">
      <div className="welcome">
        <div>
          <h1>Configuración General</h1>
          <p className="muted">Costos fijos base, multiplicador comercial y precios de técnicas de estampado.</p>
        </div>
        <button className="primary" onClick={() => setView('dashboard')}>
          <ChevronLeft size={16} /> Volver al Dashboard
        </button>
      </div>

      {savedSuccess && (
        <div className="alert alert-success" style={{ margin: '0 0 20px' }}>
          <Check size={18} /> <span>Configuración guardada correctamente y sincronizada en el sistema.</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error" style={{ margin: '0 0 20px' }}>
          <AlertCircle size={18} /> <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave}>
        <div className="content-grid">
          <div className="main-column">
            <ParametrosComercialesCard
              costoFijo={costoFijo}
              multiplicador={multiplicador}
              descripcionPdf={descripcionPdf}
              onChangeCostoFijo={setCostoFijo}
              onChangeMultiplicador={setMultiplicador}
              onChangeDescripcionPdf={setDescripcionPdf}
            />
          </div>
          <div className="right-column">
            <TecnicasEstampaCard
              tecnicas={tecnicas}
              onUpdateCosto={handleUpdateCostoTecnica}
              onAddTecnica={handleAgregarTecnica}
              onDeleteTecnica={handleEliminarTecnica}
              agregando={agregandoTecnica}
              saving={saving}
            />
          </div>
        </div>
      </form>
    </div>
  )
}
