# Component Guidelines

> How Vue components are built in `v2board-ui` (admin + user).

---

## Overview

Vue 3 + `<script setup>` SFCs. Admin pages live under `src/views/admin/`; shared admin chrome in `src/layouts/AdminLayout.vue` and `src/styles/admin.css`.

---

## Convention: Absolute subscribe URL before copy / import

**What**: If API `subscribe_url` is relative (`/api/v1/client/subscribe?token=...`), prepend `window.location.origin` before clipboard, QR, or one-click client schemes.

**Why**: Backend may return a path when site URLs are empty, or Vite `changeOrigin` makes the API Host differ from the browser origin. Clients cannot import a bare path.

**Example** (`DashboardHome.vue`):

```ts
function toAbsoluteSubscribeUrl(raw: string | null | undefined): string {
  const url = (raw || '').trim()
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  if (url.startsWith('//')) return `${window.location.protocol}${url}`
  const path = url.startsWith('/') ? url : `/${url}`
  return `${window.location.origin}${path}`
}
```

**UX**: Copy actions should use a toast (not `alert`) for success/failure.

**Related**: Backend resolution order in API `backend/subscribe-delivery.md`.

---

## Convention: Admin node form — select by name, not raw IDs

**What**: In add/edit node modal (`AdminServersView.vue`):

| Field | UI | Persist |
|-------|-----|---------|
| Permission groups | Checkbox list of `ServerGroup.name` (+ `#id`) | `group_id: number[]` |
| Routes | Checkbox list of `ServerRoute.remarks` (+ action / `#id`) | `route_id: number[]` |
| Parent node | `<select>` of node names (exclude self) | `parent_id: number \| null` |

**Why**: Operators cannot map numeric IDs; empty route list should prompt creating routes in「路由管理」.

**Don't**:

```html
<input v-model="groupIdText" placeholder="逗号分隔的组ID，如 1,2,3" />
```

**Do**: Load `fetchGroups()` / `fetchRoutes()` when opening the modal; bind checkboxes to id arrays.

---

## Convention: Scoped CSS and same-file child components

**What**: `defineComponent` + `h()` helpers in the same SFC (e.g. `Toggle`, `Row` in system config) do **not** receive parent scoped attributes on inner nodes. Style them with `:deep(...)`.

**Why**: Off-state toggles looked invisible (white on white) when scoped rules never applied; global `.admin-page .form-row` also overrode intended grids.

**Example**:

```css
.config-page :deep(.toggle) {
  background: #e2e8f0; /* visible off track */
  border: 1px solid #cbd5e1;
}
.config-page :deep(.form-row) {
  display: grid;
  grid-template-columns: minmax(200px, 1fr) minmax(240px, 1.15fr);
}
```

---

## Pattern: Admin modal sections

**Problem**: Long node forms feel flat and hard to scan.

**Solution**: Group fields into `.form-section` cards (基础信息 / 权限与路由 / 展示与关联 / 协议配置), keep footer outside the scroll body, show protocol type chip in the header.

---

## Common Mistake: Admin modal stuck at 480px

**Symptom**: Setting `width: 1080px` on `.modal.modal-edit` in a page SFC has **no effect**.

**Cause**: Global `src/styles/admin.css` sets:

```css
body.admin-theme .modal { width: 480px; max-width: 94vw; }
```

Specificity (`body.admin-theme .modal` = 0,2,1) beats `.modal.modal-edit` (0,2,0). Teleported modals still match `body.admin-theme`.

**Fix**: Register wide variants in `admin.css`:

```css
body.admin-theme .modal.modal-wide,
body.admin-theme .modal.nodes-modal { width: min(1320px, 96vw); }
body.admin-theme .modal.modal-edit { width: min(1080px, 96vw); max-width: 96vw; }
body.admin-theme .modal.modal-detail { width: min(960px, 96vw); max-width: 96vw; }
```

Or raise local specificity: `body.admin-theme .modal.modal-edit { width: … !important; }`.

**Prevention**: New admin modals that need >480px must use `modal-wide` / `modal-edit` / `modal-detail` / `nodes-modal` (or extend the global allowlist).

---

## Convention: Order detail user chip (one line)

**What**: In `AdminOrdersView` detail hero, show buyer as a single line:

`email · #user_id · remarks` (remarks omitted if empty). Also mirror email/remarks in 订单信息 rows.

**Why**: Stacking email / id / remarks vertically makes the hero chip taller than sibling chips (套餐 / 周期).

**Don't**: Multi-line `hero-chip` content for user identity.

**API**: `POST /api/v1/admin/order/detail` returns `email` / `remarks` / `plan_name` (see API `admin-commerce.md`). List rows do not include email.

**Modal**: Use class `modal modal-detail` (global ~960px).

---

## Pattern: Admin DateTimePicker

**Problem**: Native `datetime-local` looks inconsistent; empty expiry should mean「长期有效」.

**Solution**: Reuse `src/components/admin/DateTimePicker.vue`.

- `v-model` string: `YYYY-MM-DDTHH:mm` (same as prior `expired_local`)
- Empty model → placeholder「长期有效」; clear emits `''`
- Popover `Teleport` to `body`; trigger `@click.stop` so document click does not immediately close

**Related**: User `expired_at` unix seconds conversion stays in the parent view.

