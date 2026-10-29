import type { Configuracion, Producto, Tela, TipoEstampado } from './types'

export const TECNICAS_BASE_NOMBRES = ['dtf', 'sublimacion', 'serigrafia', 'bordado']

export function normalizarTecnica(texto: string): string {
  return (texto || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function obtenerTecnicasEstampado(config: Configuracion | null): TipoEstampado[] {
  const baseDefaults: Array<{ nombre: string; clave: string; costo: number }> = [
    { nombre: 'DTF', clave: 'dtf', costo: config?.precio_metro_dtf ?? 10000 },
    { nombre: 'Sublimación', clave: 'sublimacion', costo: config?.precio_metro_sublimacion ?? 2900 },
    { nombre: 'Serigrafía', clave: 'serigrafia', costo: config?.precio_unidad_serigrafia ?? 1500 },
    { nombre: 'Bordado', clave: 'bordado', costo: config?.precio_unidad_bordado ?? 0 },
  ]

  const desdeApi = Array.isArray(config?.tipos_estampado) ? config!.tipos_estampado! : []
  if (desdeApi.length === 0) {
    return baseDefaults.map((b, idx) => ({
      id: idx + 1,
      nombre: b.nombre,
      costo: b.costo,
    }))
  }

  const resultado: TipoEstampado[] = desdeApi.map((item, idx) => ({
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
  config: Configuracion | null
): number {
  if (!tipoEstampado || tipoEstampado === 'Ninguno' || consumoEstampado <= 0) {
    return 0
  }
  const clave = normalizarTecnica(tipoEstampado)
  const tecnicas = obtenerTecnicasEstampado(config)
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
    return prod.costo_base * multiplicador + costoFijo + (prod.costo_estampado || 0)
  }
  return prod.precio_venta || 0
}
