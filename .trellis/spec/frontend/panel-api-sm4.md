# Panel API Paths + SM4 (UI)

> Browser calls: fixed `GET /config`, dynamic passport/user/admin prefixes, action aliases from `VITE_SM4_KEY`, body/`X-A` SM4.
> Backend: sibling `v2board-java-api/.trellis/spec/backend/panel-api-sm4.md` + `public-site-config.md`.

---

## Scenario: Bootstrap bases then call encrypted APIs

### 1. Scope / Trigger

- Trigger: Any login/user/admin API after anti-fingerprint cutover.
- Symptom if broken: `/api/v1/passport|user|admin` (404); missing `VITE_SM4_KEY`; classic action names on wire; JWT as `Authorization`.

### 2. Signatures

```ts
// src/api/paths.ts
export const PUBLIC_CONFIG_PATH = '/config'
setApiBases(passport, user, _publicPath?, admin?)
apiUrl(zone, classicPath) // always aliases
deriveActionAlias(zone, classicRel)
isPanelEncryptedUrl(url)

// src/api/site.ts — fetchPublicSiteConfig(): GET /config → decrypt → setApiBases
// src/api/http.ts — request(..., { auth?, panelSm4? })
// src/api/sm4.ts — envelope + compact; Env: VITE_SM4_KEY
```

### 3. Contracts

| Step | Rule |
|------|------|
| Bootstrap | `GET /config` only |
| After decrypt | `setApiBases(passport, user, undefined, admin)` |
| Business URLs | `apiUrl(zone, '/order/fetch')` — source classicRel; **wire** `{prefix}/{12hex}` |
| Auth on SM4 URL | `X-A` compact SM4 of JWT; strip `Authorization` |
| JSON body | Encrypt to `{iv,payload}` |
| Response | Expect envelope (plaintext error `code`/`message` allowed on fail-closed) |
| Payment notify | **Not** a browser `apiUrl` call — admin copies server-built `notify_url` (plaintext `/g/...`) |

Vite proxy: `/config`, `/p/`, `/u/`, `/a/`, `/n/`, `/g/` → API.

### 4. Validation & Error Matrix

| Condition | Behavior |
|-----------|----------|
| `apiUrl` before `setApiBases` | Throw「…API 前缀尚未加载」 |
| Missing `VITE_SM4_KEY` | `deriveActionAlias` / SM4 throw |
| Response not envelope on SM4 URL | Throw「响应不是 SM4 信封」 (unless plaintext error) |
| Form-urlencoded on SM4 URL | Throw「加密区请使用 JSON 请求体」 |

### 5. Good/Base/Bad Cases

- Good: Network shows `/config` + `{prefix}/{12hex}` only — no `getSubscribe`/`fetch`/`info` path segments.
- Base: `VITE_SM4_KEY=0123456789abcdef` → `user/getSubscribe` alias `59327a5e63c5`.
- Bad: `getUserBase() + '/getSubscribe'`; hard-code `/api/v1/...`.

### 6. Tests Required

- Manual: Network aliases + envelopes + `X-A`
- Manual: classic `/api/v1/user/...` and `{prefix}/getSubscribe` → 404
- Interop: FE alias matches Java `PanelApiActionAliasesTest` locked vector

### 7. Wrong vs Correct

#### Wrong

```ts
await request(getUserBase() + '/getSubscribe')
```

#### Correct

```ts
await request(apiUrl('user', '/getSubscribe'))
```

---

## Scenario: Action alias derivation (UI)

### 1. Scope / Trigger

- Must match backend `PanelApiActionAliases` byte-for-byte.

### 2. Signatures

```ts
// paths.ts + sha256.ts
normalizeClassicRel(path)
deriveActionAlias(zone, classicRel)
// SHA-256(UTF-8(VITE_SM4_KEY) || 0x00 || zone || 0x00 || classicRel).hex.slice(0,12)
apiUrl(zone, classicPath) // base + '/' + deriveActionAlias(...)
```

### 3. Contracts

| Item | Rule |
|------|------|
| Input | Null-byte separators (not a single string with escaped `\0` text) |
| Dynamic paths | Hash **concrete** rel: `/server/${type}/save` → `server/vmess/save` |
| Catalog | Backend must list that concrete path in `PanelApiActionCatalog` |

### 4. Validation & Error Matrix

| Condition | Behavior |
|-----------|----------|
| Empty `VITE_SM4_KEY` | Throw |
| Key mismatch with API | 404 (unknown alias) or decrypt fail |

### 5. Good/Base/Bad Cases

- Good: Dev key vector `59327a5e63c5` for `getSubscribe`.
- Bad: Hash `zone + classicRel` without `0x00` separators.

### 6. Tests Required

- Locked vector vs Java unit test
- Manual Network after login

### 7. Wrong vs Correct

#### Wrong

```ts
sha256HexUtf8(`${key}\0${zone}\0${rel}`) // if engine drops/mis-encodes nulls — prefer byte concat
```

#### Correct

```ts
// Uint8Array: keyBytes + 0x00 + zoneBytes + 0x00 + relBytes → sha256Hex → slice(0,12)
```

---

## Scenario: Admin payment notify prefix (config only)

### 1. Scope / Trigger

- Operators change `site.payment_notify_prefix`; gateways need updated plaintext `notify_url`.

### 2. Signatures

- `SiteConfig.payment_notify_prefix` — `src/api/admin/config.ts`
- UI row in `AdminSystemConfigView.vue` (generate `/g/`+12)
- Payments list displays server `notify_url` (already built by API)

### 3. Contracts

| Item | Rule |
|------|------|
| Wire to gateway | `{prefix}/{method}/{uuid}` plaintext — **not** via `apiUrl` / SM4 |
| After save | Remind ops to update gateway callbacks if prefix changed |
| Vite | Proxy `/g/` for local smoke tests |

### 4–7

See backend payment-notify scenario. Wrong: invent notify URL in Vue. Correct: copy `notify_url` from payment fetch.

---

## Design Decision: Fixed `/config` in source

**Decision**: Hardcode `PUBLIC_CONFIG_PATH = '/config'`. Reverse proxy must forward `/config`.

---

## Common Mistake: Confusing panel key with node key

**Fix**: `VITE_SM4_KEY` ↔ panel only; node uses `ApiKey` / `server_token`.
