import type { UsageData } from './types'

// API may return camelCase or snake_case depending on Claude.ai version
interface LimitBlock {
  used?: number
  limit?: number
  resetsAt?: string
  reset_at?: string
  resets_at?: string
}

interface ClaudeUsageRaw {
  // camelCase
  messageLimit?: LimitBlock
  weeklyMessageLimit?: LimitBlock
  // snake_case
  message_limit?: LimitBlock
  weekly_message_limit?: LimitBlock
}

function calcPct(used: number | undefined, limit: number | undefined): number {
  if (!limit) return 0
  return Math.min(100, Math.max(0, ((used ?? 0) / limit) * 100))
}

function resetAt(block: LimitBlock): string | null {
  return block.resetsAt ?? block.resets_at ?? block.reset_at ?? null
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
  console.log('[claude-usage-gauge] raw usage response:', JSON.stringify(raw))

  const session = raw.messageLimit ?? raw.message_limit ?? {}
  const weekly = raw.weeklyMessageLimit ?? raw.weekly_message_limit ?? {}

  const sessionPct = calcPct(session.used, session.limit)
  const weeklyPct = calcPct(weekly.used, weekly.limit)
  const remaining =
    session.limit != null && session.used != null ? session.limit - session.used : null

  return {
    session: {
      percentage: Math.round(sessionPct),
      messagesRemaining: remaining,
      resetsAt: resetAt(session),
    },
    weekly: {
      percentage: Math.round(weeklyPct),
      resetsAt: resetAt(weekly),
    },
    lastUpdated: new Date().toISOString(),
    error: null,
  }
}
