import React from 'react'

interface Props {
  percentage: number
  size: number
  label?: string
}

function usageColor(pct: number): string {
  if (pct < 50) return '#22C55E'
  if (pct < 80) return '#EAB308'
  return '#EF4444'
}

export default function DonutGauge({ percentage, size, label }: Props): React.ReactElement {
  const strokeWidth = size * 0.1
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const dashoffset = circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference
  const cx = size / 2
  const cy = size / 2
  const color = usageColor(percentage)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg width={size} height={size}>
        {/* Background track */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="#333"
          strokeWidth={strokeWidth}
        />
        {/* Usage arc */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: 'stroke-dashoffset 0.4s ease' }}
        />
        {/* Center text */}
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#f0f0f0"
          fontSize={size * 0.18}
          fontFamily="-apple-system, sans-serif"
          fontWeight="600"
        >
          {Math.round(percentage)}%
        </text>
      </svg>
      {label && (
        <span style={{ fontSize: 11, color: '#888', letterSpacing: 0.3 }}>{label}</span>
      )}
    </div>
  )
}
