# Claude Usage Gauge — User Guide

## Installation

### From DMG (Recommended)

1. Download `Claude Usage Gauge-1.0.0-arm64.dmg` from [Releases](https://github.com/rookford343/claude-usage-gauge/releases)
2. Open the `.dmg` and drag **Claude Usage Gauge** to your Applications folder
3. On first launch, macOS will block the unsigned app — go to **System Settings → Privacy & Security** and click **"Open Anyway"**
4. If still blocked: `xattr -dr com.apple.quarantine /Applications/Claude\ Usage\ Gauge.app`
5. The app appears in your menu bar — no dock icon

### From Source

Requires [Bun](https://bun.sh):

```bash
git clone https://github.com/rookford343/claude-usage-gauge.git
cd claude-usage-gauge
bun install
bun run dev
```

---

## First-run authentication

1. Launch the app (open the installed .app, or `bun run dev` in dev mode)
2. A small icon appears in your macOS menu bar
3. Click the icon → the mini popup appears with a **Connect Claude.ai** button
4. Click it — a login window opens with claude.ai
5. Sign in normally (email + password, Google OAuth, or SSO)
6. The app detects your session automatically and closes the login window
7. Usage data appears within a few seconds

**The app never sees your password.** It only reads the session cookie after login, then discards the login window's data.

## Tray icon guide

| Color | Meaning |
|-------|---------|
| Green | Session usage below 50% |
| Yellow | Session usage 50–80% |
| Red | Session usage above 80% |

The icon fills clockwise (donut/dual-donut styles) or fills segments (battery style) as usage increases.

## Display styles

Switch styles in Settings (Full View → Settings section):

| Style | What it shows |
|-------|--------------|
| **Donut** (default) | Ring arc in the menu bar + native `%` text label to its right (e.g. `🔵 18%`) |
| **Dual Donut** | Two smaller arcs side-by-side — session (left) + weekly (right), labeled S / W |
| **Dual Numbers** | Colored status dot + `42%·78%` text immediately to its right |
| **Battery Bar** | 10-segment horizontal bar — familiar macOS battery look, session usage |

## Mini popup

Click the tray icon to open the mini popup (320×240px):

- **Left donut** — session limit (5-hour window), percentage shown in center
- **Right donut** — weekly limit, percentage shown in center
- **Reset countdowns** — time remaining + exact clock time under each gauge (e.g. `Resets 2h 14m (3:00 pm)`)
  - Session uses countdown + clock time (5-hour window)
  - Weekly uses day + clock time (e.g. `Resets Sun 11:00 pm`)
- **↺ button** — forces an immediate refresh
- **⚙ button / Full View →** — opens the expanded Full View window
- **● dot** — Anthropic API key status (green = valid, red = invalid, gray = not configured)

## Full view

Click **Full View →** or ⚙ to open the expanded 480×560px window:

- **Session Limit** — progress bar + messages remaining estimate + reset time (countdown + exact clock)
- **Weekly Limit** — progress bar + reset day and time (e.g. `Resets Sun 11:00 pm`)
- **Anthropic API** — key validity status. Click "Enter key" to add an API key.
- **Usage History** — 7-day grid showing peak session usage per day
- **Settings** — display style and poll interval; both dropdowns load your last-saved values on open

## Anthropic API key (optional)

Adding an API key lets the app show your Anthropic API key validity. If you have an Admin API key (`sk-ant-admin-*`), it also shows rate limit information.

To add a key:
1. Open Full View
2. Find the **Anthropic API** section
3. Click **Enter key** → paste your key → **Save**

The key is validated against `/v1/models` before being stored.

## Poll interval

Controls how often the app checks Claude.ai for updated usage. Default is 60s.

Available intervals: 30s, 60s, 2m, 5m

Change in Full View → Settings. The setting persists across restarts.

## Troubleshooting

### "Session expired — reconnect" shows in the popup
Your Claude.ai session cookie has expired. Click the tray icon → Setup to log in again.

### Usage shows 0% / no data
- Check that you're connected to the internet
- Try clicking the ↺ refresh button
- If it persists, disconnect and reconnect your account

### Tray icon doesn't appear
- Quit and relaunch the app
- Check System Settings → Privacy & Security if macOS blocked the app on first launch

### App says "Not configured" for API
The Anthropic API key section is optional. If you only use Claude.ai Pro/Max and don't have an Anthropic API key, you can ignore this section entirely.

## Quitting the App

- **Right-click** the tray icon → **Quit Claude Usage Gauge**
- Or: click the tray icon → mini popup → **Quit** (in the footer)

## Disconnecting

Full View → Settings → **Disconnect account** removes all stored credentials and resets the app to first-run state.
