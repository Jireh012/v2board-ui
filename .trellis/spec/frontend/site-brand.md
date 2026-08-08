# Site Brand

> Dynamic `app_name` for chrome, login pages, and `document.title`.

---

## Scenario: Consume public site config

### 1. Scope / Trigger

- Trigger: Any UI that shows the product/site name (header, login, invite copy, browser title).
- Source API: `GET /api/v1/passport/comm/config` (unauthenticated; see API `public-site-config.md`).

### 2. Signatures

- `fetchPublicSiteConfig()` in `src/api/site.ts`
- Module state: `appName` + `loadSiteBrand()` in `src/siteBrand.ts`
- Bootstrap: `main.ts` calls `void loadSiteBrand()` (non-blocking mount)

### 3. Contracts

| Item | Value |
|------|--------|
| Request auth | `{ auth: false }` — required to avoid 401 → clearSession on public pages |
| Cache key | `localStorage` `v2board_app_name` |
| Fallback | Cached value → `"V2Board"` |
| Title | `document.title = appName` on init and after fetch |
| Register gate | `stop_register` / `invite_force` → `registerEnabled` / `inviteForce` in `siteBrand.ts` |

Bind `{{ appName }}` in templates; do not hardcode brand strings. Show login→register link only when `registerEnabled`.

### 4. Validation & Error Matrix

| Condition | Behavior |
|-----------|----------|
| Fetch fails | Keep cache / `V2Board`; page still renders |
| Empty `app_name` | Treat as missing → fallback |

### 5. Good/Base/Bad Cases

- Good: After admin saves new name, refresh shows it on `/login` and headers
- Base: First visit with empty cache shows `V2Board` until fetch completes
- Bad: Calling admin `/config/fetch` from login; omitting `auth: false`

### 6. Tests Required

- Manual: change system config `app_name` → refresh login + chrome
- Optional: unit test that `fetchPublicSiteConfig` path uses `auth: false`

### 7. Wrong vs Correct

#### Wrong

```ts
await request('/api/v1/admin/config/fetch') // needs JWT; may leak full config
<span>谜之站点</span>
```

#### Correct

```ts
request('/api/v1/passport/comm/config', {}, { auth: false })
<span>{{ appName }}</span>
```
