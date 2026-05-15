import type { UsageData } from './types'

// Actual API response shape from claude.ai/api/organizations/<uuid>/usage
interface UsageWindow {
  utilization: number | null  // already a 0-100 percentage
  resets_at: string | null
}

interface ClaudeUsageRaw {
  five_hour: UsageWindow | null     // session limit (5-hour rolling window)
  seven_day: UsageWindow | null     // weekly limit
}

export async function fetchUsage(sessionKey: string, orgId: string, cookieName = 'sessionKey'): Promise<UsageData> {
  const url = `https://claude.ai/api/organizations/${orgId}/usage`
  const res = await fetch(url, {
    headers: {
      Cookie: `${cookieName}=${sessionKey}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Origin: 'https://claude.ai',
      Referer: 'https://claude.ai/',
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    },
  })

  if (res.status === 401) throw new Error('SESSION_EXPIRED')
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.log(`[claude-usage-gauge] usage fetch failed ${res.status}:`, body.slice(0, 400))
    throw new Error(`FETCH_ERROR:${res.status}`)
  }

  const raw = (await res.json()) as ClaudeUsageRaw

  const sessionPct = Math.round(Math.min(100, Math.max(0, raw.five_hour?.utilization ?? 0)))
  const weeklyPct = Math.round(Math.min(100, Math.max(0, raw.seven_day?.utilization ?? 0)))

  return {
    session: {
      percentage: sessionPct,
      messagesRemaining: null,  // API returns utilization %, not used/limit counts
      resetsAt: raw.five_hour?.resets_at ?? null,
    },
    weekly: {
      percentage: weeklyPct,
      resetsAt: raw.seven_day?.resets_at ?? null,
    },
    lastUpdated: new Date().toISOString(),
    error: null,
  }
}
