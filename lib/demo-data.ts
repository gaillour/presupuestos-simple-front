import type { Tela, Producto, Presupuesto } from '@/lib/types'

export const DEMO_TELAS: Tela[] = [
  {
    id: 101,
    nombre: 'Algodón 24/1 Peinado',
    precio_kilo: 12500,
    rendimiento: 3.2,
    descripcion: 'Punto liso 100% algodón para remeras premium',
    precio_metro: 3906.25,
  },
  {
    id: 102,
    nombre: 'Rústico de Algodón con Lycra',
    precio_kilo: 15800,
    rendimiento: 2.1,
    descripcion: 'Frisa liviana de media estación para buzos y joggers',
    precio_metro: 7523.81,
  },
  {
    id: 103,
    nombre: 'Ribb 1x1 Algodón',
    precio_kilo: 11000,
    rendimiento: 3.5,
    descripcion: 'Complemento elastizado para cuellos y puños',
    precio_metro: 3142.86,
  },
]

export const DEMO_PRODUCTOS: Producto[] = [
  {
    id: 201,
    nombre: 'Remera Algodón Básica Cuello Redondo',
    tela: DEMO_TELAS[0],
    consumo_metros: 0.7,
    costo_confeccion: 2200,
    tipo_estampado: 'DTF',
    consumo_estampado: 0.1,
    nombre_avio: 'Etiqueta talle',
    costo_avio: 300,
    costo_tela: 2734.38,
    costo_estampado: 1000,
    costo_base: 6234.38,
    costo_produccion: 7234.38,
    precio_venta: 20468.76,
  },
  {
    id: 202,
    nombre: 'Buzo Canguro Rústico Algodón',
    tela: DEMO_TELAS[1],
    consumo_metros: 1.35,
    costo_confeccion: 3800,
    tipo_estampado: 'Bordado',
    consumo_estampado: 2500,
    nombre_avio: 'Cordón y ojalillos',
    costo_avio: 1200,
    costo_tela: 10157.14,
    costo_estampado: 0,
    costo_base: 15157.14,
    costo_produccion: 15157.14,
    precio_venta: 36314.28,
  },
]

export const DEMO_PRESUPUESTOS: Presupuesto[] = [
  {
    id: 301,
    cliente_referencia: 'Cliente Demostración (Ejemplo)',
    multiplicador: 2.0,
    costo_fijo: 6000,
    precio_total: 91251.8,
    created_at: new Date().toISOString(),
  },
]
