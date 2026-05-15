import { app, session, Menu, dialog } from 'electron'
import { menubar } from 'menubar'
import { join } from 'path'
import { Poller } from './poller'
import { registerIpcHandlers } from './ipc-handlers'
import { hasCredentials } from './auth'
import { drawTrayIcon } from './tray-renderer'
import Store from 'electron-store'
import type { DisplayStyle } from './types'

const prefsStore = new Store({ name: 'prefs' })

app.whenReady().then(() => {
  // Menu bar only — no dock icon
  app.dock?.hide()
  const displayStyle = (prefsStore.get('displayStyle', 'donut') as DisplayStyle)
  const pollInterval = prefsStore.get('pollInterval', 60) as number

  const initialIcon = drawTrayIcon(0, displayStyle)

  const mb = menubar({
    index: process.env['ELECTRON_RENDERER_URL'] ?? `file://${join(__dirname, '../renderer/index.html')}`,
    icon: initialIcon,
    browserWindow: {
      width: 320,
      height: 240,
      show: false,
      frame: false,
      resizable: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false,
        preload: join(__dirname, '../preload/index.js'),
      },
    },
    preloadWindow: true,
    showOnAllWorkspaces: false,
    windowPosition: 'trayCenter',
  })

  // Apply strict CSP only in production — Vite HMR needs eval/inline in dev
  if (app.isPackaged) {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'",
          ],
        },
      })
    })
  }

  mb.on('ready', () => {
    const poller = new Poller(mb.tray!)
    poller.setDisplayStyle(displayStyle)
    poller.setIntervalSeconds(pollInterval)

    registerIpcHandlers(mb, poller)

    const quitMenu = Menu.buildFromTemplate([
      {
        label: 'Quit Claude Usage Gauge',
        click: async () => {
          const { response } = await dialog.showMessageBox({
            type: 'question',
            buttons: ['Quit', 'Cancel'],
            defaultId: 0,
            cancelId: 1,
            message: 'Quit Claude Usage Gauge?',
          })
          if (response === 0) app.quit()
        },
      },
    ])
    mb.tray!.on('right-click', () => {
      mb.tray!.popUpContextMenu(quitMenu)
    })

    if (hasCredentials()) {
      poller.start()
    }
  })
})
