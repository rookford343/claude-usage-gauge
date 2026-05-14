# Changelog

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
