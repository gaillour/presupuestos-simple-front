import { useState, useCallback } from 'react'
import type {
  Tela,
  Producto,
  TelaMutationInput,
  ProductoMutationInput,
  EditableEntity,
  Configuracion,
  TipoEstampado,
} from '../lib/types'
import {
  construirProductoCalculado,
  recalcularCatalogoConConfig,
} from '../lib/pricing'
import { DEMO_TELAS, DEMO_PRODUCTOS } from '../lib/demo-data'
import { telasService, productosService } from '../lib/api/services'

export interface UseCatalogoDataParams {
  token: string
  isDemo: boolean
  config: Configuracion | null
  tiposEstampado: TipoEstampado[]
  onUnauthorized: (msg?: string) => void
}

export interface UseCatalogoDataReturn {
  telas: Tela[]
  loadingTelas: boolean
  errorTelas: string | null
  productos: Producto[]
  loadingProductos: boolean
  errorProductos: string | null
  fetchTelas: (customToken?: string) => Promise<void>
  fetchProductos: (customToken?: string) => Promise<void>
  saveTela: (data: TelaMutationInput, editingTela: EditableEntity<Tela>) => Promise<void>
  deleteTela: (id: number) => Promise<void>
  saveProducto: (data: ProductoMutationInput, editingProducto: EditableEntity<Producto>) => Promise<void>
  deleteProducto: (id: number) => Promise<void>
  syncDemoProductosWithConfig: (updatedConfig: Configuracion) => void
  resetCatalogo: () => void
  loadDemoCatalogo: () => void
}

