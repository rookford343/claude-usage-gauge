import React, { useState, useEffect } from 'react'
import type { UsageData } from '../../main/types'
import Setup from './Setup'
import MiniView from './MiniView'
import FullView from './FullView'

type View = 'loading' | 'setup' | 'mini'

export default function App(): React.ReactElement {
  const isFullView = window.location.hash === '#full'

  const [view, setView] = useState<View>('loading')
  const [usage, setUsage] = useState<UsageData | null>(null)

  useEffect(() => {
    if (isFullView) return

    window.claudeUsage.hasCredentials().then((has) => {
      if (has) {
        setView('mini')
        window.claudeUsage.getUsage().then((u) => { if (u) setUsage(u) })
      } else {
        setView('setup')
      }
    })

    window.claudeUsage.onUsageUpdated((data) => setUsage(data))
    return () => window.claudeUsage.removeAllListeners('usage-updated')
  }, [isFullView])

  if (isFullView) {
    return <FullView />
  }

  if (view === 'loading') {
    return (
      <div
        style={{
          width: 320,
          height: 240,
          background: '#1a1a1a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ color: '#555', fontSize: 12 }}>Loading…</span>
      </div>
    )
  }

  if (view === 'setup') {
    return (
      <Setup
        onAuthComplete={() => {
          setView('mini')
          window.claudeUsage.getUsage().then((u) => { if (u) setUsage(u) })
        }}
      />
    )
  }

  return <MiniView usage={usage} />
}
