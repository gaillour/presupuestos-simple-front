import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildTiendaResumen,
  calcularPrecioAjustado,
  calcularTotalVenta,
  getMatrixTalleColumns,
  parseTiendanubeCsvClient,
} from './tienda-utils.ts'
import type { TiendaProduct } from './types.ts'

test('calcularPrecioAjustado aplica porcentaje y redondeo configurable', () => {
  assert.equal(calcularPrecioAjustado(20000, 15, 100), 23000)
  assert.equal(calcularPrecioAjustado(24500, 10, 500), 27000)
  assert.equal(calcularPrecioAjustado(10000, -10, 500), 9000)
  assert.equal(calcularPrecioAjustado(1234, 10, 1), 1357.4)
})

test('parseTiendanubeCsvClient parsea CSV con coma, precios AR y filas múltiples', () => {
  const csv = [
    'Identificador de URL,Nombre,Categorías,Nombre de propiedad 1,Valor de propiedad 1,Nombre de propiedad 2,Valor de propiedad 2,Precio,Precio promocional,Stock,SKU,Mostrar en tienda',
    'bikini-mdq,Bikini Triángulo MDQ,"Trajes de Baño > Bikinis, Verano",Talle,T1,Color,Negro,"$ 24.500,00","19.900,00",2,BIK-1,SI',
    'bikini-mdq,,,Talle,T2,Color,Negro,"$ 24.500,00",,0,BIK-2,SI',
  ].join('\n')

  const { productos, result } = parseTiendanubeCsvClient(csv, [], 2)
  assert.deepEqual(result.errores, [])
  assert.equal(result.productos_procesados, 1)
  assert.equal(result.variantes_procesadas, 2)
  assert.equal(productos.length, 1)

  const prod = productos[0]
  assert.equal(prod.nombre, 'Bikini Triángulo MDQ')
  assert.equal(prod.categoria, 'Trajes de Baño')
  assert.equal(prod.stock_total, 2)
  assert.equal(prod.es_ultimas_oportunidades, true)
  assert.equal(prod.sin_stock, false)
  assert.equal(prod.variantes[0].precio, 24500)
  assert.equal(prod.variantes[0].precio_promocional, 19900)
  assert.equal(prod.variantes[1].stock, 0)
})

test('parseTiendanubeCsvClient soporta separador punto y coma y ejes invertidos', () => {
  const csv = [
    'Identificador de URL;Nombre;Categorías;Nombre de propiedad 1;Valor de propiedad 1;Nombre de propiedad 2;Valor de propiedad 2;Precio;Stock;SKU',
    'enteriza-coral;Enteriza Coral;Enterizas;Estampa;Flores;Talle;M;32000,50;3;ENT-M',
  ].join('\n')

  const { productos, result } = parseTiendanubeCsvClient(csv, [], 2)
  assert.deepEqual(result.errores, [])
  assert.equal(productos[0].variantes[0].talle, 'M')
  assert.equal(productos[0].variantes[0].color_estampado, 'Flores')
  assert.equal(productos[0].variantes[0].precio, 32000.5)
})

test('buildTiendaResumen calcula métricas globales de stock, remanentes y sync', () => {
  const sample: TiendaProduct[] = [
    {
      id: 1,
      tiendanube_id: null,
      slug: 'a',
      nombre: 'Producto A',
      categoria: 'Bikinis',
      category_ids: [],
      categorias_nombres: ['Bikinis'],
      images: [],
      linked_producto_id: null,
      activo: true,
      published: true,
      last_synced_at: null,
      stock_total: 0,
      es_ultimas_oportunidades: false,
      sin_stock: false,
      variantes: [
        {
          id: 11,
          tienda_product_id: 1,
          tiendanube_variant_id: null,
          sku: 'A1',
          talle: 'T1',
          color_estampado: 'Negro',
          stock: 2,
          precio: 20000,
          precio_promocional: null,
          sync_status: 'pending_push',
          updated_at: '2026-11-19T10:00:00Z',
        },
        {
          id: 12,
          tienda_product_id: 1,
          tiendanube_variant_id: null,
          sku: 'A2',
          talle: 'T2',
          color_estampado: 'Negro',
          stock: 0,
          precio: 20000,
          precio_promocional: null,
          sync_status: 'local_only',
          updated_at: '2026-11-19T10:00:00Z',
        },
      ],
    },
  ]

  const resumen = buildTiendaResumen(sample, 2, false)
  assert.equal(resumen.total_productos, 1)
  assert.equal(resumen.total_variantes, 2)
  assert.equal(resumen.unidades_totales, 2)
  assert.equal(resumen.productos_ultimas_oportunidades, 1)
  assert.equal(resumen.variantes_sin_stock, 1)
  assert.equal(resumen.variantes_pendientes_sync, 1)
  assert.equal(resumen.tiendanube_conectado, false)
})

test('calcularTotalVenta aplica descuento porcentaje y monto correctamente', () => {
  const items = [
    { cantidad: 2, precio_unitario: 25000 },
    { cantidad: 1, precio_unitario: 10000 },
  ]
  assert.deepEqual(calcularTotalVenta(items, null, 0), { subtotal: 60000, total: 60000 })
  assert.deepEqual(calcularTotalVenta(items, 'porcentaje', 15), { subtotal: 60000, total: 51000 })
  assert.deepEqual(calcularTotalVenta(items, 'monto', 5000), { subtotal: 60000, total: 55000 })
})

test('getMatrixTalleColumns detecta T5 y otros talles especiales', () => {
  const cols = getMatrixTalleColumns([
    {
      id: 1,
      tiendanube_id: null,
      slug: 'x',
      nombre: 'X',
      categoria: '',
      category_ids: [],
      categorias_nombres: [],
      images: [],
      linked_producto_id: null,
      activo: true,
      published: true,
      last_synced_at: null,
      stock_total: 1,
      es_ultimas_oportunidades: true,
      sin_stock: false,
      variantes: [
        {
          id: 1,
          tienda_product_id: 1,
          tiendanube_variant_id: null,
          sku: 'X-T5',
          talle: 'T5',
          color_estampado: '',
          stock: 1,
          precio: 1000,
          precio_promocional: null,
          sync_status: 'synced',
          updated_at: '',
        },
        {
          id: 2,
          tienda_product_id: 1,
          tiendanube_variant_id: null,
          sku: 'X-U',
          talle: 'Único',
          color_estampado: '',
          stock: 1,
          precio: 1000,
          precio_promocional: null,
          sync_status: 'synced',
          updated_at: '',
        },
      ],
    },
  ])
  assert.deepEqual(cols.standardCols, ['T0', 'T1', 'T2', 'T3', 'T4', 'T5'])
  assert.equal(cols.hasOtherCol, true)
})
