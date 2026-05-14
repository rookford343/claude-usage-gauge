# Data Sources

## Claude.ai usage endpoint

**URL:** `GET https://claude.ai/api/organizations/{orgId}/usage`

**Auth:** `Cookie: sessionKey=<value>` header

**Polling cadence:** Every 60 seconds (configurable: 30s, 60s, 120s, 300s); also polled immediately on launch and on manual refresh.

**Response shape (observed from Chrome extension reverse-engineering):**
```json
{
  "messageLimit": {
    "used": 42,
    "limit": 100,
    "resetsAt": "2026-05-14T20:00:00.000Z",
    "type": "5_hour_window"
  },
  "weeklyMessageLimit": {
    "used": 78,
    "limit": 100,
    "resetsAt": "2026-05-19T00:00:00.000Z"
  }
}
```

**Important:** This endpoint is internal and undocumented. Anthropic may change the response shape without notice. The app parses defensively — if any field is missing, it defaults to 0 rather than crashing.

**Computed values:**
- `percentage = (used / limit) * 100`, clamped 0–100
- `messagesRemaining = limit - used` (shown in Full View)
- `resetsAt` is used to compute countdown timers

## Claude.ai bootstrap endpoint

**URL:** `GET https://claude.ai/api/bootstrap`

**Auth:** `Cookie: sessionKey=<value>` header

**Purpose:** Fetches the user's `orgId` immediately after login. The `orgId` is required to call the usage endpoint.

**Parsed fields:** `data.organization.id` or `data.organizations[0].id`

Called once during auth setup; result is encrypted and stored.

## Anthropic API — model list (key validation)

**URL:** `GET https://api.anthropic.com/v1/models`

**Auth:** `x-api-key: <key>` header + `anthropic-version: 2023-06-01`

**Purpose:** Validates that the entered API key is active.

- 200 → key is valid
- 401 → key is invalid or expired

Called once when the user saves an API key.

## Anthropic API — rate limits (admin keys only)

**URL:** `GET https://api.anthropic.com/v1/organizations/rate_limits`

**Auth:** `x-api-key: <admin-key>` header + `anthropic-version: 2023-06-01`

**Purpose:** Retrieves organization rate limit information.

**Only called if** the API key starts with `sk-ant-admin`. Standard keys (`sk-ant-api03-*`) skip this call.

## Local storage (no network)

**7-day usage history** is stored locally in `~/Library/Application Support/claude-usage-bar/history.json`. One entry per day, containing the peak session and weekly percentage seen that day. No data leaves the device.

**Preferences** (display style, poll interval) are stored in `~/Library/Application Support/claude-usage-bar/prefs.json`. No data leaves the device.
