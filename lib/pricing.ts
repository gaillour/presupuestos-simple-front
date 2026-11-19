import type { Configuracion, Producto, Tela, TipoEstampado } from './types'

export const TECNICAS_BASE_NOMBRES = ['dtf', 'sublimacion', 'serigrafia', 'bordado']

export function normalizarTecnica(texto: string): string {
  return (texto || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function obtenerTecnicasEstampado(
  config: Configuracion | null,
  tiposDirectos?: TipoEstampado[] | null
): TipoEstampado[] {
  const baseDefaults: Array<{ nombre: string; clave: string; costo: number }> = [
    { nombre: 'DTF', clave: 'dtf', costo: config?.precio_metro_dtf ?? 10000 },
    { nombre: 'Sublimación', clave: 'sublimacion', costo: config?.precio_metro_sublimacion ?? 2900 },
    { nombre: 'Serigrafía', clave: 'serigrafia', costo: config?.precio_unidad_serigrafia ?? 1500 },
    { nombre: 'Bordado', clave: 'bordado', costo: config?.precio_unidad_bordado ?? 0 },
  ]

  const fuente =
    Array.isArray(tiposDirectos) && tiposDirectos.length > 0
      ? tiposDirectos
      : Array.isArray(config?.tipos_estampado)
        ? config!.tipos_estampado!
        : []

  if (fuente.length === 0) {
    return baseDefaults.map((b, idx) => ({
      id: idx + 1,
      nombre: b.nombre,
      costo: b.costo,
    }))
  }

  const resultado: TipoEstampado[] = fuente.map((item, idx) => ({
    id: item.id ?? idx + 1,
    nombre: item.nombre,
    costo: Number(item.costo ?? 0),
  }))

  const presentes = new Set(resultado.map((t) => normalizarTecnica(t.nombre)))
  let maxId = resultado.reduce((acc, item) => Math.max(acc, item.id || 0), 0)

  for (const base of baseDefaults) {
    if (!presentes.has(base.clave)) {
      maxId += 1
      resultado.push({
        id: maxId,
        nombre: base.nombre,
        costo: base.costo,
      })
    }
  }

  return resultado
}

export function calcularCostoEstampadoDesdeConfig(
  tipoEstampado: string,
  consumoEstampado: number,
  config: Configuracion | null,
  tiposDirectos?: TipoEstampado[] | null
): number {
  if (!tipoEstampado || tipoEstampado === 'Ninguno' || consumoEstampado <= 0) {
    return 0
  }
  const clave = normalizarTecnica(tipoEstampado)
  const tecnicas = obtenerTecnicasEstampado(config, tiposDirectos)
  const encontrada = tecnicas.find((t) => normalizarTecnica(t.nombre) === clave)
  if (encontrada) {
    return consumoEstampado * Number(encontrada.costo || 0)
  }
  return 0
}

export function calcularPrecioMetroTela(tela: Pick<Tela, 'precio_kilo' | 'rendimiento' | 'precio_metro'> | undefined | null): number {
  if (!tela) return 0
  if (typeof tela.precio_metro === 'number' && tela.precio_metro > 0) {
    return tela.precio_metro
  }
  if (tela.rendimiento > 0) {
    return tela.precio_kilo / tela.rendimiento
  }
  return 0
}

export function calcularCostoTelaCombinada(
  telaPrincipal: Pick<Tela, 'precio_kilo' | 'rendimiento' | 'precio_metro'> | undefined | null,
  consumoPrincipal: number,
  telaSecundaria?: Pick<Tela, 'precio_kilo' | 'rendimiento' | 'precio_metro'> | undefined | null,
  consumoSecundaria: number = 0
): number {
  const costoPrincipal = calcularPrecioMetroTela(telaPrincipal) * Math.max(0, consumoPrincipal || 0)
  const costoSecundario =
    telaSecundaria && consumoSecundaria > 0
      ? calcularPrecioMetroTela(telaSecundaria) * consumoSecundaria
      : 0
  return costoPrincipal + costoSecundario
}

export function calcularPrecioUnitarioProducto(
  prod: Pick<Producto, 'costo_base' | 'costo_estampado' | 'precio_venta'> | undefined,
  multiplicador: number,
  costoFijo: number
): number {
  if (!prod) return 0
  if (typeof prod.costo_base === 'number') {
    return (prod.costo_base + (prod.costo_estampado || 0)) * multiplicador + costoFijo
  }
  return prod.precio_venta || 0
}

export function construirProductoCalculado(
  id: number,
  data: {
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
  },
  telas: Tela[],
  config: Configuracion | null,
  tiposEstampado?: TipoEstampado[]
): Producto {
  const telaObj: Tela = telas.find((t) => t.id === data.tela_id) || {
    id: data.tela_id,
    nombre: 'Tela Demo',
    descripcion: '',
    precio_kilo: 0,
    rendimiento: 1,
    precio_metro: 0,
  }
  const telaSecObj: Tela | null =
    data.tela_secundaria_id && data.consumo_metros_secundaria > 0
      ? telas.find((t) => t.id === data.tela_secundaria_id) || null
      : null

  const costoTela = calcularCostoTelaCombinada(
    telaObj,
    data.consumo_metros,
    telaSecObj,
    telaSecObj ? data.consumo_metros_secundaria : 0
  )
  const costoBase = costoTela + data.costo_confeccion + data.costo_avio
  const costoEst = calcularCostoEstampadoDesdeConfig(
    data.tipo_estampado,
    data.consumo_estampado,
    config,
    tiposEstampado
  )
  const mult = config?.multiplicador ?? 2.0
  const fijo = config?.costo_fijo ?? 6000
  const costoProduccion = costoBase + costoEst
  const precioVenta = costoProduccion * mult + fijo

  return {
    id,
    ...data,
    tela: telaObj,
    tela_secundaria: telaSecObj,
    consumo_metros_secundaria: telaSecObj ? data.consumo_metros_secundaria : 0,
    costo_tela: costoTela,
    costo_base: costoBase,
    costo_estampado: costoEst,
    costo_produccion: costoProduccion,
    precio_venta: precioVenta,
  }
}

export function recalcularCatalogoConConfig(
  productos: Producto[],
  config: Configuracion,
  tiposEstampado?: TipoEstampado[]
): Producto[] {
  const mult = config.multiplicador ?? 2.0
  const fijo = config.costo_fijo ?? 6000
  const tecnicas = tiposEstampado ?? config.tipos_estampado

  return productos.map((p) => {
    const cEst = calcularCostoEstampadoDesdeConfig(
      p.tipo_estampado,
      p.consumo_estampado,
      config,
      tecnicas
    )
    const costoBase = p.costo_base ?? 0
    const costoProduccion = costoBase + cEst
    const precioVenta = costoProduccion * mult + fijo
    return {
      ...p,
      costo_estampado: cEst,
      costo_produccion: costoProduccion,
      precio_venta: precioVenta,
    }
  })
}

export function calcularTotalPresupuestoItems(
  items: Array<{ producto_id: number; cantidad: number }>,
  productos: Producto[],
  multiplicador: number,
  costoFijo: number
): { totalPrendas: number; totalPrecio: number } {
  let totalPrendas = 0
  let totalPrecio = 0

  for (const it of items) {
    const p = productos.find((prod) => prod.id === it.producto_id)
    if (p) {
      totalPrendas += it.cantidad
      totalPrecio += calcularPrecioUnitarioProducto(p, multiplicador, costoFijo) * it.cantidad
    }
  }

  return { totalPrendas, totalPrecio }
}
