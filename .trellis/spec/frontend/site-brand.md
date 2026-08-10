# Site Brand & Register Gate

> Dynamic `app_name` plus public register/safe-mode flags and email-verify UX for login/register/forget. Public config is SM4-decrypted client-side.

---

## Scenario: Decrypt public config SM4 envelope

### 1. Scope / Trigger

- Trigger: Fixed `GET /api/config` returns outer `{ iv, payload }` (whole ApiResponse), not plaintext flags.
- Must stay compatible with API `public-site-config.md` (SM4-CBC/PKCS7). Prefix wiring: [panel-api-sm4.md](./panel-api-sm4.md).

### 2. Signatures

- `fetchPublicSiteConfig()` — `src/api/site.ts` → `PUBLIC_CONFIG_PATH` (`/api/config`)
- Env: `VITE_SM4_KEY` only (no public-path env) — same material as backend `SM4_KEY`
- Helpers: `src/api/sm4.ts` (`decryptFromEnvelope`)

### 3. Contracts

| Step | Rule |
|------|------|
| HTTP body | Outer envelope only `iv` + `payload` (base64) |
| After decrypt | `ApiResponse` JSON → use `data` as `PublicSiteConfig`; call `setApiBases(...)` |
| Key | 16 UTF-8 bytes **or** 32 hex |
| Output | Brand/gates + `passport_api_prefix` / `user_api_prefix` / `admin_api_prefix` |

### 4. Validation & Error Matrix

| Condition | Behavior |
|-----------|----------|
| Missing `VITE_SM4_KEY` / bad length | Throw in decrypt; `loadSiteBrand` catch → cached name or empty (no `V2Board`) / flags false |
| Missing `iv`/`payload` | Throw「公开配置响应格式无效」 |
| Wrong key | Decrypt/parse fails → same catch path (no white screen) |

### 5. Good/Base/Bad Cases

- Good: Matching keys → brand + gates load.
- Base: Dev key `0123456789abcdef` on both sides.
- Bad: Treat `data.app_name` as plaintext; named ESM `import { sm4 }` from CJS package without default import.

### 6. Tests Required

- Manual: curl shows envelope only; login page still shows `app_name`.
- Interop: Node `require('sm-crypto')` decrypt against live API (base64→hex).

### 7. Wrong vs Correct

#### Wrong

```ts
const data = await request<PublicSiteConfig>('/api/v1/passport/comm/config', ...)
return data // classic path 404; envelope is not app_name
```

#### Correct

```ts
const data = await fetchPublicSiteConfig() // GET /api/config, decrypt, setApiBases
// data.app_name, data.passport_api_prefix, …
```

---

## Scenario: Consume public site config

### 1. Scope / Trigger

- Trigger: Chrome, login/register pages, invite copy, `document.title` need brand + register gates.
- Source: decrypted `PublicSiteConfig` from `fetchPublicSiteConfig()` (never raw admin config).

### 2. Signatures

- `fetchPublicSiteConfig()` — `src/api/site.ts` (decrypts envelope → `PublicSiteConfig`)
- `appName`, `hasSiteBrand`, `stopRegister`, `inviteForce`, `emailVerify`, `safeMode`, `recaptchaEnable`, `recaptchaSiteKey`, `telegramDiscussLink`, `recaptchaRequired`, `adminBasePath`, `adminUrl()`, `isAdminUiPath()`, `registerEnabled`, `loadSiteBrand()`, `ensureSiteBrand()`, `applyFrontendTheme()` — `src/siteBrand.ts`
- Bootstrap: `main.ts` mounts router **without** awaiting brand; `ensureSiteBrand()` runs in `router.beforeEach` (including decoy, to read `safe_mode_enable`)
- Decoy: only when `safe_mode_enable=1` — logged-out `/` + unmatched paths → `DecoyView.vue`; view itself must not import `siteBrand` / `fetchPublicSiteConfig`. When safe mode off → `/login`
- Forget: `/forget` (`ForgetView.vue`); login link always shown
- User auth guard: `router.beforeEach` — anonymous users only `/login` `/register` `/forget` (always; not gated by `safe_mode_enable`)

### 3. Contracts

