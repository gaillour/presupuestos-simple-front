import React from 'react'

export interface MetricProps {
  label: string
  value: string
  note: string
  loading?: boolean
}

export function Metric({
  label,
  value,
  note,
  loading = false,
}: MetricProps): React.JSX.Element {
  return (
    <div className="metric">
      <p>{label}</p>
      {loading ? (
        <>
          <div className="skeleton-box skeleton-metric-value" />
          <div className="skeleton-box skeleton-metric-note" />
        </>
      ) : (
        <>
          <strong className="tabular-nums">{value}</strong>
          <small>{note}</small>
        </>
      )}
    </div>
  )
}
