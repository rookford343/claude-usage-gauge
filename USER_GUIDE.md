# Claude Usage Bar — User Guide

## First-run authentication

1. Launch the app (`bun run dev` or open the installed .app)
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

The icon fills clockwise (donut style) or fills segments (battery style) as usage increases.

## Display styles

Switch styles in Settings (Full View → Settings section):

| Style | What it shows |
|-------|--------------|
| **Donut** (default) | Single arc donut — session usage + percentage label |
| **Dual Donut** | Two smaller donuts side-by-side — session (left) + weekly (right) |
| **Dual Numbers** | `42%·78%` text in the menu bar (no image) |
| **Battery Bar** | 8-segment horizontal bar — familiar macOS battery look |

## Mini popup

Click the tray icon to open the mini popup (320×240px):

- **Left donut** — session limit (5-hour window)
- **Right donut** — weekly limit
- **Reset countdowns** — time remaining under each gauge ("Resets in 2h 14m")
- **↺ button** — forces an immediate refresh
- **⚙ button / Full View →** — opens the expanded Full View window
- **● dot** — Anthropic API key status (green = valid, red = invalid, gray = not configured)

## Full view

Click **Full View →** or ⚙ to open the expanded 480×560px window:

- **Session Limit** — progress bar + messages remaining estimate + reset time
- **Weekly Limit** — progress bar + reset day
- **Anthropic API** — key validity status. Click "Enter key" to add an API key.
- **Usage History** — 7-day grid showing peak session usage per day
- **Settings** — display style, poll interval, disconnect button

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

Change in Full View → Settings.

## Troubleshooting

### "Session expired — reconnect" shows in the popup
Your Claude.ai session cookie has expired. Click **Connect Claude.ai** in Setup (the tray popup will show a reconnect button when session is expired) to log in again.

### Usage shows 0% / no data
- Check that you're connected to the internet
- Try clicking the ↺ refresh button
- If it persists, disconnect and reconnect your account

### Tray icon doesn't appear
- Check System Preferences → Privacy & Security → Screen Recording isn't blocking the app (shouldn't be needed, but some configs interfere)
- Quit and relaunch

### App says "Not configured" for API
The Anthropic API key section is optional. If you only use Claude.ai Pro/Max and don't have an Anthropic API key, you can ignore this section.

## Disconnecting

Full View → Settings → **Disconnect account** removes all stored credentials and resets the app to first-run state.
