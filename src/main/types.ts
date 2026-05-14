export type DisplayStyle = 'donut' | 'dual-donut' | 'dual-numbers' | 'battery-bar'

export interface UsageData {
  session: {
    percentage: number
    messagesRemaining: number | null
    resetsAt: string | null
  }
  weekly: {
    percentage: number
    resetsAt: string | null
  }
  lastUpdated: string
  error: string | null
}

export interface DayUsage {
  date: string
  sessionPeak: number
  weeklyPeak: number
}

export interface ApiStatus {
  status: 'valid' | 'invalid' | 'unconfigured'
  isAdmin: boolean
  rateLimits: unknown | null
}