| Item | Value |
|------|--------|
| Request auth | `{ auth: false }` |
| Cache | `localStorage` `v2board_app_name`, `v2board_admin_path` |
| Name fallback | cache only (ignore legacy cached `"V2Board"`); else empty — **never** invent product name |
| Brand UI | login/register/forget/admin-login **hide** `app_name` (no `.login-brand`); decoy uses fixed「苍穹云」only |
| Brand load timing | All guarded routes call `ensureSiteBrand()` (single-flight); decoy needs it for `safe_mode_enable` |
| Admin path fallback | cache → `"admin"`; empty/invalid public `secure_path` → `"admin"` |
| Title | `document.title = appName` or neutral `Panel` when empty |
| Static shell | `index.html` initial `<title>` is neutral (`Panel`); favicon `/favicon.svg` — never `V2Board` / Vite default before JS |
| Register entry | show only when `registerEnabled` (`stop_register != 1`) |
| Invite field | required in UI when `inviteForce` |
| Email code on register | show + require when `emailVerify` (`email_verify=1`) |
| Forget password | always available; send code with `isforget=1` |
| User auth | unauthenticated business routes → `/login?redirect=` (always) |
| Admin UI entry | `/{secure_path}` and `/{secure_path}/login` via `/:adminSeg` param routes validated after brand load; admin **REST** uses `admin_api_prefix` from public config (not classic `/api/v1/admin`) |
| reCAPTCHA | when `recaptchaRequired`, Login/Register show v2 widget; submit `recaptcha_data` |
| Frontend theme | `loadSiteBrand` → `applyFrontendTheme(data)` sets `html` `data-theme-sidebar` / `data-theme-header` / `data-theme-color`, CSS `--primary-color` (+ hover/soft), and `--app-bg-image` / `data-app-bg` when URL set |
| Telegram discuss | `telegramDiscussLink` from public `telegram_discuss_link`; Profile shows open-link + unbind when `user.telegram_id` set |
| Theme color map | `default` `#2563eb`, `darkblue` `#1e3a8a`, `black` `#0f172a`, `green` `#059669` |
| Theme scope | User shell (`.app-root`) + login/register/forget; `.admin-root` / `.admin-login-page` reset primary vars — admin UI does not follow personalization |
| Legacy `frontend_theme` | Admin config field only (PHP package name); Vue UI does not switch theme packages |

### 4. Validation & Error Matrix

| Condition | Behavior |
|-----------|----------|
| Fetch/decrypt fails | Keep non-placeholder cached name only; no brand UI / title `Panel`; register flags stay previous/false |
| Empty `app_name` | `appName=""`, hide brand block; do not write cache |
| `stop_register=1` | Hide login→register link; `/register` closed state |
| No `auth_data` | Block `/dashboard` etc.; allow login/register/forget |

### 5. Good/Base/Bad Cases

- Good: Admin sets name + leaves register open → login shows 注册; register works.
- Base: First visit shows cached/fallback name until fetch.
- Bad: Admin config fetch on login; hardcode brand; show register when stopped; read plaintext fields from envelope.

### 6. Tests Required

- Manual: toggle stop_register → login entry + `/register` closed state.
- Manual: `?code=` prefill invite; force invite requires code.
- Manual: SM4 key mismatch → fallback brand, no crash.

### 7. Wrong vs Correct

#### Wrong

```ts
await request('/api/v1/admin/config/fetch')
<span>谜之站点</span>
<RouterLink to="/register">注册</RouterLink> // always shown
```

#### Correct

```ts
await fetchPublicSiteConfig() // decrypts SM4 envelope
<span>{{ appName }}</span>
<RouterLink v-if="registerEnabled" to="/register">注册</RouterLink>
```

---

## Scenario: Register page

### 1. Scope / Trigger

- Trigger: Self-serve signup; invite links use `/register?code=`.
- Routes: `/register` (and `/forget`) use auth shell like `/login` (`App.vue` `isLoginRoute`).

### 2. Signatures

- `register({ email, password, invite_code?, email_code? })` → `POST /api/v1/passport/auth/register` JSON, `auth: false`
- `sendEmailVerify(email, isforget)` — register uses `isforget: 0`
- View: `RegisterView.vue` + shared `login.css`

### 3. Contracts

| Field | Rule |
|-------|------|
| email / password / confirm | Required; confirm must match |
| invite_code | Optional unless `inviteForce` |
| email_code | Shown + required when `emailVerify`; omit from body when off |
| Success | `setSession` + navigate `/dashboard` |
| Closed | No submit form; link back to login |

### 4. Validation & Error Matrix

