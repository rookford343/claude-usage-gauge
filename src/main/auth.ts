import { safeStorage } from 'electron'
import Store from 'electron-store'

const store = new Store()

const KEYS = {
  session: 'enc_session_key',
  orgId: 'enc_org_id',
  apiKey: 'enc_api_key',
  cookieName: 'cookie_name',
} as const

// Prefix stored alongside base64 so decrypt knows which path to take
const SAFE_PREFIX = 'safe:'
const B64_PREFIX = 'b64:'

function encrypt(value: string): string {
  if (safeStorage.isEncryptionAvailable()) {
    return SAFE_PREFIX + safeStorage.encryptString(value).toString('base64')
  }
  // macOS 26.5 beta — keychain bindings not yet initialized; fall back to base64.
  // Not cryptographically secure; acceptable only for dev/beta environments.
  console.warn('[claude-usage-gauge] safeStorage unavailable — credentials stored as base64 (dev/beta only)')
  return B64_PREFIX + Buffer.from(value).toString('base64')
}

function decrypt(encoded: string): string | null {
  try {
    if (encoded.startsWith(B64_PREFIX)) {
      return Buffer.from(encoded.slice(B64_PREFIX.length), 'base64').toString('utf8')
    }
    // Legacy entries without prefix and new safe: entries both go through safeStorage
    const b64 = encoded.startsWith(SAFE_PREFIX) ? encoded.slice(SAFE_PREFIX.length) : encoded
    return safeStorage.decryptString(Buffer.from(b64, 'base64'))
  } catch {
    return null
  }
}

export function hasCredentials(): boolean {
  return store.has(KEYS.session) && store.has(KEYS.orgId)
}

export function getCredentials(): { sessionKey: string; orgId: string; cookieName: string } | null {
  const encSession = store.get(KEYS.session) as string | undefined
  const encOrgId = store.get(KEYS.orgId) as string | undefined
  if (!encSession || !encOrgId) return null
  const sessionKey = decrypt(encSession)
  const orgId = decrypt(encOrgId)
  if (!sessionKey || !orgId) return null
  const cookieName = (store.get(KEYS.cookieName) as string | undefined) ?? 'sessionKey'
  return { sessionKey, orgId, cookieName }
}

export function storeCredentials(sessionKey: string, orgId: string, cookieName = 'sessionKey'): void {
  store.set(KEYS.session, encrypt(sessionKey))
  store.set(KEYS.orgId, encrypt(orgId))
  store.set(KEYS.cookieName, cookieName)
}

export function clearCredentials(): void {
  store.delete(KEYS.session)
  store.delete(KEYS.orgId)
}

export function getApiKey(): string | null {
  const enc = store.get(KEYS.apiKey) as string | undefined
  if (!enc) return null
  return decrypt(enc)
}

export function storeApiKey(key: string): void {
  store.set(KEYS.apiKey, encrypt(key))
}

export function clearApiKey(): void {
  store.delete(KEYS.apiKey)
}
