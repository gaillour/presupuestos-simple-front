'use client'

import React, { useState } from 'react'
import { AlertCircle, CheckCircle2, Upload, X } from 'lucide-react'
import type { TiendaImportResult } from '@/lib/types'

export interface ModalImportarCsvProps {
  onImport: (file: File) => Promise<TiendaImportResult>
  onClose: () => void
}

export function ModalImportarCsv({ onImport, onClose }: ModalImportarCsvProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [importing, setImporting] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [result, setResult] = useState<TiendaImportResult | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) {
      setError('Seleccioná un archivo .csv exportado desde Tiendanube.')
      return
    }

    setImporting(true)
    setError('')
    setResult(null)
    try {
      const res = await onImport(selectedFile)
      setResult(res)
    } catch (err: any) {
      setError(err?.message || 'Error al importar el archivo CSV.')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="close" onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>

        <h2>Importar Catálogo Tiendanube (.csv)</h2>
        <p className="muted" style={{ marginBottom: '16px' }}>
          En Tiendanube → Productos → Exportar lista de productos (.csv). Soporta UTF-8, Latin-1 y separadores por coma o punto y coma.
        </p>

        {error && (
          <div className="alert alert-error" style={{ margin: '0 0 16px' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="alert alert-success" style={{ margin: '0 0 16px', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
              <CheckCircle2 size={16} />
              <span>
                Importación finalizada: {result.productos_procesados} prendas ·{' '}
                {result.variantes_procesadas} variantes procesadas.
              </span>
            </div>
            {result.errores.length > 0 && (
              <ul style={{ margin: '6px 0 0 18px', padding: 0, fontSize: '11px' }}>
                {result.errores.slice(0, 8).map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
                {result.errores.length > 8 && (
                  <li>...y {result.errores.length - 8} advertencias más.</li>
                )}
              </ul>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px' }}>
          <label>
            Archivo CSV de Tiendanube
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                setSelectedFile(e.target.files?.[0] ?? null)
                setError('')
              }}
            />
          </label>

          {selectedFile && (
            <small className="muted">
              Archivo seleccionado: <strong>{selectedFile.name}</strong> (
              {Math.max(1, Math.round(selectedFile.size / 1024))} KB)
            </small>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
            <button type="button" className="secondary" onClick={onClose} disabled={importing}>
              {result ? 'Cerrar' : 'Cancelar'}
            </button>
            <button
              type="submit"
              className="primary"
              style={{ flex: 1 }}
              disabled={importing || !selectedFile}
            >
              <Upload size={15} /> {importing ? 'Importando...' : 'Importar Catálogo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
