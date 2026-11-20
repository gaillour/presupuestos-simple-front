'use client'

import React, { useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  Plus,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import type {
  TiendaCategory,
  TiendaImage,
  TiendaProduct,
  TiendaProductCreatePayload,
  TiendaProductUpdatePayload,
} from '@/lib/types'
import { TALLE_PRESETS } from '@/lib/tienda-utils'
import { processImageFile, type CropAspectRatio, type ProcessedPhoto } from '@/lib/image-processor'
import { SmartNumberInput } from '@/components/ui/SmartNumberInput'

export interface ModalProductoTiendaProps {
  producto: TiendaProduct | null // null = alta nueva
  categorias: TiendaCategory[]
  tiendanubeConectado: boolean
  onCreate: (payload: TiendaProductCreatePayload) => Promise<TiendaProduct>
  onUpdate: (productId: number, payload: TiendaProductUpdatePayload) => Promise<TiendaProduct>
  onDelete?: (productId: number) => Promise<void>
  onCreateCategoria: (nombre: string) => Promise<TiendaCategory>
  onUploadPhoto: (productId: number, base64: string, filename: string, position?: number) => Promise<TiendaImage[]>
  onDeletePhoto: (productId: number, tnImageId: number) => Promise<TiendaImage[]>
  onReorderPhotos: (productId: number, imageIds: number[]) => Promise<TiendaImage[]>
  onClose: () => void
}

export function ModalProductoTienda({
  producto,
  categorias,
  tiendanubeConectado,
  onCreate,
  onUpdate,
  onDelete,
  onCreateCategoria,
  onUploadPhoto,
  onDeletePhoto,
  onReorderPhotos,
  onClose,
}: ModalProductoTiendaProps) {
  const isEditing = producto !== null

  const [nombre, setNombre] = useState<string>(producto?.nombre || '')
  const [published, setPublished] = useState<boolean>(producto?.published ?? true)
  const [selectedCatIds, setSelectedCatIds] = useState<number[]>(producto?.category_ids || [])
  const [precio, setPrecio] = useState<number>(producto?.variantes[0]?.precio ?? 0)
  const [precioPromo, setPrecioPromo] = useState<number>(producto?.variantes[0]?.precio_promocional ?? 0)

  // Talles y stock para alta o para agregar nuevos talles al editar
  const [tallesStock, setTallesStock] = useState<Record<string, number>>(() => {
    if (!producto) return { T1: 0, T2: 0, T3: 0 }
    const map: Record<string, number> = {}
    for (const v of producto.variantes) {
      map[v.talle] = v.stock
    }
    return map
  })
  const [customTalle, setCustomTalle] = useState<string>('')

  // Creación rápida de sección
  const [showNewCat, setShowNewCat] = useState<boolean>(false)
  const [newCatName, setNewCatName] = useState<string>('')
  const [creatingCat, setCreatingCat] = useState<boolean>(false)

  // Fotos existentes y nuevas en cola
  const [existingImages, setExistingImages] = useState<TiendaImage[]>(producto?.images || [])
  const [queuedPhotos, setQueuedPhotos] = useState<ProcessedPhoto[]>([])
  const [cropAspect, setCropAspect] = useState<CropAspectRatio>('original')
  const [enhancePhotos, setEnhancePhotos] = useState<boolean>(true)
  const [processingPhotos, setProcessingPhotos] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [saving, setSaving] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false)

  const existingTallesSet = useMemo(
    () => new Set((producto?.variantes || []).map((v) => v.talle.toLowerCase())),
    [producto]
  )

  const toggleCategory = (tnCatId: number) => {
    setSelectedCatIds((prev) =>
      prev.includes(tnCatId) ? prev.filter((id) => id !== tnCatId) : [...prev, tnCatId]
    )
  }

  const toggleTalle = (talle: string) => {
    if (isEditing && existingTallesSet.has(talle.toLowerCase())) return
    setTallesStock((prev) => {
      if (talle in prev) {
        const next = { ...prev }
        delete next[talle]
        return next
      }
      return { ...prev, [talle]: 0 }
    })
  }

  const handleAddCustomTalle = () => {
    const clean = customTalle.trim()
    if (!clean) return
    if (!(clean in tallesStock)) {
      setTallesStock((prev) => ({ ...prev, [clean]: 0 }))
    }
    setCustomTalle('')
  }

  const handleCreateCategory = async () => {
    const clean = newCatName.trim()
    if (!clean) return
    setCreatingCat(true)
    setError('')
    try {
      const created = await onCreateCategoria(clean)
      if (created.tiendanube_category_id !== null) {
        setSelectedCatIds((prev) => [...prev, created.tiendanube_category_id!])
      }
      setNewCatName('')
      setShowNewCat(false)
    } catch (err: any) {
      setError(err?.message || 'No se pudo crear la sección.')
    } finally {
      setCreatingCat(false)
    }
  }

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setProcessingPhotos(true)
    setError('')
    try {
      const processed: ProcessedPhoto[] = []
      for (const file of Array.from(files)) {
        const item = await processImageFile(file, {
          maxDimension: 1600,
          quality: 0.86,
          aspect: cropAspect,
          enhance: enhancePhotos,
        })
        processed.push(item)
      }
      setQueuedPhotos((prev) => [...prev, ...processed])
    } catch (err: any) {
      setError(err?.message || 'Error procesando las fotos.')
    } finally {
      setProcessingPhotos(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const moveQueuedPhoto = (idx: number, dir: -1 | 1) => {
    setQueuedPhotos((prev) => {
      const nextIdx = idx + dir
      if (nextIdx < 0 || nextIdx >= prev.length) return prev
      const copy = [...prev]
      const [item] = copy.splice(idx, 1)
      copy.splice(nextIdx, 0, item)
      return copy
    })
  }

  const handleDeleteExistingPhoto = async (tnImageId: number | null) => {
    if (!producto || tnImageId === null) return
    try {
      const updated = await onDeletePhoto(producto.id, tnImageId)
      setExistingImages(updated)
    } catch (err: any) {
      setError(err?.message || 'No se pudo borrar la foto.')
    }
  }

  const moveExistingPhoto = async (idx: number, dir: -1 | 1) => {
    if (!producto) return
    const nextIdx = idx + dir
    if (nextIdx < 0 || nextIdx >= existingImages.length) return
    const copy = [...existingImages]
    const [item] = copy.splice(idx, 1)
    copy.splice(nextIdx, 0, item)
    setExistingImages(copy)
    const ids = copy.map((i) => i.tiendanube_image_id).filter((id): id is number => id !== null)
    if (ids.length === copy.length) {
      try {
        const updated = await onReorderPhotos(producto.id, ids)
        if (updated.length > 0) setExistingImages(updated)
      } catch (err: any) {
        setError(err?.message || 'No se pudo reordenar las fotos.')
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) {
      setError('Ingresá el nombre de la prenda.')
      return
    }
    const tallesEntries = Object.entries(tallesStock)
    if (tallesEntries.length === 0) {
      setError('Seleccioná al menos un talle.')
      return
    }

    setSaving(true)
    setError('')
    try {
      let targetProductId: number

      if (isEditing && producto) {
        const nuevosTalles = tallesEntries
          .filter(([t]) => !existingTallesSet.has(t.toLowerCase()))
          .map(([talle, stock]) => ({ talle, stock: Math.max(0, Math.round(stock)) }))

        const updated = await onUpdate(producto.id, {
          nombre: nombre.trim(),
          category_ids: selectedCatIds,
          published,
          precio,
          precio_promocional: precioPromo > 0 ? precioPromo : null,
          clear_promocional: precioPromo <= 0,
          agregar_talles: nuevosTalles,
        })
        targetProductId = updated.id
      } else {
        const created = await onCreate({
          nombre: nombre.trim(),
          category_ids: selectedCatIds,
          precio,
          precio_promocional: precioPromo > 0 ? precioPromo : null,
          published,
          variantes: tallesEntries.map(([talle, stock]) => ({
            talle,
            stock: Math.max(0, Math.round(stock)),
          })),
        })
        targetProductId = created.id
      }

      // Subir fotos procesadas en cola si hay
      if (queuedPhotos.length > 0 && tiendanubeConectado) {
        let pos = existingImages.length + 1
        for (const photo of queuedPhotos) {
          await onUploadPhoto(targetProductId, photo.base64, photo.filename, pos++)
        }
      }

      onClose()
    } catch (err: any) {
      setError(err?.message || 'No se pudo guardar la prenda.')
    } finally {
      setSaving(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!producto || !onDelete) return
    setSaving(true)
    try {
      await onDelete(producto.id)
      onClose()
    } catch (err: any) {
      setError(err?.message || 'No se pudo eliminar la prenda.')
      setSaving(false)
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="close" onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>

        <h2>{isEditing ? `Editar: ${producto.nombre}` : 'Nueva Prenda'}</h2>
        <p className="muted" style={{ marginBottom: '14px' }}>
          {isEditing
            ? 'Editá nombre, secciones, precio, visibilidad o agregá fotos y talles nuevos.'
            : 'Cargá todo en un paso. Se guarda en la app y se publica directo en Tiendanube.'}
        </p>

        {error && (
          <div className="alert alert-error" style={{ margin: '0 0 14px' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
          {/* Nombre + Switch publicado */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <label style={{ flex: '1 1 240px' }}>
              Nombre de la prenda
              <input
                type="text"
                placeholder="Ej. ALFONSINA Azul Flor"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
            </label>

            <label className="switch-pill" style={{ cursor: 'pointer', marginBottom: '4px' }}>
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
              />
              <span>{published ? 'Visible en tienda' : 'Oculta en tienda'}</span>
            </label>
          </div>

          {/* Precios */}
          <div className="form-grid-2">
            <label>
              Precio ($)
              <SmartNumberInput
                min={0}
                step="any"
                fallback={0}
                value={precio}
                onChangeValue={(val) => setPrecio(val)}
                required
              />
            </label>
            <label>
              Precio promocional (opcional)
              <SmartNumberInput
                min={0}
                step="any"
                fallback={0}
                value={precioPromo}
                onChangeValue={(val) => setPrecioPromo(val)}
              />
            </label>
          </div>

          {/* Secciones */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span className="field-label-sm">Secciones en Tiendanube</span>
              <button
                type="button"
                className="secondary btn-sm"
                onClick={() => setShowNewCat((v) => !v)}
              >
                <Plus size={13} /> Nueva sección
              </button>
            </div>

            {showNewCat && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="text"
                  placeholder="Ej. Bikinis, Sale..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="primary btn-sm"
                  disabled={creatingCat || !newCatName.trim()}
                  onClick={handleCreateCategory}
                >
                  {creatingCat ? 'Creando...' : 'Crear'}
                </button>
              </div>
            )}

            <div className="filter-pills">
              {categorias.length === 0 ? (
                <span className="muted" style={{ fontSize: '12px' }}>
                  Sin secciones todavía. Podés crear una o sincronizar desde Tiendanube.
                </span>
              ) : (
                categorias.map((cat) => {
                  const tnId = cat.tiendanube_category_id ?? cat.id
                  const active = selectedCatIds.includes(tnId)
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      className={active ? 'pill-btn active' : 'pill-btn'}
                      onClick={() => toggleCategory(tnId)}
                    >
                      {active && <Check size={11} style={{ marginRight: '4px' }} />}
                      {cat.nombre}
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Talles y Stock */}
          <div>
            <span className="field-label-sm">Talles y stock inicial</span>
            <div className="filter-pills" style={{ marginTop: '6px', marginBottom: '10px' }}>
              {TALLE_PRESETS.map((t) => {
                const active = t in tallesStock
                const locked = isEditing && existingTallesSet.has(t.toLowerCase())
                return (
                  <button
                    key={t}
                    type="button"
                    className={active ? 'pill-btn active' : 'pill-btn'}
                    disabled={locked}
                    onClick={() => toggleTalle(t)}
                    title={locked ? 'Este talle ya existe (editá su stock en la grilla)' : undefined}
                  >
                    {t}
                  </button>
                )
              })}
              <div style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Otro (ej. Único)"
                  value={customTalle}
                  onChange={(e) => setCustomTalle(e.target.value)}
                  style={{ width: '115px', padding: '4px 8px', fontSize: '12px' }}
                />
                <button
                  type="button"
                  className="secondary btn-sm"
                  onClick={handleAddCustomTalle}
                >
                  +
                </button>
              </div>
            </div>

            <div className="talle-stock-row">
              {Object.entries(tallesStock).map(([talle, stock]) => {
                const isExisting = isEditing && existingTallesSet.has(talle.toLowerCase())
                return (
                  <div key={talle} className="talle-stock-chip">
                    <span className="talle-name">{talle}</span>
                    <SmartNumberInput
                      min={0}
                      step={1}
                      fallback={0}
                      disabled={isExisting}
                      value={stock}
                      onChangeValue={(val) =>
                        setTallesStock((prev) => ({ ...prev, [talle]: Math.max(0, Math.round(val)) }))
                      }
                      className="cell-input stock-input"
                    />
                  </div>
                )
              })}
            </div>
          </div>

          {/* Zona de Fotos */}
          <div className="photo-zone">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span className="field-label-sm">Fotos del producto (Tiendanube CDN)</span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <select
                  value={cropAspect}
                  onChange={(e) => setCropAspect(e.target.value as CropAspectRatio)}
                  style={{ fontSize: '12px', padding: '4px 8px' }}
                  aria-label="Formato de recorte"
                >
                  <option value="original">Original</option>
                  <option value="1:1">Cuadrado 1:1</option>
                  <option value="4:5">Vertical 4:5</option>
                </select>
                <label className="check" style={{ fontSize: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={enhancePhotos}
                    onChange={(e) => setEnhancePhotos(e.target.checked)}
                  />
                  <Sparkles size={13} /> Mejorar luz
                </label>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => void handleFilesSelected(e.target.files)}
            />

            <button
              type="button"
              className="secondary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
              disabled={processingPhotos}
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera size={16} />
              {processingPhotos
                ? 'Optimizando fotos...'
                : 'Sacar foto o elegir desde galería / compu (múltiples)'}
            </button>

            {!tiendanubeConectado && queuedPhotos.length > 0 && (
              <p className="muted" style={{ fontSize: '12px', marginTop: '6px' }}>
                Conectá Tiendanube para que estas fotos se suban directo a su CDN.
              </p>
            )}

            {(existingImages.length > 0 || queuedPhotos.length > 0) && (
              <div className="photo-grid">
                {existingImages.map((img, idx) => (
                  <div key={img.tiendanube_image_id ?? img.src} className="photo-thumb-card">
                    <img src={img.src} alt={`Foto ${idx + 1}`} />
                    <div className="photo-thumb-actions">
                      <button type="button" onClick={() => void moveExistingPhoto(idx, -1)} disabled={idx === 0} title="Mover izquierda">
                        <ArrowLeft size={12} />
                      </button>
                      <button type="button" onClick={() => void moveExistingPhoto(idx, 1)} disabled={idx === existingImages.length - 1} title="Mover derecha">
                        <ArrowRight size={12} />
                      </button>
                      <button type="button" onClick={() => void handleDeleteExistingPhoto(img.tiendanube_image_id)} title="Eliminar foto">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}

                {queuedPhotos.map((photo, idx) => (
                  <div key={photo.id} className="photo-thumb-card queued">
                    <img src={photo.previewUrl} alt={photo.filename} />
                    <span className="photo-badge">{photo.sizeKB} KB</span>
                    <div className="photo-thumb-actions">
                      <button type="button" onClick={() => moveQueuedPhoto(idx, -1)} disabled={idx === 0}>
                        <ArrowLeft size={12} />
                      </button>
                      <button type="button" onClick={() => moveQueuedPhoto(idx, 1)} disabled={idx === queuedPhotos.length - 1}>
                        <ArrowRight size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setQueuedPhotos((prev) => prev.filter((p) => p.id !== photo.id))}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botones finales */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '4px' }}>
            {isEditing && onDelete && (
              !confirmDelete ? (
                <button
                  type="button"
                  className="danger-btn"
                  onClick={() => setConfirmDelete(true)}
                  disabled={saving}
                >
                  <Trash2 size={14} /> Archivar
                </button>
              ) : (
                <button
                  type="button"
                  className="danger-btn"
                  onClick={() => void handleConfirmDelete()}
                  disabled={saving}
                >
                  Confirmar archivar
                </button>
              )
            )}
            <button type="button" className="secondary" onClick={onClose} disabled={saving} style={{ marginLeft: 'auto' }}>
              Cancelar
            </button>
            <button type="submit" className="primary" disabled={saving || processingPhotos}>
              {saving ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Prenda'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
