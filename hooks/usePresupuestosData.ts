import type React from 'react'
import { useState, useCallback } from 'react'
import type {
  Presupuesto,
  PresupuestoDraft,
  PresupuestoCreatePayload,
  Producto,
} from '@/lib/types'
import { DEMO_PRESUPUESTOS } from '@/lib/demo-data'
import { presupuestosService } from '@/lib/api/services'
import { calcularTotalPresupuestoItems } from '@/lib/pricing'

export interface UsePresupuestosDataParams {
  token: string
  isDemo: boolean
  productos: Producto[]
  onUnauthorized: (msg?: string) => void
}

export interface UsePresupuestosDataReturn {
  presupuestos: Presupuesto[]
  loadingPresupuestos: boolean
  errorPresupuestos: string | null
  presupuestoInitialData: PresupuestoDraft | null
  setPresupuestoInitialData: React.Dispatch<React.SetStateAction<PresupuestoDraft | null>>
  fetchPresupuestos: (customToken?: string) => Promise<void>
  createPresupuesto: (payload: PresupuestoCreatePayload) => Promise<void>
  deletePresupuesto: (id: number) => Promise<void>
  prepareRecotizacion: (p: Presupuesto) => Promise<PresupuestoDraft>
  resetPresupuestos: () => void
  loadDemoPresupuestos: () => void
}

export function usePresupuestosData(params: UsePresupuestosDataParams): UsePresupuestosDataReturn {
  const { token, isDemo, productos, onUnauthorized } = params

  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([])
  const [loadingPresupuestos, setLoadingPresupuestos] = useState<boolean>(false)
  const [errorPresupuestos, setErrorPresupuestos] = useState<string | null>(null)
  const [presupuestoInitialData, setPresupuestoInitialData] = useState<PresupuestoDraft | null>(null)

  const fetchPresupuestos = useCallback(
    async (customToken?: string) => {
      const active = customToken !== undefined ? customToken : token
      if (!active) return
      setLoadingPresupuestos(true)
      setErrorPresupuestos(null)
      try {
        const data = await presupuestosService.list(active, () =>
          onUnauthorized('Tu sesión expiró. Por favor, iniciá sesión nuevamente.')
        )
        setPresupuestos(Array.isArray(data) ? data : [])
      } catch (err: any) {
        setErrorPresupuestos(err.message || 'Error de conexión')
      } finally {
        setLoadingPresupuestos(false)
      }
    },
    [token, onUnauthorized]
  )

  const createPresupuesto = useCallback(
    async (payload: PresupuestoCreatePayload) => {
      if (isDemo) {
        const { totalPrecio } = calcularTotalPresupuestoItems(
          payload.items,
          productos,
          payload.multiplicador,
          payload.costo_fijo
        )
        setPresupuestos((prev) => {
          const nextId = prev.length > 0 ? Math.max(...prev.map((p) => p.id)) + 1 : 1
          const nuevo: Presupuesto = {
            id: nextId,
            cliente_referencia: payload.cliente,
            multiplicador: payload.multiplicador,
            costo_fijo: payload.costo_fijo,
            precio_total: totalPrecio,
            created_at: new Date().toISOString(),
            descripcion_pdf: payload.descripcion_pdf,
          }
          return [nuevo, ...prev]
        })
        setPresupuestoInitialData(null)
        return
      }

      await presupuestosService.create(payload, token, () =>
        onUnauthorized('Tu sesión expiró. Por favor, iniciá sesión nuevamente.')
      )
      await fetchPresupuestos()
      setPresupuestoInitialData(null)
    },
    [isDemo, productos, token, onUnauthorized, fetchPresupuestos]
  )

  const deletePresupuesto = useCallback(
    async (id: number) => {
      if (isDemo) {
        setPresupuestos((prev) => prev.filter((p) => p.id !== id))
        return
      }

      await presupuestosService.remove(id, token, () =>
        onUnauthorized('Tu sesión expiró. Por favor, iniciá sesión nuevamente.')
      )
      setPresupuestos((prev) => prev.filter((p) => p.id !== id))
    },
    [isDemo, token, onUnauthorized]
  )

  const prepareRecotizacion = useCallback(
    async (p: Presupuesto): Promise<PresupuestoDraft> => {
      if (isDemo) {
        const draft: PresupuestoDraft = {
          cliente: p.cliente_referencia,
          multiplicador: p.multiplicador,
          costoFijo: p.costo_fijo,
          descripcion_pdf: p.descripcion_pdf,
          items:
            productos.length > 0
              ? [{ producto_id: productos[0].id, cantidad: 10, detalle_estampado: '' }]
              : [],
        }
        setPresupuestoInitialData(draft)
        return draft
      }

      try {
        const data = await presupuestosService.getById(p.id, token, () =>
          onUnauthorized('Tu sesión expiró. Por favor, iniciá sesión nuevamente.')
        )
        const detalles = data.detalles || []
        const draft: PresupuestoDraft = {
          cliente: p.cliente_referencia,
          multiplicador: p.multiplicador,
          costoFijo: p.costo_fijo,
          descripcion_pdf: data.presupuesto?.descripcion_pdf ?? p.descripcion_pdf,
          items: detalles.map((d) => ({
            producto_id: d.producto_id,
            cantidad: d.cantidad,
            detalle_estampado: '',
          })),
        }
        setPresupuestoInitialData(draft)
        return draft
      } catch {
        const fallbackDraft: PresupuestoDraft = {
          cliente: p.cliente_referencia,
          multiplicador: p.multiplicador,
          costoFijo: p.costo_fijo,
          descripcion_pdf: p.descripcion_pdf,
          items: [],
        }
        setPresupuestoInitialData(fallbackDraft)
        return fallbackDraft
      }
    },
    [isDemo, productos, token, onUnauthorized]
  )

  const resetPresupuestos = useCallback(() => {
    setPresupuestos([])
    setPresupuestoInitialData(null)
    setErrorPresupuestos(null)
    setLoadingPresupuestos(false)
  }, [])

  const loadDemoPresupuestos = useCallback(() => {
    setPresupuestos(DEMO_PRESUPUESTOS)
    setPresupuestoInitialData(null)
    setErrorPresupuestos(null)
    setLoadingPresupuestos(false)
  }, [])

  return {
    presupuestos,
    loadingPresupuestos,
    errorPresupuestos,
    presupuestoInitialData,
    setPresupuestoInitialData,
    fetchPresupuestos,
    createPresupuesto,
    deletePresupuesto,
    prepareRecotizacion,
    resetPresupuestos,
    loadDemoPresupuestos,
  }
}
