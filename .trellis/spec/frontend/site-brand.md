# Site Brand & Register Gate

> Dynamic `app_name` plus public register/safe-mode flags and email-verify UX for login/register/forget. Public config is SM4-decrypted client-side.

---

## Scenario: Decrypt public config SM4 envelope

### 1. Scope / Trigger

- Trigger: `GET /api/v1/passport/comm/config` returns `{ iv, payload }` base64, not plaintext flags.
- Must stay compatible with API `public-site-config.md` (SM4-CBC/PKCS7).

### 2. Signatures

- `fetchPublicSiteConfig()` — `src/api/site.ts`
- Env: `VITE_SM4_KEY` (`.env.development` / `.env.example`) — same material as backend `SM4_KEY`
- Lib: `sm-crypto` (`import smCrypto from 'sm-crypto'; const { sm4 } = smCrypto`)

### 3. Contracts

| Step | Rule |
|------|------|
| HTTP `data` | Only `iv` + `payload` (base64) |
| Key | 16 UTF-8 bytes **or** 32 hex → convert to hex for `sm-crypto` |
| IV / ciphertext | base64 → bytes → hex before `sm4.decrypt` |
| Decrypt options | `{ mode: 'cbc', iv, padding: 'pkcs#7' }` |
| Output | `JSON.parse` → `PublicSiteConfig` |

### 4. Validation & Error Matrix

