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

## Common Mistake: Clash shows unmarked third-party names

**Symptom**: Panel nodes show `🔒`, external nodes show original names only.

**Cause**: Backend Clash builder kept original `clash_proxy.name` (fixed in API). Frontend cannot fix client YAML once delivered.

**Prevention**: After subscribe changes, force-refresh the client profile; verify API/spec in `subscribe-delivery.md`.

---

## Accessibility

- Toggle/switch controls: `role="switch"` + `aria-checked`.
- Modal close buttons: `aria-label` when icon-only.
- Prefer visible labels over placeholder-only fields for required inputs.
