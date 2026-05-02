# Einaya — Build Progress

> **Update this file at the end of every Claude session, especially when context is getting full.**
> The next session reads this + `00-master-spec.md` and knows exactly where to resume.

---

## Current Status

**Active phase:** None — Phase 1 complete; ready to start Phase 2.
**Last session date:** 2026-05-02

---

## Completed Phases

### ✅ Phase 1 — Setup & Tenancy Foundation (2026-05-01 → 2026-05-02)

All Definition of Done items met:
- Laravel 12 + Breeze (Inertia React + TS, dark mode, Pest v3, pnpm)
- stancl/tenancy v3.10 multi-database mode wired up with custom Tenant model
- Three URL types resolve in browser:
  - `einaya.test` → "Welcome to Einaya"
  - `app.einaya.test` → "Super Admin Panel"
  - `demo.einaya.test` → "Tenant: demo" (after tenant created)
- `php artisan migrate` runs cleanly on `einaya_central` MySQL DB
- Tenant creation via tinker auto-creates `einaya_tenant_{id}` MySQL DB
- 28 Pest tests pass (Breeze auth + 3 tenancy smoke tests)
- TypeScript clean (`pnpm exec tsc --noEmit` zero errors)
- No errors in `storage/logs/laravel.log`

---

## In Progress

_(none — pause point. Next: Phase 2 — Central Schema)_

---

## Blockers / Open Questions

_(none)_

---

## Key Decisions Made During Build

### Phase 1

- **No `RouteServiceProvider`** — Laravel 12 doesn't ship one. Routes registered via `bootstrap/app.php` `withRouting()` and a `then:` callback for `routes/central.php`. Phase 1 prompt assumed RouteServiceProvider; deviation is structural to Laravel 12.
- **No `tenant` connection in `config/database.php`** — stancl/tenancy v3 reserves the name `tenant` and creates the connection at runtime by cloning the central `mysql` connection. Phase 1 prompt asked for one; adding it would conflict with the package.
- **Marketing `/` domain-restricted** to `einaya.{ps,test}` + loopback (in `routes/web.php`) — without this, the URI `/` collides with `routes/tenant.php`'s `/`, and tenant.php (loaded later via `Application::booted()`) wins for all hosts. Domain restriction makes routing deterministic.
- **Custom Tenant model at `app/Models/Central/Tenant.php`** — extends `Stancl\Tenancy\Database\Models\Tenant`, implements `TenantWithDatabase`, uses `HasDatabase` + `HasDomains` traits. The base Tenant model doesn't implement `TenantWithDatabase`, so multi-DB CreateDatabase job fails without a custom one. `config/tenancy.php` `tenant_model` updated to point here.
- **Breeze Welcome.tsx replaced** with a minimal "Welcome to Einaya" page (per Phase 1 spec naming).
- **Breeze auth/profile/dashboard routes left in `routes/web.php`** untouched — Phase 4 will refactor onto tenant subdomains.
- **`app/Models/User.php` left at root** (not moved to `Models/Central/`) — Breeze depends on it; Phase 2 owns the central User model.
- **TS fixes in Breeze templates** are minimal patches (typed `usePage<PageProps>()`); Phase 4 rewrites these files entirely.
- **Pest.php split** — `RefreshDatabase` applied only to Breeze-installed tests (`Feature/Auth/`, `Feature/ProfileTest.php`, `Feature/ExampleTest.php`). The tenancy test in `Feature/TenancyTest.php` opts out because tenant DB creation/deletion is DDL that auto-commits and breaks RefreshDatabase's transaction-rollback strategy. TenancyTest manages its own state via `pestSmokeCleanup()` (drops tenant DB + ends tenancy + deletes the test tenant row, scoped to a unique `pestsmoke` tenant ID).
- **phpunit.xml uses `einaya_central_testing`** MySQL DB (not in-memory sqlite). Tenancy test requires `CREATE/DROP DATABASE` DDL which sqlite can't do. Run `mysql -e "CREATE DATABASE einaya_central_testing ..."` then `APP_ENV=testing DB_DATABASE=einaya_central_testing php artisan migrate` once before first test run.
- **`SESSION_DRIVER=file`** in `.env` and `.env.example` — Laravel default `database` requires a `sessions` table in whatever connection is active, which would mean a tenant migration. Phase 1 keeps `database/migrations/tenant/` empty per spec, so we use the file driver. Phase 3 will add a sessions migration to the tenant folder and switch back to `database`.

