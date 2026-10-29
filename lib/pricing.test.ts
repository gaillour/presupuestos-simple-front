import test from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizarTecnica,
  obtenerTecnicasEstampado,
  calcularCostoEstampadoDesdeConfig,
  calcularCostoTelaCombinada,
  calcularPrecioUnitarioProducto,
} from './pricing.ts'
import type { Configuracion, Tela } from './types.ts'

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

  // Costo base = 7000, mult = 2.5, fijo = 5000, estampa = 4200 => (7000 * 2.5) + 5000 + 4200 = 26700
  const precioUnit = calcularPrecioUnitarioProducto(
    { costo_base: 7000, costo_estampado: costoEst, precio_venta: 0 },
    2.5,
    5000
  )
  assert.equal(precioUnit, 26700)
})