| Condition | Behavior |
|-----------|----------|
| Missing `VITE_SM4_KEY` / bad length | Throw in decrypt; `loadSiteBrand` catch → cached name / flags false |
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
return data // data.iv is not app_name
```

#### Correct

```ts
import smCrypto from 'sm-crypto'
const { sm4 } = smCrypto
const envelope = await request<{ iv: string; payload: string }>(...)
// base64 → hex, sm4.decrypt CBC, JSON.parse
```

---

## Scenario: Consume public site config

### 1. Scope / Trigger

- Trigger: Chrome, login/register pages, invite copy, `document.title` need brand + register gates.
- Source: decrypted `PublicSiteConfig` from `fetchPublicSiteConfig()` (never raw admin config).

### 2. Signatures

- `fetchPublicSiteConfig()` — `src/api/site.ts` (decrypts envelope → `PublicSiteConfig`)
- `appName`, `stopRegister`, `inviteForce`, `emailVerify`, `safeMode`, `recaptchaEnable`, `recaptchaSiteKey`, `recaptchaRequired`, `adminBasePath`, `adminUrl()`, `isAdminUiPath()`, `registerEnabled`, `loadSiteBrand()` — `src/siteBrand.ts`
- Bootstrap: `main.ts` → `await loadSiteBrand()` then dynamic `import('./router')` so admin routes use the resolved path
- Forget: `/forget` (`ForgetView.vue`); login link always shown
- Safe mode: `router.beforeEach` awaits `loadSiteBrand()`; anonymous users only `/login` `/register` `/forget`

### 3. Contracts

| Item | Value |
|------|--------|
| Request auth | `{ auth: false }` |
| Cache | `localStorage` `v2board_app_name`, `v2board_admin_path` |
| Name fallback | cache → `"V2Board"` |
| Admin path fallback | cache → `"admin"`; empty/invalid public `secure_path` → `"admin"` |
| Title | `document.title = appName` |
| Register entry | show only when `registerEnabled` (`stop_register != 1`) |
| Invite field | required in UI when `inviteForce` |
| Email code on register | show + require when `emailVerify` (`email_verify=1`) |
| Forget password | always available; send code with `isforget=1` |
| Safe mode | when `safeMode`, unauthenticated business routes → `/login?redirect=` |
| Admin UI entry | `/{secure_path}` and `/{secure_path}/login`; API stays `/api/v1/admin/**` |
| reCAPTCHA | when `recaptchaRequired`, Login/Register show v2 widget; submit `recaptcha_data` |

### 4. Validation & Error Matrix

| Condition | Behavior |
|-----------|----------|
| Fetch/decrypt fails | Keep cached name; register flags stay previous/false |
| Empty `app_name` | Fallback `V2Board` |
| `stop_register=1` | Hide login→register link; `/register` closed state |
| `safe_mode_enable=1` + no auth | Block `/dashboard` etc.; allow login/register/forget |

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

## Scenario: Safe mode router guard

### 1. Scope / Trigger

- Trigger: Admin `safe.safe_mode_enable`; unauthenticated users must not browse user chrome pages.
- Note: SPA has no marketing home; public pages = login/register/forget only.

### 2. Signatures

- `safeMode` from `loadSiteBrand()` ← public `safe_mode_enable`
- `router.beforeEach` in `src/router.ts`
- Login consumes `?redirect=` via `resolvePostLoginPath`

### 3. Contracts

| Path class | Rule |
|------------|------|
| Admin UI (`isAdminUiPath`) | Existing admin auth; path from `secure_path` |
| `/login` `/register` `/forget` | Always public |
| Other user routes | If `safeMode && !auth_data` → `/login?redirect=<fullPath>` |
| Post-login redirect | Internal path only; reject `//`, admin UI prefix, auth pages → `/dashboard` |

`beforeEach` **awaits** `loadSiteBrand()` before evaluating `safeMode` (avoid race with default `false`).

### 4. Validation & Error Matrix

| Condition | Behavior |
|-----------|----------|
| `safe_mode_enable=0` | No user-route redirect from this guard |
| Config fetch fails | `safeMode` stays false → no lockout from stale unknown |
| Logged in | Business routes OK |

### 5. Good/Base/Bad Cases

- Good: Enable safe mode → private window `/dashboard` → login → back to dashboard.
- Base: Flag off → anonymous can open dashboard shell (API still JWT-protected).
- Bad: Gate without awaiting config; put `/forget` behind login.

### 6. Tests Required

- Manual: toggle safe mode; AC2–AC5 of task `08-08-user-safe-mode-guard`.

### 7. Wrong vs Correct

#### Wrong

```ts
if (safeMode.value && !auth) next('/login') // before loadSiteBrand
```

#### Correct

```ts
await loadSiteBrand()
if (safeMode.value && !localStorage.getItem('auth_data')) {
  next({ path: '/login', query: { redirect: to.fullPath } })
}
```

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

- Trigger: Admin `safe.secure_path` changes the SPA admin entry; must not change REST `/api/v1/admin/**`.
- Empty config → UI path `admin`; non-empty must satisfy backend (≥8 alphanumeric, not reserved).

### 2. Signatures

- Public `secure_path` → `adminBasePath` / `adminUrl(sub)` / `isAdminUiPath(path)` in `siteBrand.ts`
- Routes registered after `await loadSiteBrand()` in `main.ts`
- Nav / redirects: `AdminLayout`, `App.vue`, `AdminLoginView`, `http.ts` 401, `LoginView` redirect deny list

### 3. Contracts

| Item | Rule |
|------|------|
| Entry | `/{path}/login`, `/{path}`, `/{path}/users`, … |
| Links | Always via `adminUrl(...)` — no hard-coded `'/admin...'` UI routes |
| 401 on admin page | Redirect `adminUrl('/login')` |
| Cache | Persist last good path in `v2board_admin_path` for faster first paint |

### 4. Validation & Error Matrix

| Condition | Behavior |
|-----------|----------|
| Invalid public path | Fall back to `admin` |
| Old bookmark `/admin` after change | Not admin routes (expected) |

### 5. Good/Base/Bad Cases

- Good: Set `admin888` → open `/admin888/login` works; `/admin` is not admin.
- Bad: Hard-code `/admin` in sidebar or `router.push`.

### 6. Tests Required

- Manual AC of task `08-08-admin-secure-path`.

### 7. Wrong vs Correct

#### Wrong

```ts
router.push('/admin')
```

#### Correct

```ts
router.push(adminUrl())
```

---

## Convention: Admin subscribe URL textarea

**What**: System config「订阅 URL」is a multiline textarea; one URL per line (commas also accepted). Persist as comma-joined string.

**Why**: Operators paste multiple bases more easily than a single comma field.

**Example** (`AdminSystemConfigView.vue`): split/join with `/[,\n\r]+/`.
