import { safeStorage } from 'electron'
import Store from 'electron-store'

const store = new Store()

const KEYS = {
  session: 'enc_session_key',
  orgId: 'enc_org_id',
  apiKey: 'enc_api_key',
} as const

function encrypt(value: string): string {
  const buf = safeStorage.encryptString(value)
  return buf.toString('base64')
}

function decrypt(encoded: string): string | null {
  try {
    const buf = Buffer.from(encoded, 'base64')
    return safeStorage.decryptString(buf)
  } catch {
    return null
  }
}

export function hasCredentials(): boolean {
  return store.has(KEYS.session) && store.has(KEYS.orgId)
}

export function getCredentials(): { sessionKey: string; orgId: string } | null {
  const encSession = store.get(KEYS.session) as string | undefined
  const encOrgId = store.get(KEYS.orgId) as string | undefined
  if (!encSession || !encOrgId) return null
  const sessionKey = decrypt(encSession)
  const orgId = decrypt(encOrgId)
  if (!sessionKey || !orgId) return null
  return { sessionKey, orgId }
}

export function storeCredentials(sessionKey: string, orgId: string): void {
  store.set(KEYS.session, encrypt(sessionKey))
  store.set(KEYS.orgId, encrypt(orgId))
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