| Condition | UI |
|-----------|-----|
| Password mismatch | Client error before request |
| `invite_force` + empty code | Client error |
| `email_verify=1` + missing/invalid code | Client error; backend also rejects |
| Backend `Registration has closed` | Show API message |
| Out of scope | captcha / reCAPTCHA |

### 5. Good/Base/Bad Cases

- Good: Open register → signup → dashboard.
- Base: Closed register → closed card only.
- Bad: Wrap register in main app chrome; call register with auth header.

### 6. Tests Required

- Manual AC against PRD `08-08-user-register-page`.

### 7. Wrong vs Correct

#### Wrong

```ts
// Register inside app-root chrome; always allow submit
```

#### Correct

```ts
const isLoginRoute =
  route.path === '/login' || route.path === '/register' || route.path === '/forget'
// closed: !registerEnabled → no form
```

---

## Scenario: User auth router guard

### 1. Scope / Trigger

- Trigger: Unauthenticated users must not see user chrome (`/dashboard`, plans, orders, …).
- Public auth pages = `/login` `/register` `/forget`.
- Logged-out `/` / unmatched: `safe_mode_enable=1` → decoy; `=0` → `/login`.
- User business shell always requires login (independent of safe mode for chrome leak).

### 2. Signatures

- `router.beforeEach` in `src/router.ts` — `await ensureSiteBrand()`; decoy routes branch on `safeMode`
- Login consumes `?redirect=` via `resolvePostLoginPath`

### 3. Contracts

| Path class | Rule |
|------------|------|
| Decoy (`meta.decoy`) | After brand: safe mode on → `DecoyView`; off → `/login` |
| `/` + `auth_data` | Redirect `/dashboard` |
| Admin UI (`/:adminSeg` after brand) | `adminSeg === adminBasePath`; else decoy if safe mode else `/login` |
| `/login` `/register` `/forget` | Always public |
| Other user routes | If `!auth_data` → `/login?redirect=<fullPath>` |
| Post-login redirect | Internal path only; reject `//`, admin UI prefix, auth pages → `/dashboard` |

### 4. Validation & Error Matrix

| Condition | Behavior |
|-----------|----------|
| No `auth_data` on business route | Redirect login with redirect query |
| No `auth_data` on `/` or unknown, safe mode on | Decoy |
| No `auth_data` on `/` or unknown, safe mode off | `/login` |
| Logged in | Business routes OK; `/` → dashboard |

### 5. Good/Base/Bad Cases

- Good: Private window `/dashboard` → login → back to dashboard.
- Base: safe mode off → `/` to login; safe mode on → `/` decoy.
- Bad: Always decoy regardless of `safe_mode_enable`.

### 6. Tests Required

- Manual: logged-out visit `/dashboard` → `/login?redirect=/dashboard`.
- Manual: safe mode off → `/` → `/login`; on → decoy.

### 7. Wrong vs Correct

#### Wrong

```ts
if (to.meta.decoy) return next() // ignores safe_mode_enable
```

#### Correct

```ts
if (to.meta.decoy) {
  await ensureSiteBrand()
  if (!safeMode.value) return next({ path: '/login', replace: true })
  return next()
}
```

---

## Scenario: Anti-detect decoy shell

### 1. Scope / Trigger

- Trigger: `safe_mode_enable=1` and logged-out hit `/` or unknown paths → fake cloud landing.
- When safe mode off → redirect `/login` (no decoy).
- Router loads `/config` to read the flag; `DecoyView` itself must not import `siteBrand`.
- Out of scope: CMS, hiding `/login` itself, changing `/config` path, VPN/机场话术.

### 2. Signatures

- `DecoyView.vue` — cloud landing;「成员登录」→ `/login`; no `siteBrand` / `fetchPublicSiteConfig` imports
- Routes: `path: '/'` + `/:pathMatch(.*)*` with `meta.decoy: true`
- `App.vue` `isBareRoute` includes `route.meta.decoy`
- Guard: `ensureSiteBrand()` then `safeMode` branch

### 3. Contracts

| Item | Rule |
|------|------|
| Logged-out `/`, safe mode on | DecoyView |
| Logged-out `/`, safe mode off | `/login` |
| Unmatched path | Same gate as `/` |
| Logged-in `/` | `/dashboard` |
| Title / brand | Fixed `苍穹云` / Aether Cloud only — never `app_name`; never literal `V2Board` |
| CTA | `RouterLink` to `/login`（「成员登录」）; no register CTA required |
| Copy | No VPN / proxy / 机场 / 订阅 / 翻墙 wording |

