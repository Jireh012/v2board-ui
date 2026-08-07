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
| [Hook Guidelines](./hook-guidelines.md) | Custom hooks, data fetching patterns | To fill |
| [State Management](./state-management.md) | Local state, global state, server state | To fill |
| [Quality Guidelines](./quality-guidelines.md) | Code standards, forbidden patterns | To fill |
| [Type Safety](./type-safety.md) | Type patterns, validation | To fill |

---

## Pre-Development Checklist

- [ ] Read [component-guidelines.md](./component-guidelines.md) for admin modals, toggles, and subscribe copy UX
- [ ] If changing subscribe copy/import: absolute-ize relative `subscribe_url`
- [ ] If changing node editor: permission groups / routes / parent must select by **name**, not raw IDs
- [ ] Same-file `defineComponent` + `h()` children need `:deep()` for scoped styles

---

**Language**: All documentation in this directory should be written in **English**.
