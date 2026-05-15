import React, { useState, useEffect, useCallback } from 'react'
import type { UsageData, DayUsage, ApiStatus, DisplayStyle } from '../../main/types'
import UsageBar from './UsageBar'
import HistoryGrid from './HistoryGrid'

function formatRemaining(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  const diff = d.getTime() - Date.now()
  if (diff <= 0) return 'now'
  const h = Math.floor(diff / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  const countdown = h > 0 ? `${h}h ${m}m` : `${m}m`
  const clock = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  return `${countdown} (${clock.toLowerCase()})`
}

function formatWeeklyReset(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  const day = d.toLocaleDateString('en-US', { weekday: 'short' })
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  return `${day} ${time.toLowerCase()}`
}

const sectionStyle: React.CSSProperties = {
  padding: '14px 20px',
  borderBottom: '1px solid #252525',
}

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 0.8,
  color: '#555',
  textTransform: 'uppercase',
  marginBottom: 10,
}

export default function FullView(): React.ReactElement {
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null)
  const [history, setHistory] = useState<DayUsage[]>([])
  const [displayStyle, setDisplayStyle] = useState<DisplayStyle>('donut')
  const [pollInterval, setPollInterval] = useState(60)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [showKeyInput, setShowKeyInput] = useState(false)

  const loadAll = useCallback(async () => {
    const [u, a, h, style, interval] = await Promise.all([
      window.claudeUsage.getUsage(),
      window.claudeUsage.getApiStatus(),
      window.claudeUsage.getHistory(),
      window.claudeUsage.getDisplayStyle(),
      window.claudeUsage.getPollInterval(),
    ])
    setUsage(u)
    setApiStatus(a)
    setHistory(h)
    setDisplayStyle(style)
    setPollInterval(interval)
  }, [])

  useEffect(() => {
    void loadAll()
    window.claudeUsage.onUsageUpdated((data) => setUsage(data))
    return () => window.claudeUsage.removeAllListeners('usage-updated')
  }, [loadAll])

  const handleStyleChange = async (style: DisplayStyle): Promise<void> => {
    setDisplayStyle(style)
    await window.claudeUsage.setDisplayStyle(style)
  }

  const handleIntervalChange = async (seconds: number): Promise<void> => {
    setPollInterval(seconds)
    await window.claudeUsage.setPollInterval(seconds)
  }

  const handleSaveKey = async (): Promise<void> => {
    if (!apiKeyInput.trim()) return
    const status = await window.claudeUsage.setApiKey(apiKeyInput.trim())
    setApiStatus(status)
    setShowKeyInput(false)
    setApiKeyInput('')
  }

  const handleDisconnect = async (): Promise<void> => {
    await window.claudeUsage.clearAuth()
    window.location.reload()
  }

  const apiColor =
    apiStatus?.status === 'valid'
      ? '#22C55E'
      : apiStatus?.status === 'invalid'
      ? '#EF4444'
      : '#555'

  return (
    <div
      style={{
        width: 480,
        height: 560,
        background: '#1a1a1a',
        color: '#f0f0f0',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '14px 20px',
          borderBottom: '1px solid #252525',
          WebkitAppRegion: 'drag' as React.CSSProperties['WebkitAppRegion'],
        }}
      >
        <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>Claude Usage Gauge</span>
        <button
          onClick={() => window.close()}
          style={{
            background: '#333',
            border: 'none',
            borderRadius: 4,
            color: '#888',
            fontSize: 13,
            width: 24,
            height: 24,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            WebkitAppRegion: 'no-drag' as React.CSSProperties['WebkitAppRegion'],
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Session */}
        <div style={sectionStyle}>
          <p style={labelStyle}>Session Limit</p>
          <UsageBar
            percentage={usage?.session.percentage ?? 0}
            label={
              usage?.session.messagesRemaining != null
                ? `~${usage.session.messagesRemaining} messages remaining`
                : 'Usage data'
            }
            sublabel={`Resets in ${formatRemaining(usage?.session.resetsAt ?? null)}`}
          />
        </div>

        {/* Weekly */}
        <div style={sectionStyle}>
          <p style={labelStyle}>Weekly Limit</p>
          <UsageBar
            percentage={usage?.weekly.percentage ?? 0}
            label="Weekly usage"
            sublabel={`Resets ${formatWeeklyReset(usage?.weekly.resetsAt ?? null)}`}
          />
        </div>

        {/* API */}
        <div style={sectionStyle}>
          <p style={labelStyle}>Anthropic API</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: apiColor, fontSize: 14 }}>●</span>
            <span style={{ fontSize: 12, color: '#f0f0f0' }}>
              {apiStatus?.status === 'valid'
                ? `Valid key${apiStatus.isAdmin ? ' (admin)' : ''}`
                : apiStatus?.status === 'invalid'
                ? 'Invalid key'
                : 'Not configured'}
            </span>
            <button
              onClick={() => setShowKeyInput((v) => !v)}
              style={{
                background: 'none',
                border: 'none',
                color: '#555',
                fontSize: 11,
                cursor: 'pointer',
                marginLeft: 'auto',
              }}
            >
              {apiStatus?.status === 'valid' ? 'Replace' : 'Enter key'}
            </button>
          </div>
          {showKeyInput && (
            <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="sk-ant-..."
                style={{
                  flex: 1,
                  background: '#252525',
                  border: '1px solid #444',
                  borderRadius: 4,
                  color: '#f0f0f0',
                  fontSize: 12,
                  padding: '6px 8px',
                  outline: 'none',
                }}
              />
              <button
                onClick={handleSaveKey}
                style={{
                  background: '#7C3AED',
                  border: 'none',
                  borderRadius: 4,
                  color: '#fff',
                  fontSize: 12,
                  padding: '6px 12px',
                  cursor: 'pointer',
                }}
              >
                Save
              </button>
            </div>
          )}
        </div>

        {/* History */}
        <div style={sectionStyle}>
          <p style={labelStyle}>Usage History — Last 7 Days</p>
          <HistoryGrid days={history} />
        </div>

        {/* Settings */}
        <div style={{ ...sectionStyle, borderBottom: 'none' }}>
          <p style={labelStyle}>Settings</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ flex: 1, fontSize: 12, color: '#888' }}>Display style</span>
              <select
                value={displayStyle}
                onChange={(e) => handleStyleChange(e.target.value as DisplayStyle)}
                style={{
                  background: '#252525',
                  border: '1px solid #444',
                  borderRadius: 4,
                  color: '#f0f0f0',
                  fontSize: 12,
                  padding: '4px 8px',
                }}
              >
                <option value="donut">Donut</option>
                <option value="dual-donut">Dual Donut</option>
                <option value="dual-numbers">Dual Numbers</option>
                <option value="battery-bar">Battery Bar</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ flex: 1, fontSize: 12, color: '#888' }}>Poll interval</span>
              <select
                value={pollInterval}
                onChange={(e) => handleIntervalChange(Number(e.target.value))}
                style={{
                  background: '#252525',
                  border: '1px solid #444',
                  borderRadius: 4,
                  color: '#f0f0f0',
                  fontSize: 12,
                  padding: '4px 8px',
                }}
              >
                <option value={30}>30s</option>
                <option value={60}>60s</option>
                <option value={120}>2m</option>
                <option value={300}>5m</option>
              </select>
            </div>
            <button
              onClick={handleDisconnect}
              style={{
                alignSelf: 'flex-start',
                background: 'none',
                border: '1px solid #333',
                borderRadius: 4,
                color: '#EF4444',
                fontSize: 11,
                padding: '5px 10px',
                cursor: 'pointer',
                marginTop: 4,
              }}
            >
              Disconnect account
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
