import { BrowserWindow, Notification, nativeTheme, type Tray } from 'electron'
import type { DisplayStyle, TrayTheme, UsageData } from './types'
import { getCredentials } from './auth'
import { fetchUsage } from './claude-web'
import { recordUsage } from './history-store'
import { drawTrayIcon } from './tray-renderer'

export class Poller {
  private timer: ReturnType<typeof setInterval> | null = null
  private currentUsage: UsageData | null = null
  private intervalSeconds = 60
  private style: DisplayStyle = 'donut'
  private theme: TrayTheme = 'system'
  private notificationsEnabled = false
  private notifiedThresholds = new Set<string>()

  constructor(private tray: Tray) {}

  start(): void {
    this.poll()
    this.timer = setInterval(() => this.poll(), this.intervalSeconds * 1000)
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  async forceRefresh(): Promise<UsageData | null> {
    await this.poll()
    return this.currentUsage
  }

  setIntervalSeconds(seconds: number): void {
    this.intervalSeconds = seconds
    if (this.timer) {
      this.stop()
      this.start()
    }
  }

  setDisplayStyle(style: DisplayStyle): void {
    this.style = style
    if (this.currentUsage) {
      this.updateTray(this.currentUsage)
    }
  }

  setTheme(theme: TrayTheme): void {
    this.theme = theme
    if (this.currentUsage) {
      this.updateTray(this.currentUsage)
    }
  }

  setNotificationsEnabled(enabled: boolean): void {
    this.notificationsEnabled = enabled
  }

  getCurrentUsage(): UsageData | null {
    return this.currentUsage
  }

  private effectiveIsDark(): boolean {
    if (this.theme === 'system') return nativeTheme.shouldUseDarkColors
    return this.theme === 'dark'
  }

  private async poll(): Promise<void> {
    const creds = getCredentials()
    if (!creds) {
      this.stop()
      return
    }

    try {
      const usage = await fetchUsage(creds.sessionKey, creds.orgId, creds.cookieName)
      this.currentUsage = usage
      recordUsage(usage.session.percentage, usage.weekly.percentage)
      this.checkNotifications(usage)
      this.updateTray(usage)
      this.broadcast(usage)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.log('[claude-usage-gauge] poll error:', message)
      const isExpired = message === 'SESSION_EXPIRED'
      this.currentUsage = {
        session: { percentage: 0, messagesRemaining: null, resetsAt: null },
        weekly: { percentage: 0, resetsAt: null },
        lastUpdated: new Date().toISOString(),
        error: isExpired ? 'Session expired — reconnect' : 'Network error',
      }
      this.broadcast(this.currentUsage)
      if (isExpired) this.stop()
    }
  }

  private checkNotifications(usage: UsageData): void {
    if (!this.notificationsEnabled) return
    const checks = [
      { key: 'session', pct: usage.session.percentage },
      { key: 'weekly', pct: usage.weekly.percentage },
    ]
    for (const { key, pct } of checks) {
      for (const threshold of [80, 95]) {
        const id = `${key}-${threshold}`
        if (pct >= threshold && !this.notifiedThresholds.has(id)) {
          this.notifiedThresholds.add(id)
          new Notification({
            title: 'Claude Usage Gauge',
            body: `${key === 'session' ? 'Session' : 'Weekly'} usage at ${pct}%`,
          }).show()
        } else if (pct < threshold) {
          this.notifiedThresholds.delete(id)
        }
      }
    }
  }

  private updateTray(usage: UsageData): void {
    const img = drawTrayIcon(
      usage.session.percentage,
      this.style,
      usage.weekly.percentage,
      this.effectiveIsDark(),
    )
    this.tray.setImage(img)
    this.tray.setToolTip(
      `Session: ${usage.session.percentage}% | Resets in ${formatRemaining(usage.session.resetsAt)}`,
    )
    if (this.style === 'dual-numbers') {
      this.tray.setTitle(`${usage.session.percentage}%·${usage.weekly.percentage}%`)
    } else if (this.style === 'donut') {
      this.tray.setTitle(`${usage.session.percentage}%`)
    } else {
      this.tray.setTitle('')
    }
  }

  private broadcast(usage: UsageData): void {
    BrowserWindow.getAllWindows().forEach((w) => {
      if (!w.isDestroyed()) w.webContents.send('usage-updated', usage)
    })
  }
}

function formatRemaining(isoString: string | null): string {
  if (!isoString) return '—'
  const diff = new Date(isoString).getTime() - Date.now()
  if (diff <= 0) return 'soon'
  const h = Math.floor(diff / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}
