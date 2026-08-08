# Site Brand & Register Gate

> Dynamic `app_name` plus public register flags for login/register UX.

---

## Scenario: Consume public site config

### 1. Scope / Trigger

- Trigger: Chrome, login/register pages, invite copy, `document.title` need brand + register gates.
- Source API: `GET /api/v1/passport/comm/config` (see API `public-site-config.md`).

### 2. Signatures

- `fetchPublicSiteConfig()` — `src/api/site.ts`
- `appName`, `stopRegister`, `inviteForce`, `registerEnabled`, `loadSiteBrand()` — `src/siteBrand.ts`
- Bootstrap: `main.ts` → `void loadSiteBrand()` (non-blocking)

### 3. Contracts

| Item | Value |
|------|--------|
| Request auth | `{ auth: false }` |
| Cache | `localStorage` `v2board_app_name` |
| Name fallback | cache → `"V2Board"` |
| Title | `document.title = appName` |
| Register entry | show only when `registerEnabled` (`stop_register != 1`) |
| Invite field | required in UI when `inviteForce` |

### 4. Validation & Error Matrix

| Condition | Behavior |
|-----------|----------|
| Fetch fails | Keep cached name; register flags stay previous/false |
| Empty `app_name` | Fallback `V2Board` |
| `stop_register=1` | Hide login→register link; `/register` closed state |

### 5. Good/Base/Bad Cases

- Good: Admin sets name + leaves register open → login shows 注册; register works.
- Base: First visit shows cached/fallback name until fetch.
- Bad: Admin config fetch on login; hardcode brand; show register when stopped.

### 6. Tests Required

- Manual: toggle stop_register → login entry + `/register` closed state.
- Manual: `?code=` prefill invite; force invite requires code.

### 7. Wrong vs Correct

#### Wrong

```ts
await request('/api/v1/admin/config/fetch')
<span>谜之站点</span>
<RouterLink to="/register">注册</RouterLink> // always shown
```

#### Correct

```ts
request('/api/v1/passport/comm/config', {}, { auth: false })
<span>{{ appName }}</span>
<RouterLink v-if="registerEnabled" to="/register">注册</RouterLink>
```

---

## Scenario: Register page

### 1. Scope / Trigger

- Trigger: Self-serve signup; invite links use `/register?code=`.
- Routes: `/register` uses auth shell like `/login` (`App.vue` `isLoginRoute`).

### 2. Signatures

- `register({ email, password, invite_code? })` → `POST /api/v1/passport/auth/register` JSON, `auth: false`
- View: `RegisterView.vue` + shared `login.css`

### 3. Contracts

| Field | Rule |
|-------|------|
| email / password / confirm | Required; confirm must match |
| invite_code | Optional unless `inviteForce` |
| Success | `setSession` + navigate `/dashboard` |
| Closed | No submit form; link back to login |

### 4. Validation & Error Matrix

| Condition | UI |
|-----------|-----|
| Password mismatch | Client error before request |
| `invite_force` + empty code | Client error |
| Backend `Registration has closed` | Show API message |
| Out of scope | Email verify / captcha UI (backend may still enforce `email_verify`) |

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
const isLoginRoute = route.path === '/login' || route.path === '/register'
// closed: !registerEnabled → no form
```

---

## Convention: Admin subscribe URL textarea

**What**: System config「订阅 URL」is a multiline textarea; one URL per line (commas also accepted). Persist as comma-joined string.

**Why**: Operators paste multiple bases more easily than a single comma field.

**Example** (`AdminSystemConfigView.vue`): split/join with `/[,\n\r]+/`.
