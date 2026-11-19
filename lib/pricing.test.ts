import test from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizarTecnica,
  obtenerTecnicasEstampado,
  calcularCostoEstampadoDesdeConfig,
  calcularCostoTelaCombinada,
  calcularPrecioUnitarioProducto,
  construirProductoCalculado,
  recalcularCatalogoConConfig,
  calcularTotalPresupuestoItems,
} from './pricing.ts'
import type { Configuracion, Producto, Tela, TipoEstampado } from './types.ts'

test('normalizarTecnica quita tildes y pasa a minúsculas', () => {
  assert.equal(normalizarTecnica('  Sublimación '), 'sublimacion')
  assert.equal(normalizarTecnica('Corte + Sublimado'), 'corte + sublimado')
})

test('calcularCostoTelaCombinada suma tela principal y secundaria opcional', () => {
  const algodon: Tela = {
    id: 1,
    nombre: 'Algodón',
    precio_kilo: 12000,
    rendimiento: 3,
    descripcion: '',
    precio_metro: 4000,
  }
  const lycra: Tela = {
    id: 2,
    nombre: 'Lycra',
    precio_kilo: 16000,
    rendimiento: 2,
    descripcion: '',
    precio_metro: 8000,
  }

  // Solo 1 tela: 4000 * 0.7 = 2800
  assert.equal(calcularCostoTelaCombinada(algodon, 0.7, null, 0), 2800)

  // Combinada 2 telas: (4000 * 0.7) + (8000 * 0.25) = 2800 + 2000 = 4800
  assert.equal(calcularCostoTelaCombinada(algodon, 0.7, lycra, 0.25), 4800)
})

test('calcularCostoEstampadoDesdeConfig y calcularPrecioUnitarioProducto coinciden con backend', () => {
  const config: Configuracion = {
    costo_fijo: 6000,
    multiplicador: 2.0,
    precio_metro_dtf: 10000,
    precio_metro_sublimacion: 3000,
    precio_unidad_serigrafia: 1500,
    precio_unidad_bordado: 2500,
    descripcion_pdf: '',
    tipos_estampado: [
      { id: 1, nombre: 'DTF', costo: 10000 },
      { id: 5, nombre: 'Corte + Sublimado', costo: 4200 },
    ],
  }

  const tecnicas = obtenerTecnicasEstampado(config)
  assert.ok(tecnicas.some((t) => t.nombre === 'Corte + Sublimado'))
  assert.ok(tecnicas.some((t) => t.nombre === 'Sublimación'))

  const costoEst = calcularCostoEstampadoDesdeConfig('Corte + Sublimado', 1, config)
  assert.equal(costoEst, 4200)

  // Costo base = 7000, mult = 2.5, fijo = 5000, estampa = 4200 => ((7000 + 4200) * 2.5) + 5000 = 33000
  const precioUnit = calcularPrecioUnitarioProducto(
    { costo_base: 7000, costo_estampado: costoEst, precio_venta: 0 },
    2.5,
    5000
  )
  assert.equal(precioUnit, 33000)

  // Sin estampa (costo_estampado = 0): (7000 * 2.5) + 5000 = 22500
  const precioSinEstampa = calcularPrecioUnitarioProducto(
    { costo_base: 7000, costo_estampado: 0, precio_venta: 0 },
    2.5,
    5000
  )
  assert.equal(precioSinEstampa, 22500)
})

test('obtenerTecnicasEstampado prioriza tiposDirectos provenientes de /api/tipos-estampado', () => {
  const directos = [
    { id: 9, nombre: 'Vinilo Reflectivo', costo: 8500 },
  ]
  const tecnicas = obtenerTecnicasEstampado(null, directos)
  assert.ok(tecnicas.some((t) => t.nombre === 'Vinilo Reflectivo' && t.costo === 8500))
  assert.ok(tecnicas.some((t) => t.nombre === 'DTF'))
})

test('construirProductoCalculado arma producto con tela simple y cálculo completo', () => {
  const algodon: Tela = {
    id: 1,
    nombre: 'Algodón Peinado',
    precio_kilo: 12000,
    rendimiento: 3,
    descripcion: '',
    precio_metro: 4000,
  }
  const config: Configuracion = {
    costo_fijo: 6000,
    multiplicador: 2.0,
    precio_metro_dtf: 10000,
    precio_metro_sublimacion: 3000,
    precio_unidad_serigrafia: 1500,
    precio_unidad_bordado: 2500,
    descripcion_pdf: '',
  }

  const producto = construirProductoCalculado(
    101,
    {
      nombre: 'Remera Simple',
      tela_id: 1,
      consumo_metros: 0.8,
      tela_secundaria_id: null,
      consumo_metros_secundaria: 0,
      costo_confeccion: 2000,
      tipo_estampado: 'DTF',
      consumo_estampado: 0.5,
      nombre_avio: 'Etiqueta',
      costo_avio: 500,
    },
    [algodon],
    config
  )

  assert.equal(producto.id, 101)
  assert.equal(producto.nombre, 'Remera Simple')
  assert.equal(producto.tela.id, 1)
  assert.equal(producto.tela_secundaria, null)
  assert.equal(producto.consumo_metros_secundaria, 0)
  assert.equal(producto.costo_tela, 3200) // 4000 * 0.8
  assert.equal(producto.costo_base, 5700) // 3200 + 2000 + 500
  assert.equal(producto.costo_estampado, 5000) // 0.5 * 10000
  assert.equal(producto.costo_produccion, 10700) // 5700 + 5000
  assert.equal(producto.precio_venta, 27400) // (10700 * 2.0) + 6000
})

