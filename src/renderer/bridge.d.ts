import type { UsageData, DayUsage, ApiStatus, DisplayStyle } from '../main/types'

declare global {
  interface Window {
    claudeUsage: {
      hasCredentials(): Promise<boolean>
      startLogin(): Promise<void>
      clearAuth(): Promise<void>
      getUsage(): Promise<UsageData | null>
      forceRefresh(): Promise<UsageData | null>
      openFullView(): Promise<void>
      setApiKey(key: string): Promise<ApiStatus>
      getApiStatus(): Promise<ApiStatus>
      getHistory(): Promise<DayUsage[]>
      setDisplayStyle(style: DisplayStyle): Promise<void>
      setPollInterval(seconds: number): Promise<void>
      getDisplayStyle(): Promise<DisplayStyle>
      getPollInterval(): Promise<number>
      onUsageUpdated(cb: (data: UsageData) => void): void
      onAuthComplete(cb: () => void): void
      removeAllListeners(channel: string): void
    }
  }
}

// Allow WebkitAppRegion in inline styles (Electron-specific)
declare module 'react' {
  interface CSSProperties {
    WebkitAppRegion?: 'drag' | 'no-drag'
  }
}
