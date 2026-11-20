export interface Tela {
  id: number
  nombre: string
  precio_kilo: number
  rendimiento: number
  descripcion: string
  precio_metro: number
}

export interface Producto {
  id: number
  nombre: string
  tela: Tela
  consumo_metros: number
  tela_secundaria?: Tela | null
  consumo_metros_secundaria?: number
  costo_confeccion: number
  tipo_estampado: string
  consumo_estampado: number
  nombre_avio: string
  costo_avio: number
  costo_tela: number
  costo_estampado: number
  costo_base: number
  costo_produccion: number
  precio_venta: number
}

export interface PresupuestoItem {
  id: number
  presupuesto_id: number
  producto_id: number
  cantidad: number
  precio_unitario: number
  productos: {
    id: number
    nombre: string
  }
}

export interface Presupuesto {
  id: number
  cliente_referencia: string
  multiplicador: number
  costo_fijo: number
  precio_total: number
  created_at: string
  descripcion_pdf?: string
}

export interface PresupuestoDetalle {
  presupuesto: Presupuesto
  detalles: PresupuestoItem[]
}

export interface TipoEstampado {
  id: number
  nombre: string
  costo: number
}

export interface Configuracion {
  costo_fijo: number
  multiplicador: number
  precio_metro_dtf: number
  precio_metro_sublimacion: number
  precio_unidad_serigrafia: number
  precio_unidad_bordado: number
  descripcion_pdf: string
  tipos_estampado?: TipoEstampado[]
  precios_estampado?: Record<string, number>
}

export interface CalculoPresupuesto {
  cliente: string
  multiplicador_usado: number
  costo_fijo_usado: number
  items: Array<{
    producto_id: number
    nombre: string
    cantidad: number
    detalle_estampado: string
    costo_estampado: number
    costo_base_unitario: number
    precio_unitario: number
    subtotal: number
  }>
  total_prendas: number
  total_final: number
}

export interface HealthStatus {
  status: string
  service: string
}

export type ViewId = 'dashboard' | 'catalogo' | 'telas' | 'nuevo' | 'historial' | 'config' | 'tienda'

export type EditableEntity<T> = T | null | 'new'

export interface TelaMutationInput {
  nombre: string
  precio_kilo: number
  rendimiento: number
  descripcion: string
}

export interface ProductoMutationInput {
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
}

export interface PresupuestoDraftItem {
  producto_id: number
  cantidad: number
  detalle_estampado: string
}

export interface PresupuestoDraft {
  cliente: string
  multiplicador: number
  costoFijo: number
  descripcion_pdf?: string
  items: PresupuestoDraftItem[]
}

export interface PresupuestoCreatePayload {
  cliente: string
  multiplicador: number
  costo_fijo: number
  descripcion_pdf?: string
  items: Array<{
    producto_id: number
    cantidad: number
    detalle_estampado?: string
  }>
}

export interface ConfiguracionUpdatePayload {
  costo_fijo: number
  multiplicador: number
  precio_dtf: number
  precio_sublimacion: number
  precio_serigrafia: number
  precio_bordado: number
  descripcion_pdf: string
  tipos_estampado: Array<{
    id?: number
    nombre: string
    costo: number
  }>
}

export interface SessionState {
  auth: boolean
  isDemo: boolean
  token: string
  userEmail: string
  sessionNotice: string | null
}

// --- Tienda Online (Tiendanube + Stock Físico) ---

export type TiendaSyncStatus = 'synced' | 'pending_push' | 'local_only'

export type TiendaMedioPago = 'efectivo' | 'transferencia' | 'tarjeta' | 'online'

export type TiendaMovimientoMotivo =
  | 'venta_local'
  | 'venta_web'
  | 'ajuste_manual'
  | 'reposicion'
  | 'import_csv'
  | 'sync_tiendanube'

export interface TiendaImage {
  tiendanube_image_id: number | null
  src: string
  position: number
}

export interface TiendaCategory {
  id: number
  tiendanube_category_id: number | null
  nombre: string
  parent_tiendanube_id: number | null
  handle: string
}

export interface TiendaVariant {
  id: number
  tienda_product_id: number
  tiendanube_variant_id: number | null
  sku: string
  talle: string
  color_estampado: string
  stock: number
  precio: number
  precio_promocional: number | null
  sync_status: TiendaSyncStatus
  last_sync_error?: string | null
  updated_at: string
}

