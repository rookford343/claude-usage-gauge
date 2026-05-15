import { contextBridge, ipcRenderer } from 'electron'
import type { UsageData, DayUsage, ApiStatus, DisplayStyle } from '../main/types'

const bridge = {
  hasCredentials: (): Promise<boolean> =>
    ipcRenderer.invoke('has-credentials'),

  startLogin: (): Promise<void> =>
    ipcRenderer.invoke('start-login'),

  clearAuth: (): Promise<void> =>
    ipcRenderer.invoke('clear-auth'),

  getUsage: (): Promise<UsageData | null> =>
    ipcRenderer.invoke('get-usage'),

  forceRefresh: (): Promise<UsageData | null> =>
    ipcRenderer.invoke('force-refresh'),

  openFullView: (): Promise<void> =>
    ipcRenderer.invoke('open-full-view'),

  setApiKey: (key: string): Promise<ApiStatus> =>
    ipcRenderer.invoke('set-api-key', key),

  getApiStatus: (): Promise<ApiStatus> =>
    ipcRenderer.invoke('get-api-status'),

  getHistory: (): Promise<DayUsage[]> =>
    ipcRenderer.invoke('get-history'),

  setDisplayStyle: (style: DisplayStyle): Promise<void> =>
    ipcRenderer.invoke('set-display-style', style),

  setPollInterval: (seconds: number): Promise<void> =>
    ipcRenderer.invoke('set-poll-interval', seconds),

  getDisplayStyle: (): Promise<DisplayStyle> =>
    ipcRenderer.invoke('get-display-style'),

  getPollInterval: (): Promise<number> =>
    ipcRenderer.invoke('get-poll-interval'),

  onUsageUpdated: (cb: (data: UsageData) => void): void => {
    ipcRenderer.on('usage-updated', (_event, data: UsageData) => cb(data))
  },

  onAuthComplete: (cb: () => void): void => {
    ipcRenderer.on('auth-complete', () => cb())
  },

  removeAllListeners: (channel: string): void => {
    ipcRenderer.removeAllListeners(channel)
  },
}

contextBridge.exposeInMainWorld('claudeUsage', bridge)

declare global {
  interface Window {
    claudeUsage: typeof bridge
  }
}
