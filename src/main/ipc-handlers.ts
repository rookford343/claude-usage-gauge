import { ipcMain, BrowserWindow, session, app } from 'electron'
import { join } from 'path'
import type { Menubar } from 'menubar'
import type { Poller } from './poller'
import * as auth from './auth'
import * as anthropicApi from './anthropic-api'
import { getHistory } from './history-store'
import { drawTrayIcon } from './tray-renderer'
import type { DisplayStyle } from './types'
import Store from 'electron-store'

const prefsStore = new Store({ name: 'prefs' })
const LOGIN_PARTITION = 'persist:login'

export function registerIpcHandlers(mb: Menubar, poller: Poller): void {
  ipcMain.handle('has-credentials', () => auth.hasCredentials())

  ipcMain.handle('start-login', async () => {
    const loginWin = new BrowserWindow({
      width: 600,
      height: 720,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        partition: LOGIN_PARTITION,
      },
    })
    // Intercept in-flight requests from the WebView BEFORE loading the page.
    // Claude.ai's app makes requests to /api/organizations/<uuid>/... after login —
    // capture the UUID directly from those URLs (same method the Chrome extension uses).
    const loginPartitionSession = session.fromPartition(LOGIN_PARTITION)
    let capturedOrgUuid = ''
    // UUID regex: standard (8-4-4-4-12 with dashes) or simple (32 hex, no dashes)
    const UUID_RE = /\/organizations\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|[0-9a-f]{32})/i

    loginPartitionSession.webRequest.onBeforeSendHeaders(
      { urls: ['https://claude.ai/api/organizations/*'] },
      (details, callback) => {
        if (!capturedOrgUuid) {
          const match = details.url.match(UUID_RE)
          if (match) {
            // Strip dashes — API expects simple 32-char format
            capturedOrgUuid = match[1].replace(/-/g, '')
            console.log('[claude-usage-gauge] captured org UUID from browser request:', capturedOrgUuid)
          }
        }
        callback({ requestHeaders: details.requestHeaders })
      },
    )

    loginWin.loadURL('https://claude.ai/login')

    await new Promise<void>((resolve) => {
      let settled = false

      const extractAndFinish = async (): Promise<void> => {
        if (settled) return
        try {
          // Wait briefly for the WebView to fire its initial API calls and populate capturedOrgUuid
          await new Promise((r) => setTimeout(r, 1500))

          const loginSession = session.fromPartition(LOGIN_PARTITION)
          const cookies = await loginSession.cookies.get({ url: 'https://claude.ai' })
          console.log('[claude-usage-gauge] cookies available:', cookies.map((c) => c.name))

          // Try known session cookie names, then fall back to longest-value cookie
          const sessionCookie =
            cookies.find((c) => c.name === 'sessionKey') ??
            cookies.find((c) => c.name === '__ssid') ??
            cookies.find((c) => c.name === 'session') ??
            cookies.find((c) => c.name.toLowerCase().includes('session') && c.value.length > 20) ??
            cookies.sort((a, b) => b.value.length - a.value.length)[0]

          if (!sessionCookie || sessionCookie.value.length < 10) return

          settled = true
          const sessionKey = sessionCookie.value
          const cookieName = sessionCookie.name
          console.log('[claude-usage-gauge] using cookie:', cookieName)

          // Primary: UUID captured from in-flight browser requests (most reliable)
          let orgId = capturedOrgUuid

          // Fallback: /api/bootstrap — log full response so we can debug field names
          if (!orgId) {
            try {
              const bsRes = await fetch('https://claude.ai/api/bootstrap', {
                headers: {
                  Cookie: `${cookieName}=${sessionKey}`,
                  Accept: 'application/json',
                  Origin: 'https://claude.ai',
                  Referer: 'https://claude.ai/',
                  'User-Agent':
                    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                },
              })
              if (bsRes.ok) {
                const data = (await bsRes.json()) as Record<string, unknown>
                console.log('[claude-usage-gauge] bootstrap response:', JSON.stringify(data).slice(0, 1200))
                // Look for any string value that looks like a UUID anywhere in the response
                const jsonStr = JSON.stringify(data)
                const uuidMatch = jsonStr.match(/"([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})"/i)
                if (uuidMatch) {
                  orgId = uuidMatch[1].replace(/-/g, '')
                  console.log('[claude-usage-gauge] found UUID in bootstrap:', orgId)
                }
              }
            } catch {
              // orgId stays empty; poll will surface the error
            }
          }
          console.log('[claude-usage-gauge] orgId:', orgId || '(empty — reconnect needed)')

          auth.storeCredentials(sessionKey, orgId, cookieName)
          await loginSession.clearStorageData()
          if (!loginWin.isDestroyed()) loginWin.close()

          // Show the menubar window and send auth-complete
          mb.showWindow()
          setTimeout(() => {
            mb.window?.webContents.send('auth-complete')
          }, 300)

          poller.start()
          resolve()
        } catch (err) {
          console.log('[claude-usage-gauge] extractAndFinish error:', err)
        }
      }

      // Fire on full-page navigation (login redirect to chat)
      loginWin.webContents.on('did-navigate', (_, url) => {
        console.log('[claude-usage-gauge] navigated to:', url)
        if (!url.includes('/login') && !url.includes('/signup')) {
          void extractAndFinish()
        }
      })

      // Fire on SPA in-page navigation
      loginWin.webContents.on('did-navigate-in-page', (_, url) => {
        if (!url.includes('/login') && !url.includes('/signup')) {
          void extractAndFinish()
        }
      })

      loginWin.on('closed', () => {
        resolve()
      })
    })
  })

  ipcMain.handle('clear-auth', () => {
    auth.clearCredentials()
    poller.stop()
  })

  ipcMain.handle('get-usage', () => poller.getCurrentUsage())

  ipcMain.handle('force-refresh', () => poller.forceRefresh())

  ipcMain.handle('open-full-view', () => {
    const rendererUrl = process.env['ELECTRON_RENDERER_URL']
    const preloadPath = rendererUrl
      ? join(__dirname, '../preload/index.js')
      : join(app.getAppPath(), 'out/preload/index.js')

    const win = new BrowserWindow({
      width: 480,
      height: 560,
      titleBarStyle: 'hiddenInset',
      resizable: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false,
        preload: preloadPath,
      },
    })

    if (rendererUrl) {
      win.loadURL(`${rendererUrl}#full`)
    } else {
      win.loadFile(join(app.getAppPath(), 'out/renderer/index.html'), { hash: 'full' })
    }
  })

  ipcMain.handle('set-api-key', async (_event, key: string) => {
    const status = await anthropicApi.validateApiKey(key)
    if (status.status === 'valid') auth.storeApiKey(key)
    return status
  })

  ipcMain.handle('get-api-status', async () => {
    const key = auth.getApiKey()
    if (!key) return { status: 'unconfigured', isAdmin: false, rateLimits: null }
    return anthropicApi.validateApiKey(key)
  })

  ipcMain.handle('get-history', () => getHistory())

  ipcMain.handle('set-display-style', (_event, style: DisplayStyle) => {
    prefsStore.set('displayStyle', style)
    poller.setDisplayStyle(style)
    const usage = poller.getCurrentUsage()
    if (usage && mb.tray) {
      mb.tray.setImage(drawTrayIcon(usage.session.percentage, style, usage.weekly.percentage))
    }
  })

  ipcMain.handle('set-poll-interval', (_event, seconds: number) => {
    prefsStore.set('pollInterval', seconds)
    poller.setIntervalSeconds(seconds)
  })
}
