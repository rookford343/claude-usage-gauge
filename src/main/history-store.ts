import Store from 'electron-store'
import type { DayUsage } from './types'

const store = new Store<{ days: DayUsage[] }>({ name: 'history' })

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function pastDates(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (n - 1 - i))
    return d.toISOString().slice(0, 10)
  })
}

export function recordUsage(sessionPct: number, weeklyPct: number): void {
  const todayStr = today()
  const days = store.get('days', []) as DayUsage[]
  const existing = days.find((d) => d.date === todayStr)

  if (existing) {
    if (sessionPct > existing.sessionPeak) existing.sessionPeak = sessionPct
    if (weeklyPct > existing.weeklyPeak) existing.weeklyPeak = weeklyPct
  } else {
    days.push({ date: todayStr, sessionPeak: sessionPct, weeklyPeak: weeklyPct })
  }

  // Keep only last 7 days
  const cutoff = pastDates(7)[0]
  const pruned = days.filter((d) => d.date >= cutoff)
  store.set('days', pruned)
}

export function getHistory(): DayUsage[] {
  const dates = pastDates(7)
  const stored = store.get('days', []) as DayUsage[]
  return dates.map((date) => stored.find((d) => d.date === date) ?? { date, sessionPeak: 0, weeklyPeak: 0 })
}