---

## Convention: External subscribe「上次同步」cell

**What**: Show badge + **time** + message on separate lines/rows.

```html
<div class="sync-top">
  <span class="sync-badge">…</span>
  <span class="sync-time">{{ fmtTime(s.last_sync_at) }}</span>
</div>
<span v-if="s.last_sync_message" class="sync-msg">…</span>
```

**Don't**: `{{ s.last_sync_message || fmtTime(s.last_sync_at) }}`.

**Related**: API fields in `backend/external-subscribe.md`.

---

## Convention: Compact metric cells (nowrap)

**What**: Inline metrics like `216 / 459 可达` use `white-space: nowrap` + `flex-wrap: nowrap` on `.node-metric`.

**Why**: Longer digit counts wrap「可达」onto a second line.

---

## Convention: Admin list toolbar (horizontal search)

**What**: Search field + input + actions stay on **one horizontal row** inside a `.toolbar-card`. Status pills and secondary toggles sit on a second row.

**Why**: Global/modal `.input { width: 100%; }` makes every `<select>`/`<input>` full-width and stacks the toolbar vertically (seen on 订单管理).

**Do**:

```css
.search-bar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.search-select { width: auto; min-width: 120px; height: 38px; /* not width:100% */ }
.search-field { flex: 1 1 260px; display: flex; align-items: center; }
.search-text { border: 0; width: auto; flex: 1; min-width: 0; }
```

**Don't**: Reuse the modal `.input { width: 100%; }` class as the only class on toolbar controls.

**Related**: Order fuzzy search below; money units in API `backend/admin-commerce.md`.

---

## Convention: Admin order search — fuzzy by default

**What**: Order list search does **not** expose `>`, `<`, `=`, `!=`. Text filters use condition `模糊`; exact keys use `=`.

| Key | Condition |
|-----|-----------|
| `trade_no`, `email`, `callback_no` | `模糊` |
| `user_id`, `invite_user_id`, `status`, `commission_status` | `=` |

Status quick pills append a separate `status=` filter; do not require the operator dropdown.

**Example** (`AdminOrdersView.vue`):

```ts
const EXACT_KEYS = new Set(['user_id', 'invite_user_id', 'status', 'commission_status'])
filters.push({
  key,
  condition: EXACT_KEYS.has(key) ? '=' : '模糊',
  value: value.trim()
})
```

---

## Convention: Admin money / traffic display

**What**:

| API field | UI |
|-----------|-----|
| `*_amount`, coupon type 1 `value`, giftcard type 1 `value` | Yuan: `(v/100).toFixed(2)` on show; `Math.round(yuan*100)` on save |
| Coupon type 2 `value` | Percent integer — **no** `/100` |
| Plan `transfer_enable` | GB as stored — **no** byte conversion in the form |
| Giftcard type 3 | GB; type 2/5 | days |

**Why**: Wrong unit on plan traffic previously broke 订阅管理 forms.

---

## Pattern: Admin detail modal (orders)

**Problem**: Flat two-column key/value grids bury amount and status.

**Solution**: Header badges (status/type) + copyable `trade_no` → hero amount strip → section cards (金额明细 / 订单信息 / 佣金) → footer actions for pending orders. Zero money fields show `—`.

---

## Convention: User「我的订单」infinite scroll

**What**: `OrderView.vue` uses `fetchOrdersPage({ status, current, pageSize })` → `{ data, total }`. Sentinel + `IntersectionObserver` appends pages; filter tabs map to API `status` (pending=`0`, finished=`3`) and reset the list. Legacy `fetchOrders()` (no `pageSize`) stays for `PlanView`.

**Why**: Avoid loading the full order history on first paint.

**Related**: API `admin-commerce.md`「User order list fetch».

---

## Convention: Admin dashboard stats

**What**: `AdminDashboardView.vue` loads KPIs/ranks via `fetchStat*` (`api/admin.ts`). Trend + bar ranks use **ECharts** (tree-shaken `echarts/core`). Money from `getOverride` is **cents** → display `/100` with two decimals + `CNY`. Rank `total` is already **GB**; tooltips use two decimals. Dispose charts on unmount; section failures use `Promise.allSettled` / per-block retry.

**Why**: Matches PHP admin dashboard + Java `AdminStatController` without inventing unpaid/refund series the API does not return.

**Related**: API Trellis `.trellis/spec/backend/admin-stat.md`.

---

## Pattern: Sticky ops menu via Teleport

**Problem**: Table「操作」dropdown clipped by `overflow` on table wrappers.

**Solution**: Menu `Teleport` to `body` with `position: fixed` from the trigger `getBoundingClientRect()`; sticky right ops column.

---

## Common Mistake: Clash shows unmarked third-party names

**Symptom**: Panel nodes show `🔒`, external nodes show original names only.

**Cause**: Backend Clash builder kept original `clash_proxy.name` (fixed in API). Frontend cannot fix client YAML once delivered.

**Prevention**: After subscribe changes, force-refresh the client profile; verify API/spec in `subscribe-delivery.md`.

---

## Accessibility

- Toggle/switch controls: `role="switch"` + `aria-checked`.
- Modal close buttons: `aria-label` when icon-only.
- Prefer visible labels over placeholder-only fields for required inputs.
