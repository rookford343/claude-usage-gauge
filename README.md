# Claude Usage Bar

A macOS menu bar app that shows your Claude AI usage limits at a glance — no browser tab required.

## Features

- **Donut gauge tray icon** — fills clockwise as session usage climbs; turns green → yellow → red
- **4 display styles** — Donut (default), Dual Donut, Dual Numbers, Battery Bar (switchable in settings)
- **Mini popup** — click the tray icon for dual session + weekly gauges with reset countdowns
- **Full view** — expanded window with progress bars, 7-day usage history, Anthropic API key status, and settings
- **Auto-polls every 60s** — configurable from 30s to 5m
- **Secure by design** — all credentials encrypted via macOS Keychain through Electron's `safeStorage` API

## Requirements

- macOS 12+ (Apple Silicon or Intel)
- [Bun](https://bun.sh) for development

## Installation (development)

```bash
git clone <this-repo>
cd claude-usage-bar
bun install
bun run dev
```

A tray icon appears in your menu bar. Click it to connect your Claude.ai account.

## First-run setup

1. Click the tray icon → **Connect Claude.ai**
2. A login window opens — sign in to your Claude.ai account
3. The app extracts your session automatically and closes the login window
4. Usage data appears immediately

Optionally, add an Anthropic API key in Settings for API status display.

## Build

```bash
bun run build        # Builds app + creates .dmg in release/
bun run build:app    # Builds app only (no packaging)
bun run typecheck    # TypeScript type check
```

The `.dmg` is unsigned (personal use). macOS will ask you to approve it on first launch via System Preferences → Security & Privacy.

## Project structure

```
src/
├── main/           Electron main process (Node.js)
│   ├── index.ts    Entry: menubar setup, app lifecycle
│   ├── auth.ts     safeStorage credential management
│   ├── claude-web.ts  Claude.ai usage API client
│   ├── anthropic-api.ts  Anthropic API validation
│   ├── poller.ts   60s polling + IPC broadcast
│   ├── tray-renderer.ts  Canvas tray icon drawing
│   ├── history-store.ts  7-day usage history
│   └── ipc-handlers.ts   IPC channel registrations
├── preload/
│   └── index.ts    contextBridge exposing IPC to renderer
└── renderer/       React UI (browser context)
    ├── main.tsx    ReactDOM entry
    ├── bridge.d.ts Window type declarations
    └── components/
        ├── App.tsx       Route: setup vs mini vs full view
        ├── Setup.tsx     First-run auth flow
        ├── MiniView.tsx  320×240 tray popup
        ├── FullView.tsx  480×560 expanded window
        ├── DonutGauge.tsx  SVG donut gauge component
        ├── UsageBar.tsx    Horizontal progress bar
        └── HistoryGrid.tsx 7-day history grid
```

## Security

See [docs/SECURITY.md](docs/SECURITY.md) for details on credential storage, network requests, and the security model.

## Data sources

See [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md) for the Claude.ai endpoints polled, response shapes, and update cadence.
