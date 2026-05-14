import React from 'react'

interface Props {
  percentage: number
  label: string
  sublabel?: string
}

function usageColor(pct: number): string {
  if (pct < 50) return '#22C55E'
  if (pct < 80) return '#EAB308'
  return '#EF4444'
}

export default function UsageBar({ percentage, label, sublabel }: Props): React.ReactElement {
  const pct = Math.min(100, Math.max(0, percentage))
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 12, color: '#f0f0f0', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 12, color: usageColor(pct), fontWeight: 600 }}>{pct}%</span>
      </div>
      <div
        style={{
          width: '100%',
          height: 6,
          background: '#333',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: usageColor(pct),
            borderRadius: 3,
            transition: 'width 0.4s ease',
          }}
        />
      </div>
      {sublabel && (
        <span style={{ fontSize: 11, color: '#888', marginTop: 3, display: 'block' }}>
          {sublabel}
        </span>
      )}
    </div>
  )
}
