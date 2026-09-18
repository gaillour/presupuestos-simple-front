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
}

export interface PresupuestoDetalle {
  presupuesto: Presupuesto
  detalles: PresupuestoItem[]
}

export interface Configuracion {
  costo_fijo: number
  multiplicador: number
  precio_metro_dtf: number
  precio_metro_sublimacion: number
  precio_unidad_serigrafia: number
  precio_unidad_bordado: number
  descripcion_pdf: string
}

export interface TipoEstampado {
  id: number
  nombre: string
  costo: number
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