export function useCatalogoData(params: UseCatalogoDataParams): UseCatalogoDataReturn {
  const { token, isDemo, config, tiposEstampado, onUnauthorized } = params

  const [telas, setTelas] = useState<Tela[]>([])
  const [loadingTelas, setLoadingTelas] = useState<boolean>(false)
  const [errorTelas, setErrorTelas] = useState<string | null>(null)

  const [productos, setProductos] = useState<Producto[]>([])
  const [loadingProductos, setLoadingProductos] = useState<boolean>(false)
  const [errorProductos, setErrorProductos] = useState<string | null>(null)

  const fetchTelas = useCallback(
    async (customToken?: string) => {
      const active = customToken !== undefined ? customToken : token
      if (!active || (isDemo && !customToken)) return
      setLoadingTelas(true)
      setErrorTelas(null)
      try {
        const data = await telasService.list(active, () =>
          onUnauthorized('Tu sesión expiró. Por favor, iniciá sesión nuevamente.')
        )
        setTelas(Array.isArray(data) ? data : [])
      } catch (err: any) {
        setErrorTelas(err.message || 'Error de conexión')
      } finally {
        setLoadingTelas(false)
      }
    },
    [token, isDemo, onUnauthorized]
  )

  const fetchProductos = useCallback(
    async (customToken?: string) => {
      const active = customToken !== undefined ? customToken : token
      if (!active || (isDemo && !customToken)) return
      setLoadingProductos(true)
      setErrorProductos(null)
      try {
        const data = await productosService.list(active, () =>
          onUnauthorized('Tu sesión expiró. Por favor, iniciá sesión nuevamente.')
        )
        setProductos(Array.isArray(data) ? data : [])
      } catch (err: any) {
        setErrorProductos(err.message || 'Error de conexión')
      } finally {
        setLoadingProductos(false)
      }
    },
    [token, isDemo, onUnauthorized]
  )

  const saveTela = useCallback(
    async (data: TelaMutationInput, editingTela: EditableEntity<Tela>) => {
      if (isDemo) {
        const isEdit = editingTela && editingTela !== 'new'
        const precioMetro = data.rendimiento > 0 ? data.precio_kilo / data.rendimiento : 0
        if (isEdit) {
          setTelas((prev) =>
            prev.map((t) =>
              t.id === editingTela.id ? { ...t, ...data, precio_metro: precioMetro } : t
            )
          )
        } else {
          setTelas((prev) => {
            const nextId = prev.length > 0 ? Math.max(...prev.map((t) => t.id)) + 1 : 1
            return [...prev, { id: nextId, ...data, precio_metro: precioMetro }]
          })
        }
        return
      }

      const isEdit = editingTela && editingTela !== 'new'
      if (isEdit) {
        await telasService.update(
          editingTela.id,
          data,
          token,
          () => onUnauthorized('Tu sesión expiró. Por favor, iniciá sesión nuevamente.')
        )
      } else {
        await telasService.create(
          data,
          token,
          () => onUnauthorized('Tu sesión expiró. Por favor, iniciá sesión nuevamente.')
        )
      }

      await fetchTelas()
      await fetchProductos()
    },
    [isDemo, token, onUnauthorized, fetchTelas, fetchProductos]
  )

  const deleteTela = useCallback(
    async (id: number) => {
      if (isDemo) {
        setTelas((prev) => prev.filter((t) => t.id !== id))
        return
      }

      await telasService.remove(
        id,
        token,
        () => onUnauthorized('Tu sesión expiró. Por favor, iniciá sesión nuevamente.')
      )

      await fetchTelas()
      await fetchProductos()
    },
    [isDemo, token, onUnauthorized, fetchTelas, fetchProductos]
  )

  const saveProducto = useCallback(
    async (data: ProductoMutationInput, editingProducto: EditableEntity<Producto>) => {
      if (isDemo) {
        const isEdit = editingProducto && editingProducto !== 'new'
        if (isEdit) {
          const prod = construirProductoCalculado(
            editingProducto.id,
            data,
            telas,
            config,
            tiposEstampado
          )
          setProductos((prev) =>
            prev.map((p) => (p.id === editingProducto.id ? prod : p))
          )
        } else {
          setProductos((prev) => {
            const nextId = prev.length > 0 ? Math.max(...prev.map((p) => p.id)) + 1 : 1
            const prod = construirProductoCalculado(
              nextId,
              data,
              telas,
              config,
              tiposEstampado
            )
            return [...prev, prod]
          })
        }
        return
      }

      const isEdit = editingProducto && editingProducto !== 'new'
      if (isEdit) {
        await productosService.update(
          editingProducto.id,
          data,
          token,
          () => onUnauthorized('Tu sesión expiró. Por favor, iniciá sesión nuevamente.')
        )
      } else {
        await productosService.create(
          data,
          token,
          () => onUnauthorized('Tu sesión expiró. Por favor, iniciá sesión nuevamente.')
        )
      }

      await fetchProductos()
    },
    [isDemo, telas, config, tiposEstampado, token, onUnauthorized, fetchProductos]
  )

  const deleteProducto = useCallback(
    async (id: number) => {
      if (isDemo) {
        setProductos((prev) => prev.filter((p) => p.id !== id))
        return
      }

      await productosService.remove(
        id,
        token,
        () => onUnauthorized('Tu sesión expiró. Por favor, iniciá sesión nuevamente.')
      )

      await fetchProductos()
    },
    [isDemo, token, onUnauthorized, fetchProductos]
  )

  const syncDemoProductosWithConfig = useCallback(
    (updatedConfig: Configuracion) => {
      setProductos((prev) => recalcularCatalogoConConfig(prev, updatedConfig, tiposEstampado))
    },
    [tiposEstampado]
  )

  const resetCatalogo = useCallback(() => {
    setTelas([])
    setProductos([])
    setErrorTelas(null)
    setErrorProductos(null)
    setLoadingTelas(false)
    setLoadingProductos(false)
  }, [])

  const loadDemoCatalogo = useCallback(() => {
    setTelas(DEMO_TELAS)
    const initialProductos = config
      ? recalcularCatalogoConConfig(DEMO_PRODUCTOS, config, tiposEstampado)
      : DEMO_PRODUCTOS
    setProductos(initialProductos)
    setErrorTelas(null)
    setErrorProductos(null)
  }, [config, tiposEstampado])

  return {
    telas,
    loadingTelas,
    errorTelas,
    productos,
    loadingProductos,
    errorProductos,
    fetchTelas,
    fetchProductos,
    saveTela,
    deleteTela,
    saveProducto,
    deleteProducto,
    syncDemoProductosWithConfig,
    resetCatalogo,
    loadDemoCatalogo,
  }
}
