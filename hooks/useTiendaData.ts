import { useState, useCallback } from 'react'
import type {
  TiendaBulkPricePayload,
  TiendaBulkPriceResponse,
  TiendaCategory,
  TiendaImage,
  TiendaImportResult,
  TiendaMovimiento,
  TiendanubeStatus,
  TiendaProduct,
  TiendaProductCreatePayload,
  TiendaProductUpdatePayload,
  TiendaResumen,
  TiendaSale,
  TiendaSaleCreatePayload,
  TiendaSalesSummary,
  TiendaVariantPatchItem,
  TiendaVentaLocalPayload,
} from '@/lib/types'
import { tiendaService } from '@/lib/api/tienda'
import {
  buildTiendaResumen,
  calcularPrecioAjustado,
  calcularTotalVenta,
  fileToBase64,
  parseTiendanubeCsvClient,
  recomputeTiendaProduct,
} from '@/lib/tienda-utils'
import {
  DEMO_TIENDA_CATEGORIAS,
  DEMO_TIENDA_MOVIMIENTOS,
  DEMO_TIENDA_PRODUCTOS,
  DEMO_TIENDA_VENTAS,
} from '@/lib/demo-data'

export interface UseTiendaDataParams {
  token: string
  isDemo: boolean
  onUnauthorized: (msg?: string) => void
}

function summarizeDemoSales(ventas: TiendaSale[]): TiendaSalesSummary {
  let totalMonto = 0
  let totalLocal = 0
  let totalWeb = 0
  let cantidad = 0
  const porMedio: Record<string, number> = {}
  for (const s of ventas) {
    if (s.estado !== 'completada') continue
    cantidad++
    totalMonto += s.total
    if (s.canal === 'local') totalLocal += s.total
    else totalWeb += s.total
    const mp = s.medio_pago || 'online'
    porMedio[mp] = Math.round(((porMedio[mp] || 0) + s.total) * 100) / 100
  }
  return {
    cantidad_ventas: cantidad,
    total_monto: Math.round(totalMonto * 100) / 100,
    total_local: Math.round(totalLocal * 100) / 100,
    total_web: Math.round(totalWeb * 100) / 100,
    por_medio_pago: porMedio,
  }
}

export interface UseTiendaDataReturn {
  productos: TiendaProduct[]
  categorias: TiendaCategory[]
  resumen: TiendaResumen
  movimientos: TiendaMovimiento[]
  ventas: TiendaSale[]
  ventasResumen: TiendaSalesSummary
  tnStatus: TiendanubeStatus | null
  loading: boolean
  error: string | null
  umbralUltimas: number
  setUmbralUltimas: (umbral: number) => void
  fetchTienda: (customToken?: string, customUmbral?: number) => Promise<void>
  importCsv: (file: File) => Promise<TiendaImportResult>
  saveBatchUpdates: (updates: TiendaVariantPatchItem[]) => Promise<void>
  applyBulkPriceAdjustment: (payload: TiendaBulkPricePayload) => Promise<TiendaBulkPriceResponse>
  registrarVentaLocal: (payload: TiendaVentaLocalPayload) => Promise<void>
  createProduct: (payload: TiendaProductCreatePayload) => Promise<TiendaProduct>
  updateProduct: (productId: number, payload: TiendaProductUpdatePayload) => Promise<TiendaProduct>
  deleteProduct: (productId: number) => Promise<void>
  uploadPhoto: (productId: number, base64: string, filename: string, position?: number) => Promise<TiendaImage[]>
  deletePhoto: (productId: number, tnImageId: number) => Promise<TiendaImage[]>
  reorderPhotos: (productId: number, imageIds: number[]) => Promise<TiendaImage[]>
  createCategory: (nombre: string) => Promise<TiendaCategory>
  createSale: (payload: TiendaSaleCreatePayload) => Promise<TiendaSale>
  anularSale: (saleId: number) => Promise<void>
  pullFromTiendanube: () => Promise<{
    categorias: number
    productos: number
    variantes: number
    skus_generados: number
    productos_archivados?: number
    skus_push_fallidos?: number
  }>
  retryPendingSync: () => Promise<{ productos_creados: number; variantes_sincronizadas: number; fallidas: number }>
  connectTiendanube: () => Promise<void>
  loadDemoTienda: () => void
  resetTienda: () => void
}