test('construirProductoCalculado arma producto con tela combinada y respeta tiposEstampado directo', () => {
  const algodon: Tela = {
    id: 1,
    nombre: 'Algodón',
    precio_kilo: 12000,
    rendimiento: 3,
    descripcion: '',
    precio_metro: 4000,
  }
  const lycra: Tela = {
    id: 2,
    nombre: 'Lycra',
    precio_kilo: 16000,
    rendimiento: 2,
    descripcion: '',
    precio_metro: 8000,
  }
  const tiposDirectos: TipoEstampado[] = [
    { id: 7, nombre: 'Serigrafía Premium', costo: 3500 },
  ]
  const config: Configuracion = {
    costo_fijo: 5000,
    multiplicador: 2.5,
    precio_metro_dtf: 10000,
    precio_metro_sublimacion: 3000,
    precio_unidad_serigrafia: 1500,
    precio_unidad_bordado: 2500,
    descripcion_pdf: '',
  }

  const producto = construirProductoCalculado(
    202,
    {
      nombre: 'Buzo Combinado',
      tela_id: 1,
      consumo_metros: 1.2,
      tela_secundaria_id: 2,
      consumo_metros_secundaria: 0.3,
      costo_confeccion: 4000,
      tipo_estampado: 'Serigrafía Premium',
      consumo_estampado: 2,
      nombre_avio: 'Cierre',
      costo_avio: 1500,
    },
    [algodon, lycra],
    config,
    tiposDirectos
  )

  // Costo tela: (4000 * 1.2) + (8000 * 0.3) = 4800 + 2400 = 7200
  assert.equal(producto.costo_tela, 7200)
  assert.equal(producto.tela_secundaria?.id, 2)
  assert.equal(producto.consumo_metros_secundaria, 0.3)
  // Costo base: 7200 + 4000 + 1500 = 12700
  assert.equal(producto.costo_base, 12700)
  // Costo estampado: 2 * 3500 = 7000
  assert.equal(producto.costo_estampado, 7000)
  // Costo produccion: 12700 + 7000 = 19700
  assert.equal(producto.costo_produccion, 19700)
  // Precio venta: (19700 * 2.5) + 5000 = 49250 + 5000 = 54250
  assert.equal(producto.precio_venta, 54250)
})

test('construirProductoCalculado usa fallbacks si tela no existe y config es nula', () => {
  const prod = construirProductoCalculado(
    303,
    {
      nombre: 'Demo Sin Tela',
      tela_id: 999,
      consumo_metros: 1.0,
      tela_secundaria_id: null,
      consumo_metros_secundaria: 0,
      costo_confeccion: 3000,
      tipo_estampado: 'Ninguno',
      consumo_estampado: 0,
      nombre_avio: '',
      costo_avio: 0,
    },
    [],
    null
  )

  assert.equal(prod.tela.nombre, 'Tela Demo')
  assert.equal(prod.costo_tela, 0)
  assert.equal(prod.costo_base, 3000)
  assert.equal(prod.costo_estampado, 0)
  assert.equal(prod.costo_produccion, 3000)
  // Fallbacks config: mult 2.0, fijo 6000 => (3000 * 2.0) + 6000 = 12000
  assert.equal(prod.precio_venta, 12000)
})

