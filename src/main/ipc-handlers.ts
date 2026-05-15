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
    loginWin.loadURL('https://claude.ai/login')

    await new Promise<void>((resolve) => {
      let settled = false

      const extractAndFinish = async (): Promise<void> => {
        if (settled) return
        try {
          const loginSession = session.fromPartition(LOGIN_PARTITION)
          // Get ALL cookies — don't filter by name; claude.ai may use any name
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

          // Prefer lastActiveOrg cookie — Claude.ai sets this to the org UUID the API expects
          const lastActiveOrg = cookies.find((c) => c.name === 'lastActiveOrg')
          let orgId = lastActiveOrg?.value ?? ''

          // Fall back to /api/bootstrap if the cookie didn't have it
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
                console.log('[claude-usage-gauge] bootstrap response:', JSON.stringify(data).slice(0, 800))
                const org =
                  (data['organization'] as Record<string, unknown> | undefined) ??
                  (data['organizations'] as Record<string, unknown>[] | undefined)?.[0] ??
                  (
                    (data['account'] as Record<string, unknown> | undefined)?.['memberships'] as
                      | Record<string, unknown>[]
                      | undefined
                  )?.[0]?.['organization'] as Record<string, unknown> | undefined
                // Prefer uuid over numeric id — usage endpoint requires UUID
                const rawId = org?.['uuid'] ?? org?.['id']
                orgId = rawId != null ? String(rawId) : ''
              }
            } catch {
              // orgId stays empty; first poll will surface the error
            }
          }
          console.log('[claude-usage-gauge] orgId:', orgId || '(empty)')

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
