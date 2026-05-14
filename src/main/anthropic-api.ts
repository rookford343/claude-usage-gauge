import type { ApiStatus } from './types'

const BASE = 'https://api.anthropic.com'
const VERSION_HEADER = { 'anthropic-version': '2023-06-01' }

export async function validateApiKey(key: string): Promise<ApiStatus> {
  try {
    const res = await fetch(`${BASE}/v1/models`, {
      headers: { 'x-api-key': key, ...VERSION_HEADER },
    })

    if (res.status === 401) return { status: 'invalid', isAdmin: false, rateLimits: null }
    if (!res.ok) return { status: 'invalid', isAdmin: false, rateLimits: null }

    const isAdmin = key.startsWith('sk-ant-admin')
    const rateLimits = isAdmin ? await fetchRateLimits(key) : null

    return { status: 'valid', isAdmin, rateLimits }
  } catch {
    return { status: 'invalid', isAdmin: false, rateLimits: null }
  }
}

export async function fetchRateLimits(adminKey: string): Promise<unknown | null> {
  try {
    const res = await fetch(`${BASE}/v1/organizations/rate_limits`, {
      headers: { 'x-api-key': adminKey, ...VERSION_HEADER },
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}
