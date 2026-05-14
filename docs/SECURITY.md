# Security Model

## Credential storage

All sensitive values — the Claude.ai `sessionKey` cookie, `orgId`, and any Anthropic API key — are stored **encrypted at rest** using Electron's built-in [`safeStorage` API](https://www.electronjs.org/docs/latest/api/safe-storage).

### How safeStorage works

`safeStorage.encryptString(value)` encrypts the string using the OS-level keychain:
- **macOS**: The encryption key is stored in the system Keychain, protected by the user's login credentials
- The resulting Buffer is base64-encoded and saved to `electron-store`

`safeStorage.decryptString(buf)` decrypts only when the app is running under the same user account that encrypted the data.

### What this means in practice

- The `electron-store` JSON file on disk (at `~/Library/Application Support/claude-usage-bar/`) contains only opaque base64 blobs — not plaintext session tokens or API keys
- No credential can be read from the store file without the macOS Keychain
- Credentials are never written to logs, console output, or error messages

## Renderer sandbox

The renderer (the popup UI) runs in a sandboxed browser context:
- `nodeIntegration: false` — renderer cannot call Node.js APIs directly
- `contextIsolation: true` — renderer has no access to Electron internals
- All credential access goes through a narrow `contextBridge` IPC channel (`window.claudeUsage`)
- The preload script exposes only specific named functions — not a generic `ipcRenderer` reference

## Network requests

The app makes exactly two categories of HTTPS requests:

| Destination | Purpose | When |
|------------|---------|------|
| `claude.ai/api/organizations/{orgId}/usage` | Usage limits | Every poll interval (default 60s) |
| `claude.ai/api/bootstrap` | Fetch orgId after login | Once, during auth setup |
| `api.anthropic.com/v1/models` | API key validation | When user saves an API key |
| `api.anthropic.com/v1/organizations/rate_limits` | Admin rate limits | Only if admin API key provided |

**No telemetry. No analytics. No CDN calls. No third-party SDKs.**

All requests use HTTPS only — there are zero HTTP (plaintext) calls in the source.

## Login WebView isolation

The WebView used for Claude.ai login runs in an isolated session partition (`persist:login`). After login:
1. The `sessionKey` cookie is extracted from the partition
2. `session.fromPartition('persist:login').clearStorageData()` is called to wipe all partition data
3. The login window closes

The login session is never merged with the app's default session.

## Content Security Policy

The renderer HTML has a strict CSP:
```
default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'
```

No external scripts, no inline JavaScript execution.

## API keys in headers only

Anthropic API keys are always sent as the `x-api-key` header — never in URLs, query parameters, or path segments. This prevents accidental key exposure in access logs, browser history, or referrer headers.
