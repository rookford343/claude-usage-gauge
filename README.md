# Claude Usage Gauge

A macOS menu bar app that shows your real-time Claude AI usage limits as a glanceable donut gauge — no browser tab required.

![Security](https://img.shields.io/badge/Credentials-macOS_Keychain-green?style=flat-square&logo=apple)
![Privacy](https://img.shields.io/badge/Telemetry-None-blue?style=flat-square)
![Platform](https://img.shields.io/badge/Platform-macOS_12%2B-lightgrey?style=flat-square&logo=apple)
![Stack](https://img.shields.io/badge/Stack-Electron_%2B_TypeScript_%2B_React-61dafb?style=flat-square&logo=react)

---

## 🌟 Key Features

### 🎯 **Always-On Tray Gauge**

A Canvas-drawn donut gauge lives in your macOS menu bar at all times. It fills clockwise as your session limit climbs, shifting from green → yellow → red at 50% and 80%. No browser, no dashboard — just a glance up and you know where you stand.

### 📊 **Four Display Styles**

Switch between display styles in Settings to match your workflow:

| Style | Description |
|-------|-------------|
| **Donut** *(default)* | Single arc fills clockwise; percentage in the center |
| **Dual Donut** | Outer arc = weekly, inner = session — most data-dense |
| **Dual Numbers** | `42% · 78%` as tray title text — most readable |
| **Battery Bar** | Segmented horizontal fill bar — familiar macOS idiom |

### 🪟 **Mini Popup**

Click the tray icon for a 320×240 popup with:
- **Dual donut gauges** — session (left) and weekly (right) with percentage labels
- **Reset countdowns** — "Resets in 2h 14m" under each gauge
- **Anthropic API key status** — valid / invalid / not configured at a glance
- **Quick refresh** — force a poll without waiting for the interval

### 🖥️ **Full View**

Click "Full View" for a 480×560 expanded window with:
- **Horizontal progress bars** — session and weekly limits with messages-remaining estimate
- **7-day usage history** — per-day peak usage stored locally, no server required
- **Anthropic API section** — key validity; admin keys show rate limit info
- **Settings** — display style, poll interval (30s / 60s / 2m / 5m)

### 🔄 **Smart Polling**

- Polls `claude.ai/api/organizations/{org_id}/usage` every 60 seconds (configurable)
- Polling runs in the main process; interval survives window open/close
- Manual refresh button fires an immediate poll
- On 401 response, transitions to "Session expired — reconnect" without crashing
- Shows "Last updated: Xm ago" when stale so you always know the data age

### 🔒 **Secure by Design**

All credentials encrypted at rest via macOS Keychain through Electron's built-in `safeStorage` API. See [docs/SECURITY.md](docs/SECURITY.md) for full details.

---

## 🚀 Quick Start

### Requirements

- macOS 12+ (Apple Silicon or Intel)
- [Bun](https://bun.sh) (`curl -fsSL https://bun.sh/install | bash`)
- A Claude.ai account (Pro or Max plan)

### Installation

```bash
git clone https://github.com/rookford343/claude-usage-gauge.git
cd claude-usage-gauge
bun install
bun run dev
```

### First-Time Setup

1. A tray icon appears in your menu bar
2. Click it → the Setup screen opens
3. Click **"Connect Claude.ai"** — a login window opens inside the app
4. Sign in to your Claude.ai account
5. The app extracts your session automatically and closes the login window
6. Usage data populates immediately — the donut gauge goes live

Optionally, add an Anthropic API key in Settings for API key status and (with an Admin key) rate limit info.

---

## 🖼️ Display Styles

### 🍩 **Donut (Default)**

The single-arc donut is the default — elegant at 22px and readable at a glance. The arc fills clockwise from 0% (empty) to 100% (full circle). Color shifts automatically:

- 🟢 Green — below 50%
- 🟡 Yellow — 50–80%
- 🔴 Red — above 80%

Hover over the tray icon for a tooltip: `Session: 42% | Resets in 2h 14m`

### 🔄 **Switching Styles**

Open the mini popup → click the gear icon → select a style from the **Display style** dropdown. The tray icon updates immediately.

---

## 🔒 Security Model

| What | How |
|------|-----|
| Claude.ai session token | Encrypted via `safeStorage` (macOS Keychain) — never written to disk as plaintext |
| Anthropic API key | Same `safeStorage` encryption path |
| org_id | Encrypted via `safeStorage` |
| Non-sensitive state (poll interval, history) | `electron-store` plaintext — contains no credentials |
| Network requests | HTTPS only; cert verification always on |
| WebView login partition | Isolated session; cleared after session token extracted |
| Renderer process | Sandboxed — `nodeIntegration: false`, `contextIsolation: true` |
| Outbound requests | Only to `claude.ai` and `api.anthropic.com` — no analytics, no telemetry |

See [docs/SECURITY.md](docs/SECURITY.md) for the full security model and [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md) for a breakdown of every endpoint called.

---

## 🏗️ Project Structure

```
claude-usage-gauge/
├── README.md
├── USER_GUIDE.md
├── CHANGELOG.md
├── electron.vite.config.ts
├── electron-builder.config.ts
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── docs/
│   ├── SECURITY.md          Credential storage, network model, threat surface
│   └── DATA_SOURCES.md      Endpoints, response shapes, poll cadence
├── resources/
│   └── icon.png             App icon (512×512)
└── src/
    ├── main/                Electron main process (Node.js)
    │   ├── index.ts         Entry: menubar init, app lifecycle
    │   ├── auth.ts          safeStorage credential management
    │   ├── claude-web.ts    Claude.ai usage API client
    │   ├── anthropic-api.ts Anthropic API key validation
    │   ├── poller.ts        60s interval poller + IPC broadcast
    │   ├── tray-renderer.ts Canvas tray icon (all 4 display styles)
    │   ├── history-store.ts 7-day usage snapshots via electron-store
    │   └── ipc-handlers.ts  ipcMain channel registrations
    ├── preload/
    │   └── index.ts         contextBridge — exposes narrow IPC to renderer
    └── renderer/            React UI (sandboxed browser context)
        ├── index.html
        ├── main.tsx         ReactDOM entry
        ├── bridge.d.ts      Window type declarations
        └── components/
            ├── App.tsx          Route: setup vs mini vs full view
            ├── Setup.tsx        First-run WebView auth flow
            ├── MiniView.tsx     320×240 tray popup
            ├── FullView.tsx     480×560 expanded window
            ├── DonutGauge.tsx   SVG donut gauge component
            ├── UsageBar.tsx     Horizontal progress bar
            └── HistoryGrid.tsx  7-day usage history grid
```

---

## 🔨 Build

```bash
bun run dev          # Launch in dev mode with hot reload
bun run build        # Build app + create .dmg in release/
bun run build:app    # Build app only (no packaging)
bun run typecheck    # TypeScript type check (0 errors required)
```

The `.dmg` is unsigned (personal use). On first launch, macOS will ask you to approve it:
**System Settings → Privacy & Security → "Open Anyway"**

---

## 🐛 Troubleshooting

**Tray icon doesn't appear after `bun run dev`**

macOS 26 (Sonoma) beta builds have a known incompatibility with Electron's browser-process initialization. If you see `process.type === undefined`, you're on an affected beta. Use macOS 13 (Ventura) or macOS 14 (Sonoma) stable.

**"Session expired — reconnect" after a few hours**

Claude.ai session tokens expire. Click **Reconnect** → sign in again. The app handles this gracefully without crashing.

**Usage data shows "Last updated: Xm ago"**

The poll failed (network issue or session expired). Check your internet connection and that claude.ai is reachable. If the session expired, reconnect via the Setup screen.

**"Invalid API key" for a key that works on claude.ai**

The API status section uses the Anthropic API directly, not claude.ai. Make sure you've entered an Anthropic API key from [console.anthropic.com](https://console.anthropic.com), not a Claude.ai session token.

**App won't open after installing the .dmg**

macOS blocks unsigned apps by default. Go to **System Settings → Privacy & Security** and click **"Open Anyway"** next to the Claude Usage Gauge entry.

```bash
# If still blocked, clear the quarantine flag:
xattr -dr com.apple.quarantine /Applications/Claude\ Usage\ Gauge.app
```

---

## 📄 License

```
Copyright © 2026 Daniel (Dan) Ford

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

---

## 🙏 Acknowledgments

- [Electron](https://electronjs.org) — cross-platform desktop framework
- [menubar](https://github.com/maxogden/menubar) — tray + BrowserWindow lifecycle
- [@napi-rs/canvas](https://github.com/Brooooooklyn/canvas) — Node.js Canvas for tray icon drawing
- [electron-vite](https://electron-vite.org) — fast Vite-based build tooling for Electron
- [electron-store](https://github.com/sindresorhus/electron-store) — simple persistent state
- The Claude Chrome extension `madhogacekcffodccklcahghccobigof` for API endpoint discovery

---

## 📞 Support

- **Bug reports:** [GitHub Issues](https://github.com/rookford343/claude-usage-gauge/issues)
- **Feature requests & discussion:** [GitHub Discussions](https://github.com/rookford343/claude-usage-gauge/discussions)

---

## 🔮 Roadmap

### v0.1.0 — Initial Release ✅
- ✅ Donut gauge tray icon with green/yellow/red color thresholds
- ✅ All 4 display styles (Donut, Dual Donut, Dual Numbers, Battery Bar)
- ✅ Mini popup — dual gauges, reset countdowns, refresh button
- ✅ Full view — progress bars, 7-day history, API key status, settings
- ✅ In-app WebView login with session extraction
- ✅ safeStorage credential encryption (macOS Keychain)
- ✅ 60s polling, configurable interval
- ✅ Security docs, user guide, data source docs

### v0.2.0 — Polish
- 🔔 Optional desktop notifications when limits hit 80% / 95%
- 🚀 Auto-launch on macOS login
- 🎨 Light/dark mode tray icon variants
- 📊 Export usage history to CSV

### v0.3.0 — Power User
- 👥 Multi-account support (switch between Claude.ai accounts)
- 🔑 Improved Anthropic API usage tracking (personal API spend)
- ⚙️ Configurable color thresholds

---

*Built with ❤️ for developers who live in Claude and want their usage limits at a glance — without ever opening a browser tab.*

> *"The best monitoring is the kind you never have to think about."*