const EMPTY_SALES_SUMMARY: TiendaSalesSummary = {
  cantidad_ventas: 0,
  total_monto: 0,
  total_local: 0,
  total_web: 0,
  por_medio_pago: {},
}

export function useTiendaData(params: UseTiendaDataParams): UseTiendaDataReturn {
  const { token, isDemo, onUnauthorized } = params

  const [umbralUltimas, setUmbralUltimasState] = useState<number>(2)
  const [productos, setProductos] = useState<TiendaProduct[]>([])
  const [categorias, setCategorias] = useState<TiendaCategory[]>([])
  const [resumen, setResumen] = useState<TiendaResumen>(() => buildTiendaResumen([], 2, false))
  const [movimientos, setMovimientos] = useState<TiendaMovimiento[]>([])
  const [ventas, setVentas] = useState<TiendaSale[]>([])
  const [ventasResumen, setVentasResumen] = useState<TiendaSalesSummary>(EMPTY_SALES_SUMMARY)
  const [tnStatus, setTnStatus] = useState<TiendanubeStatus | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const handleUnauth = useCallback(() => {
    onUnauthorized('Tu sesión expiró. Por favor, iniciá sesión nuevamente.')
  }, [onUnauthorized])

  const fetchTienda = useCallback(
    async (customToken?: string, customUmbral?: number) => {
      const activeToken = customToken !== undefined ? customToken : token
      const activeUmbral = customUmbral !== undefined ? customUmbral : umbralUltimas

      if (isDemo && !customToken) {
        setProductos((prev) => {
          const recomputed = prev.map((p) => recomputeTiendaProduct(p, activeUmbral))
          setResumen(buildTiendaResumen(recomputed, activeUmbral, false))
          return recomputed
        })
        return
      }

      if (!activeToken) return

      setLoading(true)
      setError(null)
      try {
        const [catalogo, movs, salesRes, statusRes] = await Promise.all([
          tiendaService.getCatalogo(activeToken, activeUmbral, handleUnauth),
          tiendaService.listMovimientos(activeToken, 50, handleUnauth),
          tiendaService.listVentas(activeToken, { limit: 150 }, handleUnauth).catch(() => ({
            ventas: [] as TiendaSale[],
            resumen: EMPTY_SALES_SUMMARY,
          })),
          tiendaService.getTiendanubeStatus(activeToken, handleUnauth).catch(() => null),
        ])
        setProductos(Array.isArray(catalogo.productos) ? catalogo.productos : [])
        setCategorias(Array.isArray(catalogo.categorias) ? catalogo.categorias : [])
        setResumen(catalogo.resumen)
        setMovimientos(Array.isArray(movs) ? movs : [])
        setVentas(Array.isArray(salesRes.ventas) ? salesRes.ventas : [])
        setVentasResumen(salesRes.resumen || EMPTY_SALES_SUMMARY)
        setTnStatus(statusRes)
      } catch (err: any) {
        setError(err?.message || 'Error al consultar el catálogo de Tienda Online.')
      } finally {
        setLoading(false)
      }
    },
    [token, isDemo, umbralUltimas, handleUnauth]
  )

  const setUmbralUltimas = useCallback(
    (nextUmbral: number) => {
      const clamped = Math.max(1, Math.min(50, Math.round(nextUmbral || 2)))
      setUmbralUltimasState(clamped)
      if (isDemo) {
        setProductos((prev) => {
          const recomputed = prev.map((p) => recomputeTiendaProduct(p, clamped))
          setResumen(buildTiendaResumen(recomputed, clamped, false))
          return recomputed
        })
      } else if (token) {
        void fetchTienda(token, clamped)
      }
    },
    [isDemo, token, fetchTienda]
  )

  const importCsv = useCallback(
    async (file: File): Promise<TiendaImportResult> => {
      if (isDemo) {
        const text = await file.text()
        const { productos: nextProductos, result } = parseTiendanubeCsvClient(
          text,
          productos,
          umbralUltimas
        )
        setProductos(nextProductos)
        setResumen(buildTiendaResumen(nextProductos, umbralUltimas, false))
        return result
      }

      const csv_base64 = await fileToBase64(file)
      const result = await tiendaService.importCsv(
        { csv_base64, filename: file.name },
        token,
        handleUnauth
      )
      await fetchTienda()
      return result
    },
    [isDemo, productos, umbralUltimas, token, handleUnauth, fetchTienda]
  )

  const saveBatchUpdates = useCallback(
    async (updates: TiendaVariantPatchItem[]) => {
      if (updates.length === 0) return

      if (isDemo) {
        const nowIso = new Date().toISOString()
        const updateMap = new Map(updates.map((u) => [u.variant_id, u]))
        const addedMovements: TiendaMovimiento[] = []
        let nextMovId = movimientos.reduce((m, mv) => Math.max(m, mv.id), 7000) + 1

        const nextProductos = productos.map((prod) => {
          let changed = false
          const nextVariantes = prod.variantes.map((v) => {
            const patch = updateMap.get(v.id)
            if (!patch) return v
            changed = true
            const prevStock = v.stock
            const nextStock = patch.stock !== undefined ? Math.max(0, Math.round(patch.stock)) : v.stock
            const nextPrecio = patch.precio !== undefined ? Math.max(0, patch.precio) : v.precio
            let nextPromo = v.precio_promocional
            if (patch.clear_promocional) {
              nextPromo = null
            } else if (patch.precio_promocional !== undefined) {
              nextPromo =
                patch.precio_promocional !== null && patch.precio_promocional > 0
                  ? patch.precio_promocional
                  : null
            }

            if (patch.stock !== undefined && nextStock !== prevStock) {
              const delta = nextStock - prevStock
              addedMovements.push({
                id: nextMovId++,
                variant_id: v.id,
                producto_nombre: prod.nombre,
                talle: v.talle,
                color_estampado: v.color_estampado,
                sku: v.sku,
                delta,
                stock_resultante: nextStock,
                motivo: delta > 0 ? 'reposicion' : 'ajuste_manual',
                precio_unitario: null,
                medio_pago: null,
                nota: (patch.nota || 'Ajuste desde grilla').trim(),
                created_at: nowIso,
              })
            }

            return {
              ...v,
              stock: nextStock,
              precio: nextPrecio,
              precio_promocional: nextPromo,
              sync_status: 'pending_push' as const,
              updated_at: nowIso,
            }
          })

          if (!changed) return prod
          return recomputeTiendaProduct({ ...prod, variantes: nextVariantes }, umbralUltimas)
        })

        setProductos(nextProductos)
        setResumen(buildTiendaResumen(nextProductos, umbralUltimas, false))
        if (addedMovements.length > 0) {
          setMovimientos((prev) => [...addedMovements.reverse(), ...prev])
        }
        return
      }

      await tiendaService.batchUpdateVariantes({ updates }, token, handleUnauth)
      await fetchTienda()
    },
    [isDemo, productos, movimientos, umbralUltimas, token, handleUnauth, fetchTienda]
  )

  const applyBulkPriceAdjustment = useCallback(
    async (payload: TiendaBulkPricePayload): Promise<TiendaBulkPriceResponse> => {
      if (isDemo) {
        const nowIso = new Date().toISOString()
        const targetCat = (payload.categoria || '').trim()
        const targetIds = payload.product_ids ? new Set(payload.product_ids) : null
        const redondeo = payload.redondeo ?? 100
        let count = 0

        const nextProductos = productos.map((prod) => {
          if (targetIds && targetIds.size > 0 && !targetIds.has(prod.id)) return prod
          if (!targetIds && payload.category_id && !prod.category_ids.includes(payload.category_id)) return prod
          if (!targetIds && !payload.category_id && targetCat && targetCat.toLowerCase() !== 'todas' && prod.categoria !== targetCat) {
            return prod
          }
          const nextVars = prod.variantes.map((v) => {
            count++
            const nextPrecio = calcularPrecioAjustado(v.precio, payload.porcentaje, redondeo)
            const nextPromo =
              payload.aplicar_a_promocional && v.precio_promocional && v.precio_promocional > 0
                ? calcularPrecioAjustado(v.precio_promocional, payload.porcentaje, redondeo)
                : v.precio_promocional
            return {
              ...v,
              precio: nextPrecio,
              precio_promocional: nextPromo,
              sync_status: 'pending_push' as const,
              updated_at: nowIso,
            }
          })
          return recomputeTiendaProduct({ ...prod, variantes: nextVars }, umbralUltimas)
        })

        setProductos(nextProductos)
        setResumen(buildTiendaResumen(nextProductos, umbralUltimas, false))
        return { variantes_actualizadas: count }
      }

      const res = await tiendaService.ajusteMasivoPrecios(payload, token, handleUnauth)
      await fetchTienda()
      return res
    },
    [isDemo, productos, umbralUltimas, token, handleUnauth, fetchTienda]
  )

  const registrarVentaLocal = useCallback(
    async (payload: TiendaVentaLocalPayload) => {
      if (isDemo) {
        const nowIso = new Date().toISOString()
        let foundVariant = false
        let newMov: TiendaMovimiento | null = null
        const nextMovId = movimientos.reduce((m, mv) => Math.max(m, mv.id), 7000) + 1

        const nextProductos = productos.map((prod) => {
          let modified = false
          const nextVars = prod.variantes.map((v) => {
            if (v.id !== payload.variant_id) return v
            foundVariant = true
            if (v.stock < payload.cantidad) {
              throw new Error(`Stock insuficiente (disponible: ${v.stock}, solicitado: ${payload.cantidad}).`)
            }
            modified = true
            const nextStock = v.stock - payload.cantidad
            newMov = {
              id: nextMovId,
              variant_id: v.id,
              producto_nombre: prod.nombre,
              talle: v.talle,
              color_estampado: v.color_estampado,
              sku: v.sku,
              delta: -payload.cantidad,
              stock_resultante: nextStock,
              motivo: 'venta_local',
              precio_unitario: payload.precio_unitario,
              medio_pago: payload.medio_pago,
              nota: (payload.nota || '').trim(),
              created_at: nowIso,
            }
            return { ...v, stock: nextStock, sync_status: 'pending_push' as const, updated_at: nowIso }
          })
          if (!modified) return prod
          return recomputeTiendaProduct({ ...prod, variantes: nextVars }, umbralUltimas)
        })

        if (!foundVariant) throw new Error('Variante no encontrada.')
        setProductos(nextProductos)
        setResumen(buildTiendaResumen(nextProductos, umbralUltimas, false))
        if (newMov) setMovimientos((prev) => [newMov!, ...prev])
        return
      }

      await tiendaService.registrarVentaLocal(payload, token, handleUnauth)
      await fetchTienda()
    },
    [isDemo, productos, movimientos, umbralUltimas, token, handleUnauth, fetchTienda]
  )

  const createProduct = useCallback(
    async (payload: TiendaProductCreatePayload): Promise<TiendaProduct> => {
      if (isDemo) {
        const nowIso = new Date().toISOString()
        const nextProdId = productos.reduce((m, p) => Math.max(m, p.id), 1000) + 1
        let nextVarId = productos.reduce((m, p) => Math.max(m, ...p.variantes.map((v) => v.id), 0), 5000) + 1
        const catNames = categorias
          .filter((c) => c.tiendanube_category_id !== null && payload.category_ids.includes(c.tiendanube_category_id))
          .map((c) => c.nombre)
        const newProd = recomputeTiendaProduct(
          {
            id: nextProdId,
            tiendanube_id: null,
            slug: `${payload.nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${nextProdId}`,
            nombre: payload.nombre.trim(),
            categoria: catNames.join(', '),
            category_ids: payload.category_ids,
            categorias_nombres: catNames,
            images: [],
            linked_producto_id: null,
            activo: payload.published,
            published: payload.published,
            last_synced_at: null,
            stock_total: 0,
            es_ultimas_oportunidades: false,
            sin_stock: true,
            variantes: payload.variantes.map((v) => ({
              id: nextVarId++,
              tienda_product_id: nextProdId,
              tiendanube_variant_id: null,
              sku: `DEMO-${nextProdId}-${v.talle}`,
              talle: v.talle,
              color_estampado: '',
              stock: v.stock,
              precio: v.precio ?? payload.precio,
              precio_promocional: v.precio_promocional ?? payload.precio_promocional ?? null,
              sync_status: 'local_only',
              updated_at: nowIso,
            })),
          },
          umbralUltimas
        )
        const nextList = [newProd, ...productos]
        setProductos(nextList)
        setResumen(buildTiendaResumen(nextList, umbralUltimas, false))
        return newProd
      }

      const created = await tiendaService.createProducto(payload, token, handleUnauth)
      await fetchTienda()
      return created
    },
    [isDemo, productos, categorias, umbralUltimas, token, handleUnauth, fetchTienda]
  )

  const updateProduct = useCallback(
    async (productId: number, payload: TiendaProductUpdatePayload): Promise<TiendaProduct> => {
      if (isDemo) {
        const nowIso = new Date().toISOString()
        let nextVarId = productos.reduce((m, p) => Math.max(m, ...p.variantes.map((v) => v.id), 0), 5000) + 1
        let updatedOut: TiendaProduct | null = null
        const nextList = productos.map((p) => {
          if (p.id !== productId) return p
          const catIds = payload.category_ids ?? p.category_ids
          const catNames = categorias
            .filter((c) => c.tiendanube_category_id !== null && catIds.includes(c.tiendanube_category_id))
            .map((c) => c.nombre)
          const extraVars = (payload.agregar_talles || []).map((t) => ({
            id: nextVarId++,
            tienda_product_id: p.id,
            tiendanube_variant_id: null,
            sku: `DEMO-${p.id}-${t.talle}`,
            talle: t.talle,
            color_estampado: '',
            stock: t.stock,
            precio: t.precio ?? payload.precio ?? (p.variantes[0]?.precio || 0),
            precio_promocional: t.precio_promocional ?? null,
            sync_status: 'pending_push' as const,
            updated_at: nowIso,
          }))
          const vars = [...p.variantes, ...extraVars].map((v) => ({
            ...v,
            precio: payload.precio !== undefined ? payload.precio : v.precio,
            precio_promocional: payload.clear_promocional
              ? null
              : payload.precio_promocional !== undefined
                ? payload.precio_promocional
                : v.precio_promocional,
            updated_at: nowIso,
          }))
          updatedOut = recomputeTiendaProduct(
            {
              ...p,
              nombre: payload.nombre ?? p.nombre,
              published: payload.published ?? p.published,
              activo: payload.published ?? p.activo,
              category_ids: catIds,
              categorias_nombres: catNames.length > 0 ? catNames : p.categorias_nombres,
              categoria: catNames.join(', ') || p.categoria,
              variantes: vars,
            },
            umbralUltimas
          )
          return updatedOut
        })
        setProductos(nextList)
        setResumen(buildTiendaResumen(nextList, umbralUltimas, false))
        return updatedOut!
      }

      const updated = await tiendaService.updateProducto(productId, payload, token, handleUnauth)
      await fetchTienda()
      return updated
    },
    [isDemo, productos, categorias, umbralUltimas, token, handleUnauth, fetchTienda]
  )

  const deleteProduct = useCallback(
    async (productId: number): Promise<void> => {
      if (isDemo) {
        const nextList = productos.filter((p) => p.id !== productId)
        setProductos(nextList)
        setResumen(buildTiendaResumen(nextList, umbralUltimas, false))
        return
      }
      await tiendaService.deleteProducto(productId, token, handleUnauth)
      await fetchTienda()
    },
    [isDemo, productos, umbralUltimas, token, handleUnauth, fetchTienda]
  )

  const uploadPhoto = useCallback(
    async (productId: number, base64: string, filename: string, position?: number): Promise<TiendaImage[]> => {
      if (isDemo) {
        const dataUrl = `data:image/jpeg;base64,${base64}`
        let imgs: TiendaImage[] = []
        setProductos((prev) =>
          prev.map((p) => {
            if (p.id !== productId) return p
            imgs = [...p.images, { tiendanube_image_id: Date.now(), src: dataUrl, position: position || p.images.length + 1 }]
            return { ...p, images: imgs }
          })
        )
        return imgs
      }
      const res = await tiendaService.uploadFoto(productId, { attachment_base64: base64, filename, position }, token, handleUnauth)
      await fetchTienda()
      return res
    },
    [isDemo, token, handleUnauth, fetchTienda]
  )

  const deletePhoto = useCallback(
    async (productId: number, tnImageId: number): Promise<TiendaImage[]> => {
      if (isDemo) {
        let imgs: TiendaImage[] = []
        setProductos((prev) =>
          prev.map((p) => {
            if (p.id !== productId) return p
            imgs = p.images.filter((i) => i.tiendanube_image_id !== tnImageId)
            return { ...p, images: imgs }
          })
        )
        return imgs
      }
      const res = await tiendaService.deleteFoto(productId, tnImageId, token, handleUnauth)
      await fetchTienda()
      return res
    },
    [isDemo, token, handleUnauth, fetchTienda]
  )

  const reorderPhotos = useCallback(
    async (productId: number, imageIds: number[]): Promise<TiendaImage[]> => {
      if (isDemo) return []
      const res = await tiendaService.reorderFotos(productId, imageIds, token, handleUnauth)
      await fetchTienda()
      return res
    },
    [isDemo, token, handleUnauth, fetchTienda]
  )

  const createCategory = useCallback(
    async (nombre: string): Promise<TiendaCategory> => {
      if (isDemo) {
        const nextId = categorias.reduce((m, c) => Math.max(m, c.id), 0) + 1
        const cat: TiendaCategory = {
          id: nextId,
          tiendanube_category_id: 100 + nextId,
          nombre: nombre.trim(),
          parent_tiendanube_id: null,
          handle: nombre.trim().toLowerCase().replace(/\s+/g, '-'),
        }
        setCategorias((prev) => [...prev, cat])
        return cat
      }
      const created = await tiendaService.createCategoria(nombre, token, handleUnauth)
      await fetchTienda()
      return created
    },
    [isDemo, categorias, token, handleUnauth, fetchTienda]
  )

  const createSale = useCallback(
    async (payload: TiendaSaleCreatePayload): Promise<TiendaSale> => {
      if (isDemo) {
        const nowIso = new Date().toISOString()
        const qtyByVar = new Map<number, number>()
        for (const it of payload.items) {
          qtyByVar.set(it.variant_id, (qtyByVar.get(it.variant_id) || 0) + it.cantidad)
        }
        const { subtotal, total } = calcularTotalVenta(
          payload.items,
          payload.descuento_tipo ?? null,
          payload.descuento_valor ?? 0
        )
        const nextSaleId = ventas.reduce((m, s) => Math.max(m, s.id), 9000) + 1
        const saleItems: TiendaSale['items'] = []
        let nextMovId = movimientos.reduce((m, mv) => Math.max(m, mv.id), 7000) + 1
        const newMovs: TiendaMovimiento[] = []

        const nextProds = productos.map((prod) => {
          let changed = false
          const nextVars = prod.variantes.map((v) => {
            const qty = qtyByVar.get(v.id)
            if (!qty) return v
            if (v.stock < qty) {
              throw new Error(`Stock insuficiente en ${prod.nombre} (${v.talle}).`)
            }
            changed = true
            const nextStock = v.stock - qty
            const unitP = payload.items.find((i) => i.variant_id === v.id)?.precio_unitario ?? v.precio
            saleItems.push({
              id: saleItems.length + 1,
              variant_id: v.id,
              producto_nombre: prod.nombre,
              talle: v.talle,
              cantidad: qty,
              precio_unitario: unitP,
            })
            newMovs.push({
              id: nextMovId++,
              variant_id: v.id,
              sale_id: nextSaleId,
              producto_nombre: prod.nombre,
              talle: v.talle,
              color_estampado: '',
              sku: v.sku,
              delta: -qty,
              stock_resultante: nextStock,
              motivo: 'venta_local',
              precio_unitario: unitP,
              medio_pago: payload.medio_pago,
              nota: `Venta #${nextSaleId}`,
              created_at: nowIso,
            })
            return { ...v, stock: nextStock, sync_status: 'pending_push' as const, updated_at: nowIso }
          })
          return changed ? recomputeTiendaProduct({ ...prod, variantes: nextVars }, umbralUltimas) : prod
        })

        const newSale: TiendaSale = {
          id: nextSaleId,
          canal: 'local',
          tiendanube_order_id: null,
          tiendanube_order_number: null,
          estado: 'completada',
          medio_pago: payload.medio_pago,
          subtotal,
          descuento_tipo: payload.descuento_tipo ?? null,
          descuento_valor: payload.descuento_valor ?? 0,
          total,
          created_at: nowIso,
          anulada_at: null,
          items: saleItems,
        }
        const nextSales = [newSale, ...ventas]
        setProductos(nextProds)
        setResumen(buildTiendaResumen(nextProds, umbralUltimas, false))
        setVentas(nextSales)
        setVentasResumen(summarizeDemoSales(nextSales))
        setMovimientos((prev) => [...newMovs, ...prev])
        return newSale
      }

      const sale = await tiendaService.createVenta(payload, token, handleUnauth)
      await fetchTienda()
      return sale
    },
    [isDemo, productos, ventas, movimientos, umbralUltimas, token, handleUnauth, fetchTienda]
  )

  const anularSale = useCallback(
    async (saleId: number): Promise<void> => {
      if (isDemo) {
        const nowIso = new Date().toISOString()
        const target = ventas.find((s) => s.id === saleId)
        if (!target || target.estado === 'anulada') return

        const restoreMap = new Map<number, number>()
        for (const it of target.items) {
          if (it.variant_id) restoreMap.set(it.variant_id, (restoreMap.get(it.variant_id) || 0) + it.cantidad)
        }

        const nextProds = productos.map((prod) => {
          let changed = false
          const nextVars = prod.variantes.map((v) => {
            const qty = restoreMap.get(v.id)
            if (!qty) return v
            changed = true
            return { ...v, stock: v.stock + qty, updated_at: nowIso }
          })
          return changed ? recomputeTiendaProduct({ ...prod, variantes: nextVars }, umbralUltimas) : prod
        })

        const nextSales = ventas.map((s) =>
          s.id === saleId ? { ...s, estado: 'anulada' as const, anulada_at: nowIso } : s
        )
        setProductos(nextProds)
        setResumen(buildTiendaResumen(nextProds, umbralUltimas, false))
        setVentas(nextSales)
        setVentasResumen(summarizeDemoSales(nextSales))
        return
      }

      await tiendaService.anularVenta(saleId, token, handleUnauth)
      await fetchTienda()
    },
    [isDemo, productos, ventas, umbralUltimas, token, handleUnauth, fetchTienda]
  )

  const pullFromTiendanube = useCallback(async () => {
    if (isDemo) {
      return { categorias: categorias.length, productos: productos.length, variantes: 0, skus_generados: 0 }
    }
    const stats = await tiendaService.pullFromTiendanube(token, handleUnauth)
    await fetchTienda()
    return stats
  }, [isDemo, categorias.length, productos.length, token, handleUnauth, fetchTienda])

  const retryPendingSync = useCallback(async () => {
    if (isDemo) {
      return { productos_creados: 0, variantes_sincronizadas: 0, fallidas: 0 }
    }
    const stats = await tiendaService.retryPendingTiendanube(token, handleUnauth)
    await fetchTienda()
    return stats
  }, [isDemo, token, handleUnauth, fetchTienda])

  const connectTiendanube = useCallback(async () => {
    if (isDemo) return
    const { url } = await tiendaService.getTiendanubeAuthUrl(token, handleUnauth)
    window.location.href = url
  }, [isDemo, token, handleUnauth])

  const loadDemoTienda = useCallback(() => {
    const initial = DEMO_TIENDA_PRODUCTOS.map((p) => recomputeTiendaProduct(p, 2))
    setUmbralUltimasState(2)
    setCategorias(DEMO_TIENDA_CATEGORIAS)
    setProductos(initial)
    setResumen(buildTiendaResumen(initial, 2, false))
    setMovimientos(DEMO_TIENDA_MOVIMIENTOS)
    setVentas(DEMO_TIENDA_VENTAS)
    setVentasResumen(summarizeDemoSales(DEMO_TIENDA_VENTAS))
    setTnStatus({
      conectado: false,
      oauth_configurado: false,
      store_id: null,
      last_full_sync_at: null,
      variantes_pendientes: 1,
    })
    setError(null)
  }, [])

  const resetTienda = useCallback(() => {
    setProductos([])
    setCategorias([])
    setResumen(buildTiendaResumen([], 2, false))
    setMovimientos([])
    setVentas([])
    setVentasResumen(EMPTY_SALES_SUMMARY)
    setTnStatus(null)
    setError(null)
    setLoading(false)
  }, [])

  return {
    productos,
    categorias,
    resumen,
    movimientos,
    ventas,
    ventasResumen,
    tnStatus,
    loading,
    error,
    umbralUltimas,
    setUmbralUltimas,
    fetchTienda,
    importCsv,
    saveBatchUpdates,
    applyBulkPriceAdjustment,
    registrarVentaLocal,
    createProduct,
    updateProduct,
    deleteProduct,
    uploadPhoto,
    deletePhoto,
    reorderPhotos,
    createCategory,
    createSale,
    anularSale,
    pullFromTiendanube,
    retryPendingSync,
    connectTiendanube,
    loadDemoTienda,
    resetTienda,
  }
}
