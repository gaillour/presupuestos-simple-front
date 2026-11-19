import test from 'node:test'
import assert from 'node:assert/strict'
import { apiRequest, ApiError, getPresupuestoPdfUrl } from './client.ts'
import { API_BASE } from '../utils.ts'

test('apiRequest realiza GET correctamente y devuelve JSON parseado', async () => {
  const originalFetch = globalThis.fetch
  const mockData = [{ id: 1, nombre: 'Algodón' }]

  globalThis.fetch = async (url, init) => {
    assert.equal(url, `${API_BASE}/api/telas`)
    assert.equal(init?.method, 'GET')
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () => JSON.stringify(mockData),
      json: async () => mockData,
    } as unknown as Response
  }

  try {
    const result = await apiRequest<typeof mockData>('/api/telas')
    assert.deepEqual(result, mockData)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('apiRequest incluye body JSON y header Authorization cuando se especifican', async () => {
  const originalFetch = globalThis.fetch
  let capturedUrl = ''
  let capturedInit: RequestInit | undefined

  globalThis.fetch = async (url, init) => {
    capturedUrl = String(url)
    capturedInit = init
    return {
      ok: true,
      status: 201,
      statusText: 'Created',
      text: async () => JSON.stringify({ success: true }),
      json: async () => ({ success: true }),
    } as unknown as Response
  }

  try {
    const payload = { nombre: 'Piqué', precio_kilo: 5000 }
    const result = await apiRequest<{ success: boolean }>('/api/telas', {
      method: 'POST',
      token: 'jwt-test-token',
      body: payload,
    })

    assert.equal(capturedUrl, `${API_BASE}/api/telas`)
    assert.equal(capturedInit?.method, 'POST')
    const headers = capturedInit?.headers as Record<string, string>
    assert.equal(headers['Authorization'], 'Bearer jwt-test-token')
    assert.equal(headers['Content-Type'], 'application/json')
    assert.equal(capturedInit?.body, JSON.stringify(payload))
    assert.deepEqual(result, { success: true })
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('apiRequest maneja status 401 ejecutando onUnauthorized y lanzando ApiError con isUnauthorized true', async () => {
  const originalFetch = globalThis.fetch
  let unauthorizedCalled = false

  globalThis.fetch = async () => {
    return {
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: async () => JSON.stringify({ detail: 'Token expirado' }),
      json: async () => ({ detail: 'Token expirado' }),
    } as unknown as Response
  }

  try {
    await assert.rejects(
      async () => {
        await apiRequest('/api/privado', {
          token: 'expired-token',
          onUnauthorized: () => {
            unauthorizedCalled = true
          },
        })
      },
      (err: unknown) => {
        assert(err instanceof ApiError)
        assert.equal(err.status, 401)
        assert.equal(err.isUnauthorized, true)
        assert.equal(err.message, 'Token expirado')
        return true
      }
    )
    assert.equal(unauthorizedCalled, true)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('apiRequest maneja status 403 ejecutando onUnauthorized y lanzando ApiError con isUnauthorized true', async () => {
  const originalFetch = globalThis.fetch
  let unauthorizedCalled = false

  globalThis.fetch = async () => {
    return {
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      text: async () => JSON.stringify({ detail: 'Acceso denegado' }),
      json: async () => ({ detail: 'Acceso denegado' }),
    } as unknown as Response
  }

  try {
    await assert.rejects(
      async () => {
        await apiRequest('/api/privado', {
          token: 'forbidden-token',
          onUnauthorized: () => {
            unauthorizedCalled = true
          },
        })
      },
      (err: unknown) => {
        assert(err instanceof ApiError)
        assert.equal(err.status, 403)
        assert.equal(err.isUnauthorized, true)
        assert.equal(err.message, 'Acceso denegado')
        return true
      }
    )
    assert.equal(unauthorizedCalled, true)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('apiRequest maneja status de error no autorizado (500/400) parseando detail y con isUnauthorized false', async () => {
  const originalFetch = globalThis.fetch

  globalThis.fetch = async () => {
    return {
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      text: async () => JSON.stringify({ detail: 'Datos inválidos' }),
      json: async () => ({ detail: 'Datos inválidos' }),
    } as unknown as Response
  }

  try {
    await assert.rejects(
      async () => {
        await apiRequest('/api/recurso')
      },
      (err: unknown) => {
        assert(err instanceof ApiError)
        assert.equal(err.status, 400)
        assert.equal(err.isUnauthorized, false)
        assert.equal(err.message, 'Datos inválidos')
        return true
      }
    )
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('apiRequest tolera respuesta 204 No Content', async () => {
  const originalFetch = globalThis.fetch

  globalThis.fetch = async () => {
    return {
      ok: true,
      status: 204,
      statusText: 'No Content',
      text: async () => '',
      json: async () => {
        throw new Error('Unexpected JSON')
      },
    } as unknown as Response
  }

  try {
    const res = await apiRequest<void>('/api/telas/1', { method: 'DELETE' })
    assert.equal(res, undefined)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('getPresupuestoPdfUrl construye URLs válidas con y sin token', () => {
  const urlSinToken = getPresupuestoPdfUrl(42)
  assert.equal(urlSinToken, `${API_BASE}/api/presupuestos/42/pdf`)

  const urlConToken = getPresupuestoPdfUrl(42, 'mi-token-123')
  assert.equal(urlConToken, `${API_BASE}/api/presupuestos/42/pdf?token=mi-token-123`)
})
