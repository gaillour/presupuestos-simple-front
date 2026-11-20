import type {
  TiendaImportResult,
  TiendaProduct,
  TiendaResumen,
  TiendaVariant,
} from './types.ts'

function normalizeHeader(text: string): string {
  return (text || '')
    .replace(/^\uFEFF/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function slugify(text: string): string {
  return (text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function parseArFloat(raw: string): number | null {
  const trimmed = (raw || '').trim()
  if (!trimmed) return null
  let text = trimmed.replace(/[^\d,.\-]/g, '')
  if (!text || text === '-' || text === '.' || text === ',') return null

  if (text.includes(',') && text.includes('.')) {
    if (text.lastIndexOf(',') > text.lastIndexOf('.')) {
      text = text.replace(/\./g, '').replace(',', '.')
    } else {
      text = text.replace(/,/g, '')
    }
  } else if (text.includes(',')) {
    const parts = text.split(',')
    if (parts.length === 2 && (parts[1].length === 1 || parts[1].length === 2 || parts[1].length !== 3)) {
      text = text.replace(',', '.')
    } else {
      text = text.replace(/,/g, '')
    }
  } else if (text.includes('.')) {
    const parts = text.split('.')
    if (parts.length > 2) {
      text = parts.join('')
    } else if (parts.length === 2 && parts[1].length === 3 && parts[0].replace(/^-/, '') !== '0') {
      text = parts.join('')
    }
  }

  const num = Number(text)
  if (!Number.isFinite(num)) return null
  return Math.max(0, Math.round(num * 100) / 100)
}

function parseStock(raw: string): number {
  const val = parseArFloat(raw)
  if (val === null) return 0
  return Math.max(0, Math.round(val))
}

function parseBoolActivo(raw: string): boolean {
  const val = normalizeHeader(raw)
  if (!val) return true
  return !['no', 'false', '0', 'n', 'oculto', 'inactivo'].includes(val)
}

function cleanCategoria(raw: string): string {
  const text = (raw || '').trim()
  if (!text) return ''
  return text.split(/[>,]/)[0].trim()
}

function parseCsvRows(text: string, delimiter: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false
  const cleaned = text.replace(/^\uFEFF/, '')

  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i]
    const next = cleaned[i + 1]

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        cell += ch
      }
      continue
    }

    if (ch === '"') {
      inQuotes = true
    } else if (ch === delimiter) {
      row.push(cell)
      cell = ''
    } else if (ch === '\r' && next === '\n') {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
      i++
    } else if (ch === '\n' || ch === '\r') {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else {
      cell += ch
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell)
    rows.push(row)
  }

  return rows
}

function extractVariantAxes(
  p1NameRaw: string,
  p1ValRaw: string,
  p2NameRaw: string,
  p2ValRaw: string
): { talle: string; color_estampado: string } {
  const p1Name = normalizeHeader(p1NameRaw)
  const p1Val = (p1ValRaw || '').trim()
  const p2Name = normalizeHeader(p2NameRaw)
  const p2Val = (p2ValRaw || '').trim()

  const isTalle = (n: string) => n.includes('talle') || n.includes('size') || n.includes('talla')
  const isColor = (n: string) =>
    n.includes('color') || n.includes('estampa') || n.includes('modelo') || n.includes('variante') || n.includes('diseno')

  let talle = ''
  let color = ''
  let p1Used = false
  let p2Used = false

  if (p1Val) {
    if (isTalle(p1Name)) {
      talle = p1Val
      p1Used = true
    } else if (isColor(p1Name)) {
      color = p1Val
      p1Used = true
    }
  }

  if (p2Val) {
    if (isTalle(p2Name) && !talle) {
      talle = p2Val
      p2Used = true
    } else if (isColor(p2Name) && !color) {
      color = p2Val
      p2Used = true
    }
  }

  if (!talle && p1Val && !p1Used) {
    talle = p1Val
    p1Used = true
  }
  if (!color && p2Val && !p2Used) {
    color = p2Val
    p2Used = true
  }
  if (!color && p1Val && !p1Used) {
    color = p1Val
  }

  return {
    talle: talle || 'Único',
    color_estampado: color,
  }
}

export function recomputeTiendaProduct(
  producto: TiendaProduct,
  umbralUltimas: number = 2
): TiendaProduct {
  const variantes = [...producto.variantes].sort((a, b) => {
    const cmpT = a.talle.localeCompare(b.talle, 'es', { sensitivity: 'base' })
    if (cmpT !== 0) return cmpT
    return a.color_estampado.localeCompare(b.color_estampado, 'es', { sensitivity: 'base' })
  })
  const stock_total = variantes.reduce((acc, v) => acc + Math.max(0, Number(v.stock) || 0), 0)
  const sin_stock = stock_total === 0
  const es_ultimas_oportunidades = stock_total > 0 && stock_total <= umbralUltimas
  return {
    ...producto,
    variantes,
    stock_total,
    sin_stock,
    es_ultimas_oportunidades,
  }
}

export function buildTiendaResumen(
  productos: TiendaProduct[],
  umbralUltimas: number = 2,
  tiendanubeConectado: boolean = false
): TiendaResumen {
  let totalVariantes = 0
  let unidadesTotales = 0
  let productosUltimas = 0
  let variantesSinStock = 0
  let variantesPendientesSync = 0

  for (const rawProd of productos) {
    const p = recomputeTiendaProduct(rawProd, umbralUltimas)
    totalVariantes += p.variantes.length
    unidadesTotales += p.stock_total
    if (p.es_ultimas_oportunidades) {
      productosUltimas++
    }
    for (const v of p.variantes) {
      if (v.stock === 0) variantesSinStock++
      if (v.sync_status === 'pending_push') variantesPendientesSync++
    }
  }

  return {
    total_productos: productos.length,
    total_variantes: totalVariantes,
    unidades_totales: unidadesTotales,
    productos_ultimas_oportunidades: productosUltimas,
    variantes_sin_stock: variantesSinStock,
    variantes_pendientes_sync: variantesPendientesSync,
    tiendanube_conectado: tiendanubeConectado,
    store_id: null,
    last_full_sync_at: null,
    umbral_ultimas: umbralUltimas,
  }
}

export const TALLE_PRESETS = ['T0', 'T1', 'T2', 'T3', 'T4', 'T5'] as const

const TALLE_ORDER: Record<string, number> = {
  T0: 0,
  XS: 0,
  T1: 1,
  S: 1,
  T2: 2,
  M: 2,
  T3: 3,
  L: 3,
  T4: 4,
  XL: 4,
  T5: 5,
  XXL: 5,
}

export function sortTalles(a: string, b: string): number {
  const ua = a.trim().toUpperCase()
  const ub = b.trim().toUpperCase()
  const oa = TALLE_ORDER[ua] ?? 99
  const ob = TALLE_ORDER[ub] ?? 99
  if (oa !== ob) return oa - ob
  return ua.localeCompare(ub, 'es')
}

export function getMatrixTalleColumns(productos: TiendaProduct[]): {
  standardCols: string[]
  hasOtherCol: boolean
} {
  const base = ['T0', 'T1', 'T2', 'T3', 'T4']
  const found = new Set<string>()
  let hasT5 = false
  let hasOther = false

  for (const p of productos) {
    for (const v of p.variantes) {
      const upper = v.talle.trim().toUpperCase()
      if (base.includes(upper)) {
        found.add(upper)
      } else if (upper === 'T5') {
        hasT5 = true
      } else {
        hasOther = true
      }
    }
  }

  const standardCols = [...base]
  if (hasT5) standardCols.push('T5')
  return { standardCols, hasOtherCol: hasOther }
}

export function calcularTotalVenta(
  items: Array<{ cantidad: number; precio_unitario: number }>,
  descuentoTipo: 'porcentaje' | 'monto' | null,
  descuentoValor: number
): { subtotal: number; total: number } {
  const subtotal = Math.round(
    items.reduce((acc, it) => acc + Number(it.cantidad) * Number(it.precio_unitario), 0) * 100
  ) / 100
  let descuento = 0
  if (descuentoTipo === 'porcentaje' && descuentoValor > 0) {
    descuento = subtotal * (Math.min(descuentoValor, 100) / 100)
  } else if (descuentoTipo === 'monto' && descuentoValor > 0) {
    descuento = descuentoValor
  }
  const total = Math.max(0, Math.round((subtotal - descuento) * 100) / 100)
  return { subtotal, total }
}

export function calcularPrecioAjustado(
  precio: number,
  porcentaje: number,
  redondeo: number = 100
): number {
  const nuevo = Number(precio) * (1 + Number(porcentaje) / 100)
  if (!Number.isFinite(nuevo) || nuevo <= 0) return 0
  if (redondeo > 1) {
    return Math.round(nuevo / redondeo) * redondeo
  }
  return Math.round(nuevo * 100) / 100
}

export function parseTiendanubeCsvClient(
  csvText: string,
  existingProducts: TiendaProduct[],
  umbralUltimas: number = 2
): { productos: TiendaProduct[]; result: TiendaImportResult } {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (lines.length === 0) {
    return {
      productos: existingProducts,
      result: {
        productos_procesados: 0,
        variantes_procesadas: 0,
        errores: ['El archivo CSV está vacío.'],
      },
    }
  }

  const headerLine = lines[0]
  const semiCount = (headerLine.match(/;/g) || []).length
  const commaCount = (headerLine.match(/,/g) || []).length
  const delimiter = semiCount > commaCount ? ';' : ','

  const rows = parseCsvRows(csvText, delimiter)
  if (rows.length === 0) {
    return {
      productos: existingProducts,
      result: {
        productos_procesados: 0,
        variantes_procesadas: 0,
        errores: ['No se encontraron encabezados en el CSV.'],
      },
    }
  }

  const aliasToKey: Record<string, string> = {
    'identificador de url': 'slug',
    'url handle': 'slug',
    slug: 'slug',
    nombre: 'nombre',
    name: 'nombre',
    categorias: 'categoria',
    categories: 'categoria',
    categoria: 'categoria',
    category: 'categoria',
    'nombre de propiedad 1': 'prop1_name',
    'property name 1': 'prop1_name',
    'nombre propiedad 1': 'prop1_name',
    'valor de propiedad 1': 'prop1_val',
    'property value 1': 'prop1_val',
    'valor propiedad 1': 'prop1_val',
    'nombre de propiedad 2': 'prop2_name',
    'property name 2': 'prop2_name',
    'nombre propiedad 2': 'prop2_name',
    'valor de propiedad 2': 'prop2_val',
    'property value 2': 'prop2_val',
    'valor propiedad 2': 'prop2_val',
    precio: 'precio',
    price: 'precio',
    'precio promocional': 'precio_promocional',
    'promotional price': 'precio_promocional',
    stock: 'stock',
    sku: 'sku',
    'mostrar en tienda': 'activo',
    'show in store': 'activo',
  }

  const colIndices: Record<string, number> = {}
  rows[0].forEach((rawHeader, idx) => {
    const key = aliasToKey[normalizeHeader(rawHeader)]
    if (key && colIndices[key] === undefined) {
      colIndices[key] = idx
    }
  })

  if (colIndices.nombre === undefined && colIndices.slug === undefined) {
    return {
      productos: existingProducts,
      result: {
        productos_procesados: 0,
        variantes_procesadas: 0,
        errores: [
          'Encabezados no reconocidos. Asegurate de subir el CSV exportado desde Tiendanube (Identificador de URL / Nombre / Precio / Stock).',
        ],
      },
    }
  }

  let nextProdId = existingProducts.reduce((m, p) => Math.max(m, p.id), 1000) + 1
  let nextVarId =
    existingProducts.reduce(
      (m, p) => Math.max(m, ...p.variantes.map((v) => v.id), 0),
      5000
    ) + 1

  const mergedBySlug = new Map<string, TiendaProduct>()
  for (const p of existingProducts) {
    mergedBySlug.set(p.slug, {
      ...p,
      variantes: p.variantes.map((v) => ({ ...v })),
    })
  }

  const processedSlugs = new Set<string>()
  const processedVariants = new Set<string>()
  const errores: string[] = []
  let lastSlug: string | null = null
  const nowIso = new Date().toISOString()

  for (let rIdx = 1; rIdx < rows.length; rIdx++) {
    const cells = rows[rIdx]
    if (!cells.some((c) => c.trim().length > 0)) continue

    const getCell = (key: string): string => {
      const idx = colIndices[key]
      if (idx === undefined || idx >= cells.length) return ''
      return (cells[idx] || '').trim()
    }

    const rawSlug = getCell('slug')
    const rawNombre = getCell('nombre')
    const slug: string = rawSlug
      ? slugify(rawSlug)
      : rawNombre
        ? slugify(rawNombre)
        : lastSlug || ''

    if (!slug) {
      errores.push(`Fila ${rIdx + 1}: falta Identificador de URL y Nombre.`)
      continue
    }

    let prod = mergedBySlug.get(slug)
    if (!prod && !rawNombre) {
      errores.push(`Fila ${rIdx + 1}: el producto '${slug}' no tiene Nombre definido.`)
      continue
    }

    lastSlug = slug
    if (!prod) {
      const cat = cleanCategoria(getCell('categoria'))
      const activo = parseBoolActivo(getCell('activo'))
      prod = {
        id: nextProdId++,
        tiendanube_id: null,
        slug,
        nombre: rawNombre,
        categoria: cat,
        category_ids: [],
        categorias_nombres: cat ? [cat] : [],
        images: [],
        linked_producto_id: null,
        activo,
        published: activo,
        last_synced_at: null,
        stock_total: 0,
        es_ultimas_oportunidades: false,
        sin_stock: true,
        variantes: [],
      }
      mergedBySlug.set(slug, prod)
    } else {
      if (rawNombre) prod.nombre = rawNombre
      const cat = cleanCategoria(getCell('categoria'))
      if (cat && !prod.categoria) prod.categoria = cat
    }

    processedSlugs.add(slug)

    const { talle, color_estampado } = extractVariantAxes(
      getCell('prop1_name'),
      getCell('prop1_val'),
      getCell('prop2_name'),
      getCell('prop2_val')
    )
    const precio = parseArFloat(getCell('precio')) ?? 0
    const promoRaw = parseArFloat(getCell('precio_promocional'))
    const precio_promocional = promoRaw !== null && promoRaw > 0 ? promoRaw : null
    const stock = parseStock(getCell('stock'))
    const sku = getCell('sku')

    const existingVarIdx = prod.variantes.findIndex(
      (v) => v.talle === talle && v.color_estampado === color_estampado
    )

    if (existingVarIdx >= 0) {
      const current = prod.variantes[existingVarIdx]
      prod.variantes[existingVarIdx] = {
        ...current,
        sku,
        stock,
        precio,
        precio_promocional,
        sync_status: 'local_only',
        updated_at: nowIso,
      }
    } else {
      const newVar: TiendaVariant = {
        id: nextVarId++,
        tienda_product_id: prod.id,
        tiendanube_variant_id: null,
        sku,
        talle,
        color_estampado,
        stock,
        precio,
        precio_promocional,
        sync_status: 'local_only',
        updated_at: nowIso,
      }
      prod.variantes.push(newVar)
    }

    processedVariants.add(`${slug}::${talle}::${color_estampado}`)
  }

  const finalProducts = Array.from(mergedBySlug.values())
    .map((p) => recomputeTiendaProduct(p, umbralUltimas))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }))

  return {
    productos: finalProducts,
    result: {
      productos_procesados: processedSlugs.size,
      variantes_procesadas: processedVariants.size,
      errores,
    },
  }
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const res = typeof reader.result === 'string' ? reader.result : ''
      const base64 = res.includes('base64,') ? res.split('base64,')[1] : res
      resolve(base64)
    }
    reader.onerror = () => reject(new Error('No se pudo leer el archivo CSV.'))
    reader.readAsDataURL(file)
  })
}
