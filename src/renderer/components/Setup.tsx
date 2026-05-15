import React, { useState, useEffect } from 'react'

interface Props {
  onAuthComplete: () => void
}

export default function Setup({ onAuthComplete }: Props): React.ReactElement {
  const [connecting, setConnecting] = useState(false)
  const [apiKeyExpanded, setApiKeyExpanded] = useState(false)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [apiKeyStatus, setApiKeyStatus] = useState<string | null>(null)
  const [savingKey, setSavingKey] = useState(false)

  useEffect(() => {
    // Check if auth already completed before this component mounted (race with IPC)
    window.claudeUsage.hasCredentials().then((has) => {
      if (has) {
        setConnecting(false)
        onAuthComplete()
      }
    })

    window.claudeUsage.onAuthComplete(() => {
      setConnecting(false)
      onAuthComplete()
    })
    return () => window.claudeUsage.removeAllListeners('auth-complete')
  }, [onAuthComplete])

  const handleConnect = async (): Promise<void> => {
    setConnecting(true)
    await window.claudeUsage.startLogin()
    // onAuthComplete will fire via the IPC event
  }

  const handleSaveKey = async (): Promise<void> => {
    if (!apiKeyInput.trim()) return
    setSavingKey(true)
    const status = await window.claudeUsage.setApiKey(apiKeyInput.trim())
    setApiKeyStatus(status.status === 'valid' ? '● Valid' : '● Invalid key')
    setSavingKey(false)
  }

  return (
    <div
      style={{
        width: 320,
        height: 240,
        background: '#1a1a1a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        gap: 16,
      }}
    >
      {/* Logo area */}
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: '#7C3AED',
            margin: '0 auto 8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
          }}
        >
          ◆
        </div>
        <p style={{ color: '#888', fontSize: 12, textAlign: 'center', lineHeight: 1.4 }}>
          Connect Claude.ai to see your usage limits
        </p>
      </div>

      <button
        onClick={handleConnect}
        disabled={connecting}
        style={{
          width: '100%',
          padding: '9px 0',
          background: connecting ? '#333' : '#7C3AED',
          color: '#fff',
          border: 'none',
          borderRadius: 7,
          fontSize: 13,
          fontWeight: 600,
          cursor: connecting ? 'default' : 'pointer',
          transition: 'background 0.15s',
        }}
      >
        {connecting ? 'Connecting…' : 'Connect Claude.ai'}
      </button>

      {/* API key section */}
      <div style={{ width: '100%' }}>
        <button
          onClick={() => setApiKeyExpanded((v) => !v)}
          style={{
            background: 'none',
            border: 'none',
            color: '#666',
            fontSize: 11,
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          {apiKeyExpanded ? '▾' : '▸'} Anthropic API key (optional)
        </button>

        {apiKeyExpanded && (
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
                fontSize: 11,
                padding: '5px 8px',
                outline: 'none',
              }}
            />
            <button
              onClick={handleSaveKey}
              disabled={savingKey}
              style={{
                background: '#333',
                border: 'none',
                borderRadius: 4,
                color: '#f0f0f0',
                fontSize: 11,
                padding: '5px 10px',
                cursor: 'pointer',
              }}
            >
              {savingKey ? '…' : 'Save'}
            </button>
          </div>
        )}
        {apiKeyStatus && (
          <p style={{ fontSize: 10, color: apiKeyStatus.includes('Valid') ? '#22C55E' : '#EF4444', marginTop: 4 }}>
            {apiKeyStatus}
          </p>
        )}
      </div>
    </div>
  )
}