test('recalcularCatalogoConConfig recalcula costos y precios de venta de todo el catálogo', () => {
  const algodon: Tela = {
    id: 1,
    nombre: 'Algodón',
    precio_kilo: 12000,
    rendimiento: 3,
    descripcion: '',
    precio_metro: 4000,
  }

  const productosIniciales: Producto[] = [
    {
      id: 1,
      nombre: 'Remera DTF',
      tela: algodon,
      tela_secundaria: null,
      consumo_metros: 0.8,
      consumo_metros_secundaria: 0,
      costo_confeccion: 2000,
      tipo_estampado: 'DTF',
      consumo_estampado: 0.5,
      nombre_avio: '',
      costo_avio: 0,
      costo_tela: 3200,
      costo_base: 5200,
      costo_estampado: 5000, // DTF a 10000
      costo_produccion: 10200,
      precio_venta: 26400, // (10200 * 2.0) + 6000
    },
    {
      id: 2,
      nombre: 'Buzo Liso',
      tela: algodon,
      tela_secundaria: null,
      consumo_metros: 1.5,
      consumo_metros_secundaria: 0,
      costo_confeccion: 4000,
      tipo_estampado: 'Ninguno',
      consumo_estampado: 0,
      nombre_avio: '',
      costo_avio: 0,
      costo_tela: 6000,
      costo_base: 10000,
      costo_estampado: 0,
      costo_produccion: 10000,
      precio_venta: 26000, // (10000 * 2.0) + 6000
    },
  ]

  // Nueva config con multiplicador 2.5, fijo 8000, y DTF actualizado a 12000
  const nuevaConfig: Configuracion = {
    costo_fijo: 8000,
    multiplicador: 2.5,
    precio_metro_dtf: 12000,
    precio_metro_sublimacion: 3000,
    precio_unidad_serigrafia: 1500,
    precio_unidad_bordado: 2500,
    descripcion_pdf: '',
  }

  const recalculados = recalcularCatalogoConConfig(productosIniciales, nuevaConfig)

  // Producto 1 (DTF):
  // costo_estampado nuevo = 0.5 * 12000 = 6000
  // costo_produccion nuevo = 5200 + 6000 = 11200
  // precio_venta nuevo = (11200 * 2.5) + 8000 = 28000 + 8000 = 36000
  assert.equal(recalculados[0].costo_estampado, 6000)
  assert.equal(recalculados[0].costo_produccion, 11200)
  assert.equal(recalculados[0].precio_venta, 36000)
  assert.equal(recalculados[0].nombre, 'Remera DTF')

  // Producto 2 (Liso):
  // costo_estampado nuevo = 0
  // costo_produccion nuevo = 10000
  // precio_venta nuevo = (10000 * 2.5) + 8000 = 25000 + 8000 = 33000
  assert.equal(recalculados[1].costo_estampado, 0)
  assert.equal(recalculados[1].costo_produccion, 10000)
  assert.equal(recalculados[1].precio_venta, 33000)
})

test('calcularTotalPresupuestoItems calcula prendas y total financiero', () => {
  const algodon: Tela = {
    id: 1,
    nombre: 'Algodón',
    precio_kilo: 12000,
    rendimiento: 3,
    descripcion: '',
    precio_metro: 4000,
  }

  const productos: Producto[] = [
    {
      id: 10,
      nombre: 'P1',
      costo_base: 4000,
      costo_estampado: 1000,
      precio_venta: 16000, // con mult=2, fijo=6000: (5000 * 2) + 6000 = 16000
      tela: algodon,
      tela_secundaria: null,
      consumo_metros: 1,
      consumo_metros_secundaria: 0,
      costo_confeccion: 0,
      tipo_estampado: '',
      consumo_estampado: 0,
      nombre_avio: '',
      costo_avio: 0,
      costo_tela: 4000,
      costo_produccion: 5000,
    },
    {
      id: 20,
      nombre: 'P2',
      costo_base: 8000,
      costo_estampado: 2000,
      precio_venta: 26000, // con mult=2, fijo=6000: (10000 * 2) + 6000 = 26000
      tela: algodon,
      tela_secundaria: null,
      consumo_metros: 1,
      consumo_metros_secundaria: 0,
      costo_confeccion: 0,
      tipo_estampado: '',
      consumo_estampado: 0,
      nombre_avio: '',
      costo_avio: 0,
      costo_tela: 8000,
      costo_produccion: 10000,
    },
  ]

  const items = [
    { producto_id: 10, cantidad: 4 },
    { producto_id: 20, cantidad: 3 },
    { producto_id: 999, cantidad: 10 }, // No existe en catálogo
  ]

  // Con mult=2, fijo=6000:
  // P1 unitario: (4000 + 1000) * 2 + 6000 = 16000 -> 4 * 16000 = 64000
  // P2 unitario: (8000 + 2000) * 2 + 6000 = 26000 -> 3 * 26000 = 78000
  // totalPrendas: 4 + 3 = 7
  // totalPrecio: 64000 + 78000 = 142000
  const resultado = calcularTotalPresupuestoItems(items, productos, 2.0, 6000)
  assert.equal(resultado.totalPrendas, 7)
  assert.equal(resultado.totalPrecio, 142000)

  // Items vacíos
  const vacio = calcularTotalPresupuestoItems([], productos, 2.0, 6000)
  assert.equal(vacio.totalPrendas, 0)
  assert.equal(vacio.totalPrecio, 0)
})