---

## Files Modified This Session

### Created
- `_bootstrap/` (temp, removed) — Laravel 12 scaffold staging
- `app/Models/Central/Tenant.php` — custom multi-DB Tenant model
- `app/Providers/TenancyServiceProvider.php` — published by `tenancy:install`
- `routes/central.php` — central super admin routes
- `database/migrations/2019_09_15_000010_create_tenants_table.php` — from tenancy installer
- `database/migrations/2019_09_15_000020_create_domains_table.php` — from tenancy installer
- `database/migrations/tenant/.gitkeep`
- `config/tenancy.php` — published by `tenancy:install`
- `resources/js/Pages/Central/SuperAdmin.tsx`
- `resources/js/Pages/Tenant/Welcome.tsx`
- `tests/Feature/TenancyTest.php` — 3-case smoke test
- 21 directory `.gitkeep` files across `app/{Services,Actions,Http,Policies,Enums,Models,Multitenancy}` and `resources/js/{Components/{ui,domain},Hooks,locales/{en,ar}}`

### Modified
- `bootstrap/providers.php` — registered `TenancyServiceProvider`
- `bootstrap/app.php` — added `then:` callback to load `routes/central.php`
- `config/tenancy.php` — central_domains list, DB prefix `einaya_tenant_`, `tenant_model` → `App\Models\Central\Tenant`
- `routes/web.php` — domain-restricted `/` to central root domains
- `routes/tenant.php` — render `Pages/Tenant/Welcome.tsx` instead of inline string
- `resources/js/Pages/Welcome.tsx` — minimal "Welcome to Einaya"
- `resources/js/Layouts/AuthenticatedLayout.tsx` — typed `usePage<PageProps>()`
- `resources/js/Pages/Profile/Partials/UpdateProfileInformationForm.tsx` — typed `usePage<PageProps>()`
- `tests/Pest.php` — split RefreshDatabase application; tenancy test opts out
- `phpunit.xml` — DB_CONNECTION=mysql, DB_DATABASE=einaya_central_testing
- `.env` and `.env.example` — APP_NAME=Einaya, MySQL connection, `TENANCY_DB_CONNECTION=mysql`, `SESSION_DRIVER=file`
- `README.md` — full developer setup guide
- Composer: added `laravel/breeze` (dev), `stancl/tenancy ^3.10`
- pnpm lockfile written

### Background processes
- Vite dev server running with PID in `storage/logs/vite.pid`, log in `storage/logs/vite.log` (HTTPS via Herd cert at `https://einaya.test:5173`).

### Known one-time setup performed (manual + via this session)
- `einaya_central` MySQL DB created (manual: `mysql -u root -prootroot -e "CREATE DATABASE einaya_central ..."`)
- `einaya_central_testing` MySQL DB created (for `APP_ENV=testing` runs)
- `demo` tenant created → `einaya_tenant_demo` MySQL DB exists
- Herd: `einaya.test` parked + wildcard subdomains enabled

---

## How to Resume (next session)

1. Open fresh Claude conversation
2. Paste `ai/00-master-spec.md`
3. Paste `ai/PROGRESS.md` (this file, with latest updates)
4. Paste the active phase prompt from `ai/prompts/phase-02-central-schema.md`
5. Say: "Continue from where the previous session left off. Don't regenerate completed work."

If the Vite dev server is dead between sessions: `pnpm dev` in a new terminal, or `php artisan serve` (Laravel built-in) plus `pnpm build` for static assets.