export interface TiendaProduct {
  id: number
  tiendanube_id: number | null
  slug: string
  nombre: string
  categoria: string
  category_ids: number[]
  categorias_nombres: string[]
  images: TiendaImage[]
  linked_producto_id: number | null
  activo: boolean
  published: boolean
  last_synced_at: string | null
  stock_total: number
  es_ultimas_oportunidades: boolean
  sin_stock: boolean
  variantes: TiendaVariant[]
}

export interface TiendaResumen {
  total_productos: number
  total_variantes: number
  unidades_totales: number
  productos_ultimas_oportunidades: number
  variantes_sin_stock: number
  variantes_pendientes_sync: number
  tiendanube_conectado: boolean
  store_id: number | null
  last_full_sync_at: string | null
  umbral_ultimas: number
}

export interface TiendaCatalogoResponse {
  productos: TiendaProduct[]
  categorias: TiendaCategory[]
  resumen: TiendaResumen
}

export interface TiendaMovimiento {
  id: number
  variant_id: number
  sale_id?: number | null
  producto_nombre: string
  talle: string
  color_estampado: string
  sku: string
  delta: number
  stock_resultante: number
  motivo: TiendaMovimientoMotivo
  precio_unitario: number | null
  medio_pago: TiendaMedioPago | null
  nota: string
  created_at: string
}

export interface TiendaCsvImportPayload {
  csv_base64?: string
  csv_content?: string
  filename?: string
}

export interface TiendaImportResult {
  productos_procesados: number
  variantes_procesadas: number
  errores: string[]
}

export interface TiendaVariantPatchItem {
  variant_id: number
  stock?: number
  precio?: number
  precio_promocional?: number | null
  clear_promocional?: boolean
  nota?: string
}

export interface TiendaBatchUpdatePayload {
  updates: TiendaVariantPatchItem[]
}

export interface TiendaBatchUpdateResponse {
  actualizadas: number
  variantes: TiendaVariant[]
}

export interface TiendaBulkPricePayload {
  porcentaje: number
  categoria?: string | null
  category_id?: number | null
  product_ids?: number[] | null
  redondeo?: number
  aplicar_a_promocional?: boolean
}

export interface TiendaBulkPriceResponse {
  variantes_actualizadas: number
}

export interface TiendaVentaLocalPayload {
  variant_id: number
  cantidad: number
  precio_unitario: number
  medio_pago: 'efectivo' | 'transferencia' | 'tarjeta'
  nota?: string
}

export interface TiendaVentaLocalResponse {
  variante: TiendaVariant
  movimiento: TiendaMovimiento
}

export interface TiendaProductVariantCreate {
  talle: string
  stock: number
  precio?: number
  precio_promocional?: number | null
}

export interface TiendaProductCreatePayload {
  nombre: string
  category_ids: number[]
  precio: number
  precio_promocional?: number | null
  published: boolean
  variantes: TiendaProductVariantCreate[]
}

export interface TiendaProductUpdatePayload {
  nombre?: string
  category_ids?: number[]
  published?: boolean
  precio?: number
  precio_promocional?: number | null
  clear_promocional?: boolean
  agregar_talles?: TiendaProductVariantCreate[]
}

export interface TiendaSaleItemIn {
  variant_id: number
  cantidad: number
  precio_unitario: number
}

export interface TiendaSaleCreatePayload {
  items: TiendaSaleItemIn[]
  medio_pago: 'efectivo' | 'transferencia' | 'tarjeta'
  descuento_tipo?: 'porcentaje' | 'monto' | null
  descuento_valor?: number
}

export interface TiendaSaleItem {
  id: number
  variant_id: number | null
  producto_nombre: string
  talle: string
  cantidad: number
  precio_unitario: number
}

export interface TiendaSale {
  id: number
  canal: 'local' | 'web'
  tiendanube_order_id: number | null
  tiendanube_order_number: string | null
  estado: 'completada' | 'anulada'
  medio_pago: TiendaMedioPago | null
  subtotal: number
  descuento_tipo: 'porcentaje' | 'monto' | null
  descuento_valor: number
  total: number
  created_at: string
  anulada_at: string | null
  items: TiendaSaleItem[]
}

export interface TiendaSalesSummary {
  cantidad_ventas: number
  total_monto: number
  total_local: number
  total_web: number
  por_medio_pago: Record<string, number>
}

export interface TiendaSalesListResponse {
  ventas: TiendaSale[]
  resumen: TiendaSalesSummary
}

export interface TiendanubeStatus {
  conectado: boolean
  oauth_configurado: boolean
  store_id: number | null
  last_full_sync_at: string | null
  variantes_pendientes: number
}
