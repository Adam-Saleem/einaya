# Einaya — Build Progress

> **Update this file at the end of every Claude session, especially when context is getting full.**
> The next session reads this + `00-master-spec.md` and knows exactly where to resume.

---

## Current Status

**Active phase:** Phase 1 — Setup & Tenancy Foundation
**Status:** Not started
**Last session date:** _

---

## Completed Phases

_(none yet)_

---

## In Progress

### Phase 1 — Setup & Tenancy Foundation
- [ ] Laravel 12 project bootstrapped
- [ ] Breeze (Inertia React + TS) installed
- [ ] pnpm replacing npm
- [ ] Pest v3 installed
- [ ] stancl/tenancy v3 installed and configured
- [ ] Central domains configured (einaya.test, app.einaya.test)
- [ ] Tenant subdomain pattern working ({slug}.einaya.test)
- [ ] Bootstrappers enabled (Database, Cache, Filesystem, Queue)
- [ ] Folder structure created
- [ ] Routes split (web, central, tenant)
- [ ] Herd wildcard configured
- [ ] Three URL types resolve correctly
- [ ] Pest tenancy smoke test passes
- [ ] Tenant creation via tinker auto-creates DB

---

## Blockers / Open Questions

_(none yet)_

---

## Key Decisions Made During Build

_(none yet — log any deviation from the spec here as we go)_

---

## Files Modified This Session

_(list files Claude generated or modified — helps the next session understand what's already in place)_

---

## How to Resume

1. Open fresh Claude conversation
2. Paste `ai/00-master-spec.md`
3. Paste `ai/PROGRESS.md` (this file, with latest updates)
4. Paste the active phase prompt from `ai/prompts/`
5. Say: "Continue from where the previous session left off. Don't regenerate completed work."