### 4–7

AC: safe mode on → `/` and `/random-scan` show decoy; safe mode off → `/` → `/login`.
---

## Scenario: Forget password page

### 1. Scope / Trigger

- Trigger: Reset password via emailed code; always available (not gated by `email_verify`).

### 2. Signatures

- Route `/forget` — `ForgetView.vue`; must be in `App.vue` `isLoginRoute`
- `sendEmailVerify(email, 1)` / `forgetPassword({ email, email_code, password })`

### 3. Contracts

| Field | Rule |
|-------|------|
| email_code | 6 digits; send button 60s cooldown |
| password / confirm | Match; min length 8 |
| Success | Navigate `/login?reset=1` |

### 4. Validation & Error Matrix

| Condition | UI |
|-----------|-----|
| Send/API error | Show message (SMTP misconfig common) |
| Code mismatch | Backend error string |

### 5. Good/Base/Bad Cases

- Good: Send → mail → reset → login hint.
- Bad: Mount `/forget` inside main layout chrome.

### 6. Tests Required

- Manual with real SMTP; shell route check (`isLoginRoute` includes `/forget`).

### 7. Wrong vs Correct

#### Wrong

```ts
route.path === '/login' || route.path === '/register' // forget wrapped in app shell
```

#### Correct

```ts
route.path === '/login' || route.path === '/register' || route.path === '/forget'
```

---

## Scenario: Admin UI secure_path

### 1. Scope / Trigger

- Trigger: Admin `safe.secure_path` changes the SPA admin entry only; REST admin prefix is `admin_api_prefix` (separate).
- Empty config → UI path `admin`; non-empty must satisfy backend (≥8 alphanumeric, not reserved).
- First visit with empty localStorage must still open `/{secure_path}/login` (routes are not permanently bound to cached `admin`).

### 2. Signatures

- Public `secure_path` → `adminBasePath` / `adminUrl(sub)` / `isAdminUiPath(path)` in `siteBrand.ts`
- Router: `/:adminSeg([A-Za-z0-9]+)/login` and `/:adminSeg([A-Za-z0-9]+)` + children; `beforeEach` → `ensureSiteBrand()` then `adminSeg === adminBasePath`
- Nav / redirects: `AdminLayout`, `App.vue`, `AdminLoginView`, `http.ts` 401, `LoginView` redirect deny list

### 3. Contracts

| Item | Rule |
|------|------|
| Entry | `/{path}/login`, `/{path}`, `/{path}/users`, … |
| Param match | Alphanumeric `adminSeg` only; mismatch after brand load → decoy if safe mode else `/login` |
| Links | Always via `adminUrl(...)` — no hard-coded `'/admin...'` UI routes |
| 401 on admin page | Redirect `adminUrl('/login')` |
| Cache | Persist last good path in `v2board_admin_path` for faster first paint; not required for first admin login |

### 4. Validation & Error Matrix

| Condition | Behavior |
|-----------|----------|
| Invalid public path | Fall back to `admin` |
| Old bookmark `/admin` after change | Decoy / not admin (expected) |
| Cleared storage + real `secure_path` | `/config` loads; segment check passes; admin login works |

### 5. Good/Base/Bad Cases

- Good: Set `admin888` → open `/admin888/login` works; `/admin` is not admin.
- Bad: Hard-code `/admin` in sidebar or `router.push`; static `` `/${adminBasePath}/...` `` at module eval time.

### 6. Tests Required

- Manual AC of task `08-08-admin-secure-path` + anti-detect AC5 (cleared storage).

### 7. Wrong vs Correct

#### Wrong

```ts
path: `/${adminBasePath.value}/login` // frozen at import time
router.push('/admin')
```

#### Correct

```ts
path: '/:adminSeg([A-Za-z0-9]+)/login' // validate after ensureSiteBrand()
router.push(adminUrl())
```
---

## Convention: Admin subscribe URL textarea

**What**: System config「订阅 URL」is a multiline textarea; one URL per line (commas also accepted). Persist as comma-joined string.

**Why**: Operators paste multiple bases more easily than a single comma field.

**Example** (`AdminSystemConfigView.vue`): split/join with `/[,\n\r]+/`.
