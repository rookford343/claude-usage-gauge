# Changelog

## v1.1.2 — 2026-05-15

### Bug Fixes
- **Dual-donut text clipping** — "88%" and "100%" no longer get cut off on both sides. Canvas width increased from 168→200px (84→100pt rendered), donut centers shifted outward to maintain ring spacing, percentage font sized to 20px so three-digit values fit comfortably in the wider number zones.

## v1.1.1 — 2026-05-15

### Bug Fixes
- **Lock screen / sleep** — gauge no longer resets to 0% when the computer locks or sleeps. Last known session and weekly percentages are preserved across transient network errors; only a confirmed session expiry clears them. The gauge now triggers an immediate poll on screen unlock and system resume, so data is fresh within seconds of unlocking instead of up to 60s later.
- **Notification detail** — notification banners now show meaningful content without expanding. Session or weekly type and percentage are in the title (`Session: 87%`); the crossed threshold is in the subtitle (`Above 80% threshold`). Session and weekly notifications no longer group together in Notification Center.

## v1.1.0 — 2026-05-15

### Features
- Desktop notifications at 80% and 95% usage (session and weekly) — fires once per threshold crossing, resets when usage drops back below
- Auto-launch on macOS login via System Settings Login Items toggle in Settings
- Tray icon theme: System (auto) / Dark / Light — updates automatically when OS switches
- Export 7-day usage history as CSV via standard save dialog

## v1.0.0 — 2026-05-14

### Features
- Donut gauge tray icon with green/yellow/red color thresholds
- All 4 display styles: Donut, Dual Donut, Dual Numbers, Battery Bar
- Mini popup — dual gauges, reset countdowns, refresh + quit buttons
- Full View — progress bars, 7-day weekly history, API key status, settings
- In-app WebView login with automatic session token extraction
- safeStorage credential encryption via macOS Keychain
- Configurable poll interval (30s / 60s / 2m / 5m)
- Right-click tray menu with Quit confirmation

## v0.1.0 — 2026-05-14

Initial release.

### Features
- macOS menu bar tray icon with donut gauge (4 selectable display styles)
- Mini popup: dual session + weekly gauges with reset countdowns
- Full view: progress bars, 7-day usage history grid, Anthropic API status, settings
- First-run auth via in-app WebView login to claude.ai
- 60s polling of Claude.ai usage endpoint (configurable: 30s–5m)
- Anthropic API key support (validation + admin rate limits)
- Credentials encrypted via macOS Keychain through Electron's `safeStorage`
- 7-day local usage history stored in electron-store

### Known limitations
- No App Store distribution (unsigned .dmg, personal use)
- No auto-launch on login
- Single Claude.ai account only (no multi-account)
- claude.ai usage endpoint is undocumented; may break if Anthropic changes the API
