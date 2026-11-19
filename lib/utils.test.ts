import test from 'node:test'
import assert from 'node:assert/strict'
import { getApiBase, getGreetingName, isTokenExpired, money } from './utils.ts'

test('money formatea valores numéricos a moneda ARS', () => {
  const formatted = money.format(1234.5)
  assert.match(formatted, /\$/)
  assert.match(formatted, /1\.234,50/)
  assert.equal(money.resolvedOptions().currency, 'ARS')
  assert.equal(money.resolvedOptions().style, 'currency')
})

test('getGreetingName devuelve el nombre adecuado según reglas', () => {
  // Demo siempre Administrador
  assert.equal(getGreetingName('romi@empresa.com', true), 'Administrador')

  // Casos administrador por defecto
  assert.equal(getGreetingName(''), 'Administrador')
  assert.equal(getGreetingName('admin'), 'Administrador')
  assert.equal(getGreetingName('administrador'), 'Administrador')
  assert.equal(getGreetingName('admin@empresa.com'), 'Administrador')

  // Reglas por palabras clave
  assert.equal(getGreetingName('romina@test.com'), 'Romi')
  assert.equal(getGreetingName('iara@test.com'), 'Iara')
  assert.equal(getGreetingName('juan@test.com'), 'Juani')
  assert.equal(getGreetingName('juani@test.com'), 'Juani')

  // Caso estándar (capitalizar primera letra del localPart)
  assert.equal(getGreetingName('lucas@test.com'), 'Lucas')
})

test('getApiBase resuelve URLs según variables de entorno', () => {
  const origApiUrl = process.env.NEXT_PUBLIC_API_URL
  const origNodeEnv = process.env.NODE_ENV
  const env = process.env as Record<string, string | undefined>

  try {
    delete process.env.NEXT_PUBLIC_API_URL

    env.NODE_ENV = 'development'
    assert.equal(getApiBase(), 'http://localhost:8000')

    env.NODE_ENV = 'production'
    assert.equal(getApiBase(), 'https://presupuestos-simple.fly.dev')

    process.env.NEXT_PUBLIC_API_URL = 'https://custom-api.com/api/'
    assert.equal(getApiBase(), 'https://custom-api.com')

    process.env.NEXT_PUBLIC_API_URL = 'https://custom-api.com/api'
    assert.equal(getApiBase(), 'https://custom-api.com')

    process.env.NEXT_PUBLIC_API_URL = 'https://custom-api.com'
    assert.equal(getApiBase(), 'https://custom-api.com')
  } finally {
    if (origApiUrl !== undefined) {
      process.env.NEXT_PUBLIC_API_URL = origApiUrl
    } else {
      delete process.env.NEXT_PUBLIC_API_URL
    }
    env.NODE_ENV = origNodeEnv
  }
})

test('isTokenExpired detecta tokens vacíos, inválidos y expiración con margen', () => {
  function makeJwt(payload: Record<string, unknown>): string {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
    return `${header}.${body}.signature`
  }

  // Token vacío es considerado expirado
  assert.equal(isTokenExpired(''), true)

  // Tokens malformados o no parseables
  assert.equal(isTokenExpired('invalid-token'), false)
  assert.equal(isTokenExpired('a.invalid_json{}.c'), false)

  // Token sin campo exp
  assert.equal(isTokenExpired(makeJwt({ sub: 'user123' })), false)

  const nowSec = Math.floor(Date.now() / 1000)

  // Token ya expirado
  assert.equal(isTokenExpired(makeJwt({ exp: nowSec - 100 })), true)

  // Token por expirar dentro del umbral de 30 segundos (ej. dentro de 10s)
  assert.equal(isTokenExpired(makeJwt({ exp: nowSec + 10 })), true)

  // Token válido a futuro (ej. en 1 hora)
  assert.equal(isTokenExpired(makeJwt({ exp: nowSec + 3600 })), false)
})
