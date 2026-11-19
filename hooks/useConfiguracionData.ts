'use client'

import { useState, useCallback, useMemo } from 'react'
import type {
  Configuracion,
  ConfiguracionUpdatePayload,
  TipoEstampado,
} from '../lib/types'
import { obtenerTecnicasEstampado } from '../lib/pricing'
import { configuracionService } from '../lib/api/services'

export interface UseConfiguracionDataParams {
  token: string
  isDemo: boolean
  onUnauthorized: (msg?: string) => void
  onDemoConfigChange?: (updatedConfig: Configuracion) => void
  onRemoteConfigUpdated?: () => void
}

export interface UseConfiguracionDataReturn {
  config: Configuracion | null
  loadingConfig: boolean
  tiposEstampado: TipoEstampado[]
  tecnicasDisponibles: TipoEstampado[]
  loadingTiposEstampado: boolean
  fetchConfig: (customToken?: string) => Promise<void>
  fetchTiposEstampado: (customToken?: string) => Promise<void>
  saveConfiguracion: (payload: ConfiguracionUpdatePayload, demoConfig?: Configuracion) => Promise<void>
  addTipoEstampado: (nombre: string, costo: number) => Promise<TipoEstampado[]>
  removeTipoEstampado: (id: number) => Promise<TipoEstampado[]>
  loadDemoConfig: () => void
  resetConfig: () => void
}

