# Frontend Development Guidelines

> Best practices for frontend development in this project.

---

## Overview

Vue 3 + Vite user/admin UI that talks to the Java V2Board API (`snake_case` JSON).

---

## Guidelines Index

| Guide | Description | Status |
|-------|-------------|--------|
| [Directory Structure](./directory-structure.md) | Module organization and file layout | To fill |
| [Component Guidelines](./component-guidelines.md) | Subscribe URL absolute-ize, admin selects, scoped CSS | Active |
| [Site Brand](./site-brand.md) | Dynamic `app_name`, register gate, `/register` | Active |
| [Hook Guidelines](./hook-guidelines.md) | Custom hooks, data fetching patterns | To fill |
| [State Management](./state-management.md) | Local state, global state, server state | To fill |
| [Quality Guidelines](./quality-guidelines.md) | Code standards, forbidden patterns | To fill |
| [Type Safety](./type-safety.md) | Type patterns, validation | To fill |

---

## Pre-Development Checklist

- [ ] Read [component-guidelines.md](./component-guidelines.md) for admin modals, toggles, and subscribe copy UX
- [ ] Read [site-brand.md](./site-brand.md) if changing site name, login/register brand, or register gate
- [ ] Login→register link only when public `stop_register != 1`; `/register` in auth shell like `/login`
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
