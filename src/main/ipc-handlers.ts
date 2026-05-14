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
      const cookiePoller = setInterval(async () => {
        try {
          const loginSession = session.fromPartition(LOGIN_PARTITION)
          const cookies = await loginSession.cookies.get({ url: 'https://claude.ai', name: 'sessionKey' })
          if (cookies.length === 0) return

          const sessionKey = cookies[0]!.value
          clearInterval(cookiePoller)

          // Fetch orgId from bootstrap
          let orgId = ''
          try {
            const res = await fetch('https://claude.ai/api/bootstrap', {
              headers: {
                Cookie: `sessionKey=${sessionKey}`,
                Accept: 'application/json',
                Origin: 'https://claude.ai',
                Referer: 'https://claude.ai/',
                'User-Agent':
                  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
              },
            })
            if (res.ok) {
              const data = (await res.json()) as Record<string, unknown>
              // Try multiple response shapes: {organization: {id}}, {organizations: [{id}]},
              // {account: {memberships: [{organization: {id}}]}}
              const org =
                (data['organization'] as Record<string, unknown> | undefined) ??
                (data['organizations'] as Record<string, unknown>[] | undefined)?.[0] ??
                (
                  (data['account'] as Record<string, unknown> | undefined)?.['memberships'] as
                    | Record<string, unknown>[]
                    | undefined
                )?.[0]?.['organization'] as Record<string, unknown> | undefined
              orgId = (org?.['id'] as string) ?? (org?.['uuid'] as string) ?? ''
            }
          } catch {
            // orgId stays empty; user will see auth error on first poll
          }

          auth.storeCredentials(sessionKey, orgId)

          // Clear login partition so session cookie isn't retained
          await loginSession.clearStorageData()
          loginWin.close()

          mb.window?.webContents.send('auth-complete')
          poller.start()
          resolve()
        } catch {
          // Keep polling
        }
      }, 500)

      loginWin.on('closed', () => {
        clearInterval(cookiePoller)
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