export function useConfiguracionData(params: UseConfiguracionDataParams): UseConfiguracionDataReturn {
  const {
    token,
    isDemo,
    onUnauthorized,
    onDemoConfigChange,
    onRemoteConfigUpdated,
  } = params

  const [config, setConfig] = useState<Configuracion | null>(null)
  const [loadingConfig, setLoadingConfig] = useState<boolean>(false)

  const [tiposEstampado, setTiposEstampado] = useState<TipoEstampado[]>(() =>
    obtenerTecnicasEstampado(null)
  )
  const [loadingTiposEstampado, setLoadingTiposEstampado] = useState<boolean>(false)

  const tecnicasDisponibles = useMemo(
    () => (tiposEstampado.length > 0 ? tiposEstampado : obtenerTecnicasEstampado(config)),
    [tiposEstampado, config]
  )

  const fetchTiposEstampado = useCallback(
    async (customToken?: string) => {
      const active = customToken !== undefined ? customToken : token
      if (!active) return
      setLoadingTiposEstampado(true)
      try {
        const data = await configuracionService.listTiposEstampado(active, () =>
          onUnauthorized('Tu sesión expiró. Por favor, iniciá sesión nuevamente.')
        )
        if (Array.isArray(data)) {
          setTiposEstampado(obtenerTecnicasEstampado(null, data))
        }
      } catch {
        // Ignorar fallos de red / error manejado por onUnauthorized
      } finally {
        setLoadingTiposEstampado(false)
      }
    },
    [token, onUnauthorized]
  )

  const fetchConfig = useCallback(
    async (customToken?: string) => {
      const active = customToken !== undefined ? customToken : token
      if (!active) return
      setLoadingConfig(true)
      try {
        const data = await configuracionService.get(active, () =>
          onUnauthorized('Tu sesión expiró. Por favor, iniciá sesión nuevamente.')
        )
        setConfig(data)
        if (Array.isArray(data?.tipos_estampado) && data.tipos_estampado.length > 0) {
          setTiposEstampado(obtenerTecnicasEstampado(data, data.tipos_estampado))
        }
      } catch {
        // Ignorar fallos de red / error manejado por onUnauthorized
      } finally {
        setLoadingConfig(false)
      }
    },
    [token, onUnauthorized]
  )

  const saveConfiguracion = useCallback(
    async (payload: ConfiguracionUpdatePayload, demoConfig?: Configuracion) => {
      if (isDemo) {
        const updatedConfig: Configuracion = demoConfig ?? {
          costo_fijo: payload.costo_fijo,
          multiplicador: payload.multiplicador,
          precio_metro_dtf: payload.precio_dtf,
          precio_metro_sublimacion: payload.precio_sublimacion,
          precio_unidad_serigrafia: payload.precio_serigrafia,
          precio_unidad_bordado: payload.precio_bordado,
          descripcion_pdf: payload.descripcion_pdf,
          tipos_estampado: payload.tipos_estampado.map((t, idx) => ({
            id: t.id ?? idx + 1,
            nombre: t.nombre,
            costo: t.costo,
          })),
        }
        setConfig(updatedConfig)
        if (updatedConfig.tipos_estampado) {
          setTiposEstampado(
            obtenerTecnicasEstampado(updatedConfig, updatedConfig.tipos_estampado)
          )
        }
        onDemoConfigChange?.(updatedConfig)
        return
      }

      await configuracionService.update(payload, token, () =>
        onUnauthorized('Tu sesión expiró. Por favor, iniciá sesión nuevamente.')
      )
      await fetchConfig()
      await fetchTiposEstampado()
      onRemoteConfigUpdated?.()
    },
    [
      isDemo,
      token,
      onUnauthorized,
      fetchConfig,
      fetchTiposEstampado,
      onDemoConfigChange,
      onRemoteConfigUpdated,
    ]
  )

  const addTipoEstampado = useCallback(
    async (nombre: string, costo: number): Promise<TipoEstampado[]> => {
      if (isDemo) {
        const maxId = tiposEstampado.reduce((acc, t) => Math.max(acc, t.id || 0), 0)
        const nuevo: TipoEstampado = { id: maxId + 1, nombre, costo }
        const updated = [...tiposEstampado, nuevo]
        setTiposEstampado(updated)
        if (config) {
          const updatedConfig: Configuracion = {
            ...config,
            tipos_estampado: updated,
          }
          setConfig(updatedConfig)
          onDemoConfigChange?.(updatedConfig)
        }
        return updated
      }

      const res = await configuracionService.createTipoEstampado(
        { nombre, costo },
        token,
        () => onUnauthorized('Tu sesión expiró. Por favor, iniciá sesión nuevamente.')
      )
      let updatedList: TipoEstampado[]
      if (Array.isArray(res.tipos_estampado)) {
        updatedList = obtenerTecnicasEstampado(config, res.tipos_estampado)
      } else if (res.tipo_estampado) {
        updatedList = obtenerTecnicasEstampado(config, [...tiposEstampado, res.tipo_estampado])
      } else {
        await fetchTiposEstampado()
        updatedList = tiposEstampado
      }
      setTiposEstampado(updatedList)
      return updatedList
    },
    [isDemo, tiposEstampado, config, token, onUnauthorized, fetchTiposEstampado, onDemoConfigChange]
  )

  const removeTipoEstampado = useCallback(
    async (id: number): Promise<TipoEstampado[]> => {
      if (isDemo) {
        const updated = tiposEstampado.filter((t) => t.id !== id)
        setTiposEstampado(updated)
        if (config) {
          const updatedConfig: Configuracion = {
            ...config,
            tipos_estampado: updated,
          }
          setConfig(updatedConfig)
          onDemoConfigChange?.(updatedConfig)
        }
        return updated
      }

      const res = await configuracionService.deleteTipoEstampado(
        id,
        token,
        () => onUnauthorized('Tu sesión expiró. Por favor, iniciá sesión nuevamente.')
      )
      let updatedList: TipoEstampado[]
      if (Array.isArray(res.tipos_estampado)) {
        updatedList = obtenerTecnicasEstampado(config, res.tipos_estampado)
      } else {
        updatedList = tiposEstampado.filter((t) => t.id !== id)
      }
      setTiposEstampado(updatedList)
      return updatedList
    },
    [isDemo, tiposEstampado, config, token, onUnauthorized, onDemoConfigChange]
  )

  const loadDemoConfig = useCallback(() => {
    const demoConfig: Configuracion = {
      costo_fijo: 6000,
      multiplicador: 2.0,
      precio_metro_dtf: 10000,
      precio_metro_sublimacion: 2900,
      precio_unidad_serigrafia: 1500,
      precio_unidad_bordado: 2500,
      descripcion_pdf: 'Presupuesto de demostración textil.',
    }
    setConfig(demoConfig)
    setTiposEstampado(obtenerTecnicasEstampado(demoConfig))
  }, [])

  const resetConfig = useCallback(() => {
    setConfig(null)
    setTiposEstampado(obtenerTecnicasEstampado(null))
    setLoadingConfig(false)
    setLoadingTiposEstampado(false)
  }, [])

  return {
    config,
    loadingConfig,
    tiposEstampado,
    tecnicasDisponibles,
    loadingTiposEstampado,
    fetchConfig,
    fetchTiposEstampado,
    saveConfiguracion,
    addTipoEstampado,
    removeTipoEstampado,
    loadDemoConfig,
    resetConfig,
  }
}
