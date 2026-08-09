# Frontend Development Guidelines

> Best practices for frontend development in this project.

---

## Overview

Vue 3 + Vite user/admin UI that talks to the Java V2Board API (`snake_case` JSON).

**PHP upstream (canonical)**: [wyx2685/v2board](https://github.com/wyx2685/v2board) `master` — detailed convention lives in sibling API Trellis `v2board-java-api/.trellis/spec/backend/php-upstream.md`.

---

## Guidelines Index

| Guide | Description | Status |
|-------|-------------|--------|
| [Directory Structure](./directory-structure.md) | Module organization and file layout | To fill |
| [Component Guidelines](./component-guidelines.md) | Subscribe URL absolute-ize, admin selects, scoped CSS | Active |
| [Site Brand](./site-brand.md) | SM4 decrypt public config; register/email-verify/safe-mode; `/forget` | Active |
| [Panel API SM4](./panel-api-sm4.md) | Fixed `/config`, action aliases, body SM4/`X-A`, payment notify config | Active |
| [Hook Guidelines](./hook-guidelines.md) | Custom hooks, data fetching patterns | To fill |
| [State Management](./state-management.md) | Local state, global state, server state | To fill |
| [Quality Guidelines](./quality-guidelines.md) | Code standards, forbidden patterns | To fill |
| [Type Safety](./type-safety.md) | Type patterns, validation | To fill |

---

## Pre-Development Checklist

- [ ] Aligning admin/user UX with PHP labels or flows → [wyx2685/v2board](https://github.com/wyx2685/v2board) (+ API `php-upstream.md`)
- [ ] Admin dashboard KPIs/charts → [component-guidelines.md](./component-guidelines.md)「Admin dashboard stats」+ API `admin-stat.md`
- [ ] Read [component-guidelines.md](./component-guidelines.md) for admin modals, toggles, and subscribe copy UX
- [ ] Read [site-brand.md](./site-brand.md) if changing site name, login/register/forget, email verify, safe mode, or public-config SM4 decrypt
- [ ] Read [panel-api-sm4.md](./panel-api-sm4.md) if changing `/config`, `apiUrl` / action aliases, payment notify prefix UI, or `http.ts` SM4
- [ ] Panel calls must use `apiUrl(zone, classicRel)` — Network must not show classic action path segments
- [ ] Payment gateway URLs: copy admin `notify_url` (plaintext `/g/...`); never wrap with `apiUrl`/SM4
- [ ] Login→register link only when public `stop_register != 1`; `/register` `/forget` in auth shell like `/login`
- [ ] Safe mode: await `loadSiteBrand` in `beforeEach`; public paths only login/register/forget
- [ ] Public config: `GET /config` → decrypt outer envelope with `VITE_SM4_KEY` (= API `SM4_KEY`); then `setApiBases`; never hard-code `/api/v1/passport|user|admin`
- [ ] If changing subscribe copy/import: absolute-ize relative `subscribe_url`
- [ ] If changing node editor: permission groups / routes / parent must select by **name**, not raw IDs
- [ ] Same-file `defineComponent` + `h()` children need `:deep()` for scoped styles
- [ ] Admin toolbars: do not use full-width `.input` on horizontal search rows
- [ ] Order search: default `模糊` for text; no `>` / `<` UI
- [ ] Money = cents ↔ yuan; plan `transfer_enable` = GB (see API `admin-commerce.md`)
- [ ] Wide admin modals: register in `admin.css` (`modal-wide` / `modal-edit` / `modal-detail`) — default is **480px**
- [ ] User edit: `remarks` in list; user traffic fields are **bytes** in API (see API `admin-user.md`)
- [ ] User ops「TA 的登录」→ `GET /admin/user/getLoginLog` (paginated IP/UA history)
- [ ] Order detail: show `email` + `remarks` from detail API; hero user chip **one line** (`email · #id · remarks`)
- [ ] Ticket reply: `application/x-www-form-urlencoded`, not JSON
- [ ] External sync cell: always show `last_sync_at`, not only message

---

**Language**: All documentation in this directory should be written in **English**.
