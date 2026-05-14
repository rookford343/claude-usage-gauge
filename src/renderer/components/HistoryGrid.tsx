import React from 'react'
import type { DayUsage } from '../../main/types'

interface Props {
  days: DayUsage[]
}

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function usageColor(pct: number): string {
  if (pct === 0) return '#444'
  if (pct < 50) return '#22C55E'
  if (pct < 80) return '#EAB308'
  return '#EF4444'
}

function dayAbbr(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return DAY_ABBR[d.getDay()] ?? '?'
}

export default function HistoryGrid({ days }: Props): React.ReactElement {
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: 4,
      }}
    >
      {days.map((day) => {
        const isToday = day.date === today
        const pct = day.sessionPeak
        return (
          <div
            key={day.date}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              padding: '6px 2px',
              borderRadius: 6,
              background: isToday ? '#2a2a2a' : 'transparent',
            }}
          >
            <span style={{ fontSize: 9, color: isToday ? '#f0f0f0' : '#666' }}>
              {dayAbbr(day.date)}
            </span>
            {/* Mini bar */}
            <div
              style={{
                width: 10,
                height: 40,
                background: '#333',
                borderRadius: 3,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: `${pct}%`,
                  background: usageColor(pct),
                  transition: 'height 0.3s ease',
                }}
              />
            </div>
            <span
              style={{
                fontSize: 9,
                color: pct === 0 ? '#555' : usageColor(pct),
                fontWeight: 600,
              }}
            >
              {pct === 0 ? '—' : `${pct}%`}
            </span>
          </div>
        )
      })}
    </div>
  )
}
