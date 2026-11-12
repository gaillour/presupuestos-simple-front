'use client'

import React, { useEffect, useState } from 'react'

export interface SmartNumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number | string
  onChangeValue?: (value: number) => void
  onRawChange?: (raw: string) => void
  fallback?: number
}

export function SmartNumberInput({
  value,
  onChangeValue,
  onRawChange,
  fallback = 0,
  min,
  max,
  step,
  className = '',
  onBlur,
  ...rest
}: SmartNumberInputProps) {
  const [internalText, setInternalText] = useState<string>(() => {
    if (value === null || value === undefined || value === '') return ''
    return String(value)
  })

  useEffect(() => {
    const strVal = value === null || value === undefined ? '' : String(value)
    if (internalText !== '' && (internalText.endsWith('.') || internalText.endsWith(','))) {
      return
    }
    const currentNum = parseFloat(internalText.replace(',', '.'))
    const incomingNum = parseFloat(strVal.replace(',', '.'))
    if (!isNaN(incomingNum) && !isNaN(currentNum) && incomingNum === currentNum) {
      return
    }
    setInternalText(strVal)
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    // Permitir solo dígitos, punto, coma y signo menos opcional al inicio
    if (raw !== '' && !/^-?[0-9]*[.,]?[0-9]*$/.test(raw)) {
      return
    }

    setInternalText(raw)
    if (onRawChange) onRawChange(raw)

    const normalized = raw.replace(',', '.')
    const parsed = parseFloat(normalized)

    if (!isNaN(parsed) && isFinite(parsed)) {
      if (onChangeValue) {
        onChangeValue(parsed)
      }
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const normalized = internalText.replace(',', '.')
    let parsed = parseFloat(normalized)

    if (isNaN(parsed) || !isFinite(parsed)) {
      parsed = fallback
    }

    if (min !== undefined && parsed < Number(min)) {
      parsed = Number(min)
    }
    if (max !== undefined && parsed > Number(max)) {
      parsed = Number(max)
    }

    setInternalText(String(parsed))
    if (onChangeValue) onChangeValue(parsed)
    if (onBlur) onBlur(e)
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={internalText}
      onChange={handleChange}
      onBlur={handleBlur}
      className={`tabular-nums ${className}`.trim()}
      {...rest}
    />
  )
}
