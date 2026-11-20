'use client'

import React, { useMemo, useState } from 'react'
import { AlertCircle, Minus, Plus, Search, ShoppingBag, Trash2, X } from 'lucide-react'
import type { TiendaProduct, TiendaSale, TiendaSaleCreatePayload, TiendaVariant } from '@/lib/types'
import { calcularTotalVenta } from '@/lib/tienda-utils'
import { money } from '@/lib/utils'
import { SmartNumberInput } from '@/components/ui/SmartNumberInput'

export interface ModalCrearVentaProps {
  productos: TiendaProduct[]
  initialProductId?: number | null
  onConfirm: (payload: TiendaSaleCreatePayload) => Promise<TiendaSale>
  onClose: () => void
}

interface CartItem {
  variantId: number
  productoNombre: string
  talle: string
  stockDisponible: number
  cantidad: number
  precioUnitario: number
}

export function ModalCrearVenta({
  productos,
  initialProductId = null,
  onConfirm,
  onClose,
}: ModalCrearVentaProps) {
  const [search, setSearch] = useState<string>('')
  const [expandedProdId, setExpandedProdId] = useState<number | null>(initialProductId)
  const [cart, setCart] = useState<CartItem[]>([])
  const [medioPago, setMedioPago] = useState<'efectivo' | 'transferencia' | 'tarjeta'>('efectivo')
  const [descuentoTipo, setDescuentoTipo] = useState<'porcentaje' | 'monto' | null>(null)
  const [descuentoValor, setDescuentoValor] = useState<number>(0)
  const [saving, setSaving] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = productos.filter((p) => p.variantes.some((v) => v.stock > 0))
    if (!q) return list
    return list.filter((p) => p.nombre.toLowerCase().includes(q))
  }, [productos, search])

  const addVariantToCart = (prod: TiendaProduct, v: TiendaVariant) => {
    if (v.stock <= 0) return
    setError('')
    const defaultPrice =
      v.precio_promocional && v.precio_promocional > 0 ? v.precio_promocional : v.precio

    setCart((prev) => {
      const idx = prev.findIndex((item) => item.variantId === v.id)
      if (idx >= 0) {
        const current = prev[idx]
        if (current.cantidad >= v.stock) {
          setError(`Stock máximo alcanzado para ${prod.nombre} (${v.talle}): ${v.stock} u.`)
          return prev
        }
        const copy = [...prev]
        copy[idx] = { ...current, cantidad: current.cantidad + 1 }
        return copy
      }
      return [
        ...prev,
        {
          variantId: v.id,
          productoNombre: prod.nombre,
          talle: v.talle,
          stockDisponible: v.stock,
          cantidad: 1,
          precioUnitario: defaultPrice,
        },
      ]
    })
  }

  const updateCartQty = (variantId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.variantId !== variantId) return item
          const next = item.cantidad + delta
          if (next <= 0) return null
          return { ...item, cantidad: Math.min(item.stockDisponible, next) }
        })
        .filter((x): x is CartItem => x !== null)
    )
  }

  const updateCartPrice = (variantId: number, price: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.variantId === variantId ? { ...item, precioUnitario: Math.max(0, price) } : item
      )
    )
  }

  const { subtotal, total } = useMemo(
    () =>
      calcularTotalVenta(
        cart.map((c) => ({ cantidad: c.cantidad, precio_unitario: c.precioUnitario })),
        descuentoTipo,
        descuentoValor
      ),
    [cart, descuentoTipo, descuentoValor]
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (cart.length === 0) {
      setError('Sumá al menos una prenda al carrito.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onConfirm({
        items: cart.map((c) => ({
          variant_id: c.variantId,
          cantidad: c.cantidad,
          precio_unitario: c.precioUnitario,
        })),
        medio_pago: medioPago,
        descuento_tipo: descuentoTipo,
        descuento_valor: descuentoTipo ? descuentoValor : 0,
      })
      onClose()
    } catch (err: any) {
      setError(err?.message || 'No se pudo registrar la venta.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal modal-xl venta-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="close" onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>

        <h2>Crear Venta (Local)</h2>
        <p className="muted" style={{ marginBottom: '12px' }}>
          Tocá las prendas y talles para sumar al carrito. Descuenta el stock acá y en Tiendanube al instante.
        </p>

        {error && (
          <div className="alert alert-error" style={{ margin: '0 0 12px' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="venta-pos-layout">
          {/* Selector de prendas */}
          <div className="venta-picker">
            <div className="search-box" style={{ marginBottom: '10px' }}>
              <Search size={15} />
              <input
                type="text"
                placeholder="Buscar prenda para sumar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>

            <div className="venta-picker-list">
              {filteredProducts.length === 0 ? (
                <p className="muted" style={{ fontSize: '13px', padding: '16px', textAlign: 'center' }}>
                  No hay prendas con stock disponible.
                </p>
              ) : (
                filteredProducts.map((prod) => {
                  const isExpanded = expandedProdId === prod.id || search.trim().length > 0
                  const thumb = prod.images[0]?.src
                  return (
                    <div key={prod.id} className="venta-prod-item">
                      <button
                        type="button"
                        className="venta-prod-header"
                        onClick={() => setExpandedProdId(isExpanded ? null : prod.id)}
                      >
                        {thumb ? (
                          <img src={thumb} alt={prod.nombre} className="mini-thumb" />
                        ) : (
                          <span className="mini-thumb placeholder" />
                        )}
                        <span style={{ flex: 1, textAlign: 'left', fontWeight: 600 }}>{prod.nombre}</span>
                        <span className="muted tabular-nums" style={{ fontSize: '12px' }}>
                          {prod.stock_total} u.
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="venta-talles-row">
                          {prod.variantes.map((v) => {
                            const inCart = cart.find((c) => c.variantId === v.id)?.cantidad ?? 0
                            const effPrice =
                              v.precio_promocional && v.precio_promocional > 0
                                ? v.precio_promocional
                                : v.precio
                            return (
                              <button
                                key={v.id}
                                type="button"
                                className={inCart > 0 ? 'talle-tap-btn active' : 'talle-tap-btn'}
                                disabled={v.stock <= 0}
                                onClick={() => addVariantToCart(prod, v)}
                              >
                                <strong>{v.talle}</strong>
                                <small>{v.stock} u. · {money.format(effPrice)}</small>
                                {inCart > 0 && <span className="tap-count">+{inCart}</span>}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Carrito + Pago */}
          <div className="venta-cart">
            <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '8px' }}>
              Carrito ({cart.reduce((a, c) => a + c.cantidad, 0)} prendas)
            </div>

            {cart.length === 0 ? (
              <div className="venta-cart-empty muted">
                Elegí talles de la lista para armar la venta.
              </div>
            ) : (
              <div className="venta-cart-items">
                {cart.map((item) => (
                  <div key={item.variantId} className="venta-cart-row">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.productoNombre}
                      </div>
                      <span className="badge-sand" style={{ fontSize: '11px' }}>{item.talle}</span>
                    </div>
                    <div className="stock-stepper">
                      <button type="button" onClick={() => updateCartQty(item.variantId, -1)}>
                        <Minus size={12} />
                      </button>
                      <span className="tabular-nums" style={{ minWidth: '20px', textAlign: 'center', fontWeight: 700, fontSize: '13px' }}>
                        {item.cantidad}
                      </span>
                      <button
                        type="button"
                        disabled={item.cantidad >= item.stockDisponible}
                        onClick={() => updateCartQty(item.variantId, 1)}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <SmartNumberInput
                      min={0}
                      step="any"
                      fallback={item.precioUnitario}
                      value={item.precioUnitario}
                      onChangeValue={(val) => updateCartPrice(item.variantId, val)}
                      className="cell-input"
                      style={{ width: '82px' }}
                    />
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => setCart((prev) => prev.filter((c) => c.variantId !== item.variantId))}
                      aria-label="Quitar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="form-grid-2" style={{ marginTop: '12px' }}>
              <label>
                Medio de pago
                <select
                  value={medioPago}
                  onChange={(e) => setMedioPago(e.target.value as 'efectivo' | 'transferencia' | 'tarjeta')}
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="tarjeta">Tarjeta</option>
                </select>
              </label>

              <div>
                <span className="field-label-sm">Descuento opcional</span>
                <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                  <select
                    value={descuentoTipo ?? ''}
                    onChange={(e) => {
                      const val = e.target.value
                      setDescuentoTipo(val ? (val as 'porcentaje' | 'monto') : null)
                      if (!val) setDescuentoValor(0)
                    }}
                    style={{ width: '95px' }}
                  >
                    <option value="">Sin desc.</option>
                    <option value="porcentaje">%</option>
                    <option value="monto">$ fijo</option>
                  </select>
                  {descuentoTipo && (
                    <SmartNumberInput
                      min={0}
                      max={descuentoTipo === 'porcentaje' ? 100 : undefined}
                      step="any"
                      fallback={0}
                      value={descuentoValor}
                      onChangeValue={(val) => setDescuentoValor(val)}
                      style={{ flex: 1 }}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="modal-total" style={{ marginTop: '12px' }}>
              <span>Subtotal: {money.format(subtotal)}</span>
              <strong className="tabular-nums">Total: {money.format(total)}</strong>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
              <button type="button" className="secondary" onClick={onClose} disabled={saving}>
                Cancelar
              </button>
              <button
                type="submit"
                className="primary"
                style={{ flex: 1 }}
                disabled={saving || cart.length === 0}
              >
                <ShoppingBag size={15} />
                {saving ? 'Registrando...' : 'Confirmar Venta'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
