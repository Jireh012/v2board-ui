# Panel API Paths + SM4 (UI)

> Browser calls use dynamic passport/user/admin prefixes from public config, fixed `GET /config`, and panel `VITE_SM4_KEY`.
> Backend contract: sibling repo `v2board-java-api/.trellis/spec/backend/panel-api-sm4.md` + `public-site-config.md`.

---

## Scenario: Bootstrap bases then call encrypted APIs

### 1. Scope / Trigger

- Trigger: Any login/user/admin API after anti-fingerprint cutover.
- Symptom if broken: requests hit `/api/v1/passport|user|admin` (404); missing `VITE_SM4_KEY`; JWT still sent as `Authorization`.

### 2. Signatures

```ts
// src/api/paths.ts
export const PUBLIC_CONFIG_PATH = '/config' // fixed; match ConfigService.FIXED_PUBLIC_CONFIG_PATH
setApiBases(passport, user, _publicPath?, admin?)
apiUrl(zone: 'passport'|'user'|'admin', path: string)
isPanelEncryptedUrl(url: string)

// src/api/site.ts
fetchPublicSiteConfig() // GET /config → decrypt outer envelope → setApiBases

// src/api/http.ts
request<T>(url, init?, { auth?, panelSm4? })

// src/api/sm4.ts
encryptToEnvelope / decryptFromEnvelope / encryptToCompact
// Env: VITE_SM4_KEY (same material as API SM4_KEY)
```

### 3. Contracts

| Step | Rule |
|------|------|
| Bootstrap | `GET /config` only — **no** `VITE_PUBLIC_CONFIG_PATH` |
| After decrypt | `setApiBases(passport_api_prefix, user_api_prefix, undefined, admin_api_prefix)` |
| Business URLs | `apiUrl('user', '/order/fetch')` etc. — never hard-code `/api/v1/...` for panel zones |
| Auth on SM4 URL | Header `X-A` = compact SM4 of JWT; strip `Authorization` |
| JSON body on SM4 URL | Encrypt whole string body to `{iv,payload}` |
| Response | Expect envelope; decrypt → `ApiResponse`; fail-closed plaintext errors may surface `message` |
| Plaintext | Guest payment/telegram / subscribe — `panelSm4: false` or URL outside `isPanelEncryptedUrl` |

Vite must proxy `/config` (and optionally prefix patterns) to the API in dev.

### 4. Validation & Error Matrix

| Condition | Behavior |
|-----------|----------|
| `apiUrl` before `setApiBases` | Throw「…API 前缀尚未加载」 |
| Missing/invalid `VITE_SM4_KEY` | Encrypt/decrypt throws; bootstrap falls back brand |
| Response not envelope on SM4 URL | Throw「响应不是 SM4 信封」(unless plaintext error `code`/`message`) |
| `x-www-form-urlencoded` on SM4 URL | Client throw「加密区请使用 JSON 请求体」 |

### 5. Good/Base/Bad Cases

- Good: loadSiteBrand → bases set → `request(apiUrl('passport', '/auth/login'), …)` with envelope.
- Base: Dev `VITE_SM4_KEY=0123456789abcdef` matches API.
- Bad: `fetch('/api/v1/user/...')`; send Bearer on encrypted URL; reintroduce env public path.

### 6. Tests Required

- Manual: Network tab shows `/config` + `/p|u|a/...` only; bodies are envelopes; `X-A` present when logged in.
- Manual: classic `/api/v1/user/...` → 404 through Vite proxy.

### 7. Wrong vs Correct

#### Wrong

```ts
await request('/api/v1/passport/auth/login', { method: 'POST', body: JSON.stringify(form) })
// Authorization: Bearer <jwt>
```

#### Correct

```ts
await loadSiteBrand() // sets bases from /config
await request(apiUrl('passport', '/auth/login'), {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(form),
}, { auth: false })
// Logged-in calls: http.ts sets X-A automatically
```

---

## Design Decision: Fixed `/config` in source

**Context**: UI cannot know random public path before first fetch.

**Decision**: Hardcode `PUBLIC_CONFIG_PATH = '/config'`; remove admin “公开配置路径” and env override. Reverse proxy must forward `/config`.

---

## Common Mistake: Confusing panel key with node key

**Symptom**: UI decrypt fails after rotating 通讯密钥, or node fails after rotating `SM4_KEY`.

**Fix**: `VITE_SM4_KEY` ↔ panel only; node uses `ApiKey` / `server_token` derive (no Vite env).
