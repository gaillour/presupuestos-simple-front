import { apiRequest } from './client.ts'
import type {
  TiendaBatchUpdatePayload,
  TiendaBatchUpdateResponse,
  TiendaBulkPricePayload,
  TiendaBulkPriceResponse,
  TiendaCatalogoResponse,
  TiendaCategory,
  TiendaCsvImportPayload,
  TiendaImage,
  TiendaImportResult,
  TiendaMovimiento,
  TiendanubeStatus,
  TiendaProduct,
  TiendaProductCreatePayload,
  TiendaProductUpdatePayload,
  TiendaSale,
  TiendaSaleCreatePayload,
  TiendaSalesListResponse,
  TiendaVentaLocalPayload,
  TiendaVentaLocalResponse,
} from '../types.ts'

export const tiendaService = {
  getCatalogo(
    token: string,
    umbralUltimas: number = 2,
    onUnauthorized?: () => void
  ): Promise<TiendaCatalogoResponse> {
    return apiRequest<TiendaCatalogoResponse>(
      `/api/tienda/productos?umbral_ultimas=${umbralUltimas}`,
      {
        method: 'GET',
        token,
        onUnauthorized,
      }
    )
  },

  createProducto(
    payload: TiendaProductCreatePayload,
    token: string,
    onUnauthorized?: () => void
  ): Promise<TiendaProduct> {
    return apiRequest<TiendaProduct>('/api/tienda/productos', {
      method: 'POST',
      token,
      body: payload,
      onUnauthorized,
    })
  },

  updateProducto(
    productId: number,
    payload: TiendaProductUpdatePayload,
    token: string,
    onUnauthorized?: () => void
  ): Promise<TiendaProduct> {
    return apiRequest<TiendaProduct>(`/api/tienda/productos/${productId}`, {
      method: 'PATCH',
      token,
      body: payload,
      onUnauthorized,
    })
  },

  deleteProducto(
    productId: number,
    token: string,
    onUnauthorized?: () => void
  ): Promise<void> {
    return apiRequest<void>(`/api/tienda/productos/${productId}`, {
      method: 'DELETE',
      token,
      onUnauthorized,
    })
  },

  uploadFoto(
    productId: number,
    payload: { attachment_base64: string; filename: string; position?: number },
    token: string,
    onUnauthorized?: () => void
  ): Promise<TiendaImage[]> {
    return apiRequest<TiendaImage[]>(`/api/tienda/productos/${productId}/fotos`, {
      method: 'POST',
      token,
      body: payload,
      onUnauthorized,
    })
  },

  deleteFoto(
    productId: number,
    tnImageId: number,
    token: string,
    onUnauthorized?: () => void
  ): Promise<TiendaImage[]> {
    return apiRequest<TiendaImage[]>(
      `/api/tienda/productos/${productId}/fotos/${tnImageId}`,
      {
        method: 'DELETE',
        token,
        onUnauthorized,
      }
    )
  },

  reorderFotos(
    productId: number,
    imageIds: number[],
    token: string,
    onUnauthorized?: () => void
  ): Promise<TiendaImage[]> {
    return apiRequest<TiendaImage[]>(
      `/api/tienda/productos/${productId}/fotos/orden`,
      {
        method: 'PATCH',
        token,
        body: { image_ids: imageIds },
        onUnauthorized,
      }
    )
  },

  createCategoria(
    nombre: string,
    token: string,
    onUnauthorized?: () => void
  ): Promise<TiendaCategory> {
    return apiRequest<TiendaCategory>('/api/tienda/categorias', {
      method: 'POST',
      token,
      body: { nombre },
      onUnauthorized,
    })
  },

  importCsv(
    payload: TiendaCsvImportPayload,
    token: string,
    onUnauthorized?: () => void
  ): Promise<TiendaImportResult> {
    return apiRequest<TiendaImportResult>('/api/tienda/import-csv', {
      method: 'POST',
      token,
      body: payload,
      onUnauthorized,
    })
  },

  batchUpdateVariantes(
    payload: TiendaBatchUpdatePayload,
    token: string,
    onUnauthorized?: () => void
  ): Promise<TiendaBatchUpdateResponse> {
    return apiRequest<TiendaBatchUpdateResponse>('/api/tienda/variantes/batch', {
      method: 'PATCH',
      token,
      body: payload,
      onUnauthorized,
    })
  },

  ajusteMasivoPrecios(
    payload: TiendaBulkPricePayload,
    token: string,
    onUnauthorized?: () => void
  ): Promise<TiendaBulkPriceResponse> {
    return apiRequest<TiendaBulkPriceResponse>('/api/tienda/precios/ajuste-masivo', {
      method: 'POST',
      token,
      body: payload,
      onUnauthorized,
    })
  },

  createVenta(
    payload: TiendaSaleCreatePayload,
    token: string,
    onUnauthorized?: () => void
  ): Promise<TiendaSale> {
    return apiRequest<TiendaSale>('/api/tienda/ventas', {
      method: 'POST',
      token,
      body: payload,
      onUnauthorized,
    })
  },

  listVentas(
    token: string,
    params?: { canal?: 'local' | 'web'; desde?: string; hasta?: string; limit?: number },
    onUnauthorized?: () => void
  ): Promise<TiendaSalesListResponse> {
    const search = new URLSearchParams()
    if (params?.canal) search.set('canal', params.canal)
    if (params?.desde) search.set('desde', params.desde)
    if (params?.hasta) search.set('hasta', params.hasta)
    if (params?.limit) search.set('limit', String(params.limit))
    const qs = search.toString() ? `?${search.toString()}` : ''
    return apiRequest<TiendaSalesListResponse>(`/api/tienda/ventas${qs}`, {
      method: 'GET',
      token,
      onUnauthorized,
    })
  },

  anularVenta(
    saleId: number,
    token: string,
    onUnauthorized?: () => void
  ): Promise<TiendaSale> {
    return apiRequest<TiendaSale>(`/api/tienda/ventas/${saleId}/anular`, {
      method: 'POST',
      token,
      onUnauthorized,
    })
  },

  registrarVentaLocal(
    payload: TiendaVentaLocalPayload,
    token: string,
    onUnauthorized?: () => void
  ): Promise<TiendaVentaLocalResponse> {
    return apiRequest<TiendaVentaLocalResponse>('/api/tienda/ventas-locales', {
      method: 'POST',
      token,
      body: payload,
      onUnauthorized,
    })
  },

  listMovimientos(
    token: string,
    limit: number = 50,
    onUnauthorized?: () => void
  ): Promise<TiendaMovimiento[]> {
    return apiRequest<TiendaMovimiento[]>(`/api/tienda/movimientos?limit=${limit}`, {
      method: 'GET',
      token,
      onUnauthorized,
    })
  },

  getTiendanubeStatus(
    token: string,
    onUnauthorized?: () => void
  ): Promise<TiendanubeStatus> {
    return apiRequest<TiendanubeStatus>('/api/tienda/tiendanube/status', {
      method: 'GET',
      token,
      onUnauthorized,
    })
  },

  getTiendanubeAuthUrl(
    token: string,
    onUnauthorized?: () => void
  ): Promise<{ url: string }> {
    return apiRequest<{ url: string }>('/api/tienda/tiendanube/auth-url', {
      method: 'GET',
      token,
      onUnauthorized,
    })
  },

  pullFromTiendanube(
    token: string,
    onUnauthorized?: () => void
  ): Promise<{
    categorias: number
    productos: number
    variantes: number
    skus_generados: number
    productos_archivados?: number
    skus_push_fallidos?: number
  }> {
    return apiRequest('/api/tienda/tiendanube/pull', {
      method: 'POST',
      token,
      onUnauthorized,
    })
  },

  retryPendingTiendanube(
    token: string,
    onUnauthorized?: () => void
  ): Promise<{ productos_creados: number; variantes_sincronizadas: number; fallidas: number }> {
    return apiRequest('/api/tienda/tiendanube/retry-pending', {
      method: 'POST',
      token,
      onUnauthorized,
    })
  },
}
