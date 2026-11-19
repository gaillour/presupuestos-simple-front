import { apiRequest } from './client.ts'
import type {
  Tela,
  TelaMutationInput,
  Producto,
  ProductoMutationInput,
  Presupuesto,
  PresupuestoDetalle,
  PresupuestoCreatePayload,
  Configuracion,
  ConfiguracionUpdatePayload,
  TipoEstampado,
} from '../types'

export const authService = {
  login(email: string, password: string): Promise<{ access_token: string; user?: { email?: string } }> {
    return apiRequest<{ access_token: string; user?: { email?: string } }>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    })
  },
}

export const telasService = {
  list(token: string, onUnauthorized?: () => void): Promise<Tela[]> {
    return apiRequest<Tela[]>('/api/telas', {
      method: 'GET',
      token,
      onUnauthorized,
    })
  },

  create(data: TelaMutationInput, token: string, onUnauthorized?: () => void): Promise<Tela> {
    return apiRequest<Tela>('/api/telas', {
      method: 'POST',
      token,
      body: data,
      onUnauthorized,
    })
  },

  update(id: number, data: TelaMutationInput, token: string, onUnauthorized?: () => void): Promise<Tela> {
    return apiRequest<Tela>(`/api/telas/${id}`, {
      method: 'PUT',
      token,
      body: data,
      onUnauthorized,
    })
  },

  remove(id: number, token: string, onUnauthorized?: () => void): Promise<void> {
    return apiRequest<void>(`/api/telas/${id}`, {
      method: 'DELETE',
      token,
      onUnauthorized,
    })
  },
}

export const productosService = {
  list(token: string, onUnauthorized?: () => void): Promise<Producto[]> {
    return apiRequest<Producto[]>('/api/productos', {
      method: 'GET',
      token,
      onUnauthorized,
    })
  },

  create(data: ProductoMutationInput, token: string, onUnauthorized?: () => void): Promise<Producto> {
    return apiRequest<Producto>('/api/productos', {
      method: 'POST',
      token,
      body: data,
      onUnauthorized,
    })
  },

  update(id: number, data: ProductoMutationInput, token: string, onUnauthorized?: () => void): Promise<Producto> {
    return apiRequest<Producto>(`/api/productos/${id}`, {
      method: 'PUT',
      token,
      body: data,
      onUnauthorized,
    })
  },

  remove(id: number, token: string, onUnauthorized?: () => void): Promise<void> {
    return apiRequest<void>(`/api/productos/${id}`, {
      method: 'DELETE',
      token,
      onUnauthorized,
    })
  },
}

export const presupuestosService = {
  list(token: string, onUnauthorized?: () => void): Promise<Presupuesto[]> {
    return apiRequest<Presupuesto[]>('/api/presupuestos', {
      method: 'GET',
      token,
      onUnauthorized,
    })
  },

  getById(id: number, token: string, onUnauthorized?: () => void): Promise<PresupuestoDetalle> {
    return apiRequest<PresupuestoDetalle>(`/api/presupuestos/${id}`, {
      method: 'GET',
      token,
      onUnauthorized,
    })
  },

  create(payload: PresupuestoCreatePayload, token: string, onUnauthorized?: () => void): Promise<Presupuesto> {
    return apiRequest<Presupuesto>('/api/presupuestos', {
      method: 'POST',
      token,
      body: payload,
      onUnauthorized,
    })
  },

  remove(id: number, token: string, onUnauthorized?: () => void): Promise<void> {
    return apiRequest<void>(`/api/presupuestos/${id}`, {
      method: 'DELETE',
      token,
      onUnauthorized,
    })
  },
}

export const configuracionService = {
  get(token: string, onUnauthorized?: () => void): Promise<Configuracion> {
    return apiRequest<Configuracion>('/api/configuracion', {
      method: 'GET',
      token,
      onUnauthorized,
    })
  },

  update(payload: ConfiguracionUpdatePayload, token: string, onUnauthorized?: () => void): Promise<void> {
    return apiRequest<void>('/api/configuracion', {
      method: 'PUT',
      token,
      body: payload,
      onUnauthorized,
    })
  },

  listTiposEstampado(token: string, onUnauthorized?: () => void): Promise<TipoEstampado[]> {
    return apiRequest<TipoEstampado[]>('/api/tipos-estampado', {
      method: 'GET',
      token,
      onUnauthorized,
    })
  },

  createTipoEstampado(
    data: { nombre: string; costo: number },
    token: string,
    onUnauthorized?: () => void
  ): Promise<{ tipos_estampado?: TipoEstampado[]; tipo_estampado?: TipoEstampado }> {
    return apiRequest<{ tipos_estampado?: TipoEstampado[]; tipo_estampado?: TipoEstampado }>('/api/tipos-estampado', {
      method: 'POST',
      token,
      body: data,
      onUnauthorized,
    })
  },

  deleteTipoEstampado(
    id: number,
    token: string,
    onUnauthorized?: () => void
  ): Promise<{ tipos_estampado?: TipoEstampado[] }> {
    return apiRequest<{ tipos_estampado?: TipoEstampado[] }>(`/api/tipos-estampado/${id}`, {
      method: 'DELETE',
      token,
      onUnauthorized,
    })
  },
}
