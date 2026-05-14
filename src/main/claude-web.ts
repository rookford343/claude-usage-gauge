import type { UsageData } from './types'

interface ClaudeUsageRaw {
  messageLimit?: {
    used?: number
    limit?: number
    resetsAt?: string
  }
  weeklyMessageLimit?: {
    used?: number
    limit?: number
    resetsAt?: string
  }
}

function calcPct(used: number | undefined, limit: number | undefined): number {
  if (!limit) return 0
  return Math.min(100, Math.max(0, ((used ?? 0) / limit) * 100))
}

export async function fetchUsage(sessionKey: string, orgId: string): Promise<UsageData> {
  const url = `https://claude.ai/api/organizations/${orgId}/usage`
  const res = await fetch(url, {
    headers: {
      Cookie: `sessionKey=${sessionKey}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Origin: 'https://claude.ai',
      Referer: 'https://claude.ai/',
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    },
  })

  if (res.status === 401) throw new Error('SESSION_EXPIRED')
  if (!res.ok) throw new Error('FETCH_ERROR')

  const raw = (await res.json()) as ClaudeUsageRaw

  const session = raw.messageLimit ?? {}
  const weekly = raw.weeklyMessageLimit ?? {}

  const sessionPct = calcPct(session.used, session.limit)
  const weeklyPct = calcPct(weekly.used, weekly.limit)
  const remaining =
    session.limit != null && session.used != null ? session.limit - session.used : null

  return {
    session: {
      percentage: Math.round(sessionPct),
      messagesRemaining: remaining,
      resetsAt: session.resetsAt ?? null,
    },
    weekly: {
      percentage: Math.round(weeklyPct),
      resetsAt: weekly.resetsAt ?? null,
    },
    lastUpdated: new Date().toISOString(),
    error: null,
  }
}
