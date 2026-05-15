import React from 'react'
import type { UsageData } from '../../main/types'
import DonutGauge from './DonutGauge'

interface Props {
  usage: UsageData | null
}

function formatRemaining(iso: string | null): string {
  if (!iso) return '—'
  const diff = new Date(iso).getTime() - Date.now()
  if (diff <= 0) return 'soon'
  const h = Math.floor(diff / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function formatWeeklyReset(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  const day = d.toLocaleDateString('en-US', { weekday: 'short' })
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  return `${day} ${time.toLowerCase()}`
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 5) return 'just now'
  if (s < 60) return `${s}s ago`
  return `${Math.floor(s / 60)}m ago`
}

const btn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#888',
  fontSize: 13,
  cursor: 'pointer',
  padding: '2px 6px',
  borderRadius: 4,
  lineHeight: 1,
}

export default function MiniView({ usage }: Props): React.ReactElement {
  const handleRefresh = (): void => { void window.claudeUsage.forceRefresh() }
  const handleFullView = (): void => { void window.claudeUsage.openFullView() }

  return (
    <div
      style={{
        width: 320,
        height: 240,
        background: '#1a1a1a',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Title bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '10px 12px 8px',
          borderBottom: '1px solid #2a2a2a',
        }}
      >
        <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: '#f0f0f0' }}>
          Claude Usage Bar
        </span>
        <button onClick={handleRefresh} title="Refresh" style={btn}>↺</button>
        <button onClick={handleFullView} title="Full view" style={btn}>⚙</button>
      </div>

      {/* Gauges */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          padding: '12px 20px 8px',
        }}
      >
        {usage ? (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <DonutGauge percentage={usage.session.percentage} size={80} />
              <span style={{ fontSize: 11, color: '#888' }}>Session</span>
              <span style={{ fontSize: 10, color: '#666' }}>
                Resets {formatRemaining(usage.session.resetsAt)}
              </span>
            </div>
            <div style={{ width: 1, height: 80, background: '#2a2a2a' }} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <DonutGauge percentage={usage.weekly.percentage} size={80} />
              <span style={{ fontSize: 11, color: '#888' }}>Weekly</span>
              <span style={{ fontSize: 10, color: '#666' }}>
                Resets {formatWeeklyReset(usage.weekly.resetsAt)}
              </span>
            </div>
          </>
        ) : (
          <div style={{ color: '#555', fontSize: 12 }}>Loading…</div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '6px 12px',
          borderTop: '1px solid #2a2a2a',
          fontSize: 10,
          color: '#555',
        }}
      >
        <ApiDot />
        <span style={{ flex: 1, marginLeft: 6 }}>
          {usage ? `Updated ${timeAgo(usage.lastUpdated)}` : '—'}
        </span>
        <button
          onClick={handleFullView}
          style={{ ...btn, fontSize: 10, color: '#666' }}
        >
          Full View →
        </button>
      </div>
    </div>
  )
}

function ApiDot(): React.ReactElement {
  const [color, setColor] = React.useState('#555')

  React.useEffect(() => {
    window.claudeUsage.getApiStatus().then((s) => {
      if (s.status === 'valid') setColor('#22C55E')
      else if (s.status === 'invalid') setColor('#EF4444')
      else setColor('#555')
    })
  }, [])

  return <span style={{ fontSize: 12, color }}>●</span>
}
