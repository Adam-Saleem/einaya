# Einaya — Build Progress

> **Update this file at the end of every Claude session, especially when context is getting full.**
> The next session reads this + `00-master-spec.md` and knows exactly where to resume.

---

## Current Status

**Active phase:** None — Phase 6 complete; ready to start Phase 7 (Super Admin).
**Last session date:** 2026-05-05

---

## Completed Phases

### ✅ Phase 6 — UI Foundation: shadcn, Layout, i18n, RTL, Dark Mode (2026-05-05)

All Definition of Done items met:
- shadcn/ui installed (`new-york` style) with 33 primitives under `resources/js/Components/ui/`. `components.json` configured with `@/Components`, `@/Components/ui`, `@/lib/utils`, `@/Hooks` aliases. CLI managed to non-interactively add components after `components.json` was hand-written.
- `tailwind.config.ts` (replaces `tailwind.config.js`) wires the full token surface: 30+ semantic colors via `rgb(var(--token) / <alpha-value>)`, sidebar palette, status palette (FullCalendar), Manrope/IBM Plex Sans Arabic/JetBrains Mono fonts, type scale (h1–display + base 14px), 8px radius, soft shadow ramp, sidebar/header spacing tokens. Plugins: `tailwindcss-animate`, `tailwindcss-rtl`, `@tailwindcss/forms`, `@tailwindcss/typography`. Tailwindcss upgraded 3.2.1 → 3.4.19.
- `resources/css/app.css` carries the `:root` + `.dark` CSS variable blocks (RGB triplets) + body font setup. `html[lang="ar"] body` swaps to `--font-arabic` automatically, so anywhere a body descendant inherits font-family.
- Backend prefs:
  - Migration `2026_05_05_000001_add_theme_preference_to_users` adds `theme_preference` (string, default `system`) to BOTH the central `users` table and the tenant `users` table (mirrored migration in `database/migrations/tenant/`).
  - `App\Http\Controllers\PreferenceController` handles `POST /api/preferences/language` (en/ar) and `POST /api/preferences/theme` (light/dark/system) — writes the column, sets the session `locale`, redirects back. Routes registered in both `central.php` and `tenant.php` with auth-gated + guest-allowed language variants.
  - `App\Http\Middleware\SetLocale` runs in the `web` group: pulls locale from session > user pref > config, calls `app()->setLocale()`. Wired in `bootstrap/app.php` ahead of `HandleInertiaRequests`.
  - `HandleInertiaRequests` now shares `preferences: { locale, direction, theme }` and `auth.isSuperAdmin` alongside the existing auth/permissions/roles/flash bag.
  - `resources/views/app.blade.php` reads the user's theme + locale server-side, sets `<html lang dir>`, runs an inline pre-paint script that applies `.dark` from `localStorage` (or stored pref / OS preference) before React mounts — kills theme FOUC.
- i18n: `resources/js/i18n.ts` uses i18next + react-i18next + browser-language-detector with `htmlTag → localStorage → navigator` resolution order. Three namespaces shipped (`common`, `auth`, `dashboard`) in `resources/js/locales/{en,ar}/`. Default NS = `common`. Hot-loaded JSON imports (no async fetch).
- Hooks: `useDirection()` (reads Inertia `preferences.direction`), `useLocale()` (changes language + persists + reload — needed because dir/font flip can't happen mid-render), `useTheme()` (light/dark/system, syncs `<html class="dark">`, listens to `prefers-color-scheme` for `system`, persists to both localStorage AND backend), `useFlashToasts()` (Inertia flash → Sonner toast, deduped by JSON fingerprint).
- Layouts: `resources/js/Layouts/AppLayout.tsx` + `CentralLayout.tsx` — both wrap content in shadcn's `<SidebarProvider>` + `<SidebarInset>` and accept `title`, `pageTitle`, `description`, `actions`, `breadcrumbs`. Domain components (`Components/domain/layout/`): `AppSidebar`, `CentralSidebar`, `AppTopbar`, `SidebarBrand`, `ThemeToggle`, `LanguageSwitcher`, `UserMenu`. All sidebars choose `side="left|right"` based on `useDirection()` so RTL puts navigation on the right edge automatically.
- AppSidebar items wrapped in `<Can permission=… />` filters at the section level — sections collapse to nothing when no item passes. Sections: Main, Medical, Billing, Admin (per spec).
- Reusable patterns in `Components/domain/`: `DataTable<TData, TValue>` (TanStack Table v8 + shadcn Table — pagination, global/column search, column toggle, RTL chevrons), `FormModal`, `EmptyState`, `StatusBadge` (5 variants: success/warning/info/danger/neutral), `ConfirmDialog`, `LoadingSpinner`, `PageSkeleton`, `PageHeader`, `AppBreadcrumb`.
- `resources/js/Pages/DesignSystem.tsx` — single-page showcase rendering color swatches, typography ramp, all button variants/sizes, all form controls, status badges, alerts, the DataTable, avatars + tabs, accordion, dialogs (FormModal + ConfirmDialog) with toast triggers, EmptyState + PageSkeleton. Page chooses AppLayout vs CentralLayout via the `context` prop. Gated by `App\Http\Middleware\AllowDesignSystem` — passes in `local`/`development` env or for `is_super_admin = true` users; 404 otherwise.
- Dashboard stubs: `Pages/Tenant/Dashboard.tsx` + `Pages/Central/Dashboard.tsx`, each with 4 stat cards using the design-token color/spacing system. Old `Pages/Central/SuperAdmin.tsx` deleted (route now points at `Central/Dashboard`).
- 4 new Pest tests in `tests/Feature/Central/PreferencesTest.php` (language persists, theme persists, invalid language rejected, invalid theme rejected). 46 total in the suite (was 42).
- TypeScript clean (`pnpm exec tsc --noEmit` zero errors). `pnpm build` produces a working manifest (5.5s, 506kB main bundle gzip 167kB — flagged for code-splitting in Phase 7+).
- Smoke: `https://einaya.test/` (200), `https://app.einaya.test/login` (200), `https://app.einaya.test/` (302→login), `https://demo.einaya.test/login` (200), `https://demo.einaya.test/` (200), `https://demo.einaya.test/design-system` (200). `storage/logs/laravel.log` empty.

**Phase 6 deviations from the prompt:**
- Did NOT use `next-themes` — wrote our own `useTheme()` hook (`resources/js/Hooks/useTheme.ts`) instead. Reasons: (a) we already needed Inertia-aware theme persistence to the backend, (b) `next-themes` is built around Next.js's app router idioms, and (c) the FOUC-prevention script in `app.blade.php` already runs before React mounts. The shadcn `sonner.tsx` component was rewritten to call our hook instead of `next-themes`'s.
- The shadcn-CLI `add` command silently rewrote `tailwind.config.ts` (HSL sidebar tokens, duplicated `darkMode`, mangled font fallbacks) and `resources/css/app.css` (HSL sidebar variables, extra `--sidebar-background`/`--sidebar-primary` keys). Both files were manually reset to RGB-triplet consistency afterward. If you re-run `shadcn add` for new components, expect another rewrite — diff before committing.
- Search bar in `AppTopbar` is a visual stub (button-styled command opener with ⌘K hint) — actual `cmdk` dialog wiring deferred to Phase 7 when there's something to search.
- Deleted `resources/js/Pages/Central/SuperAdmin.tsx`. The central root route renders `Central/Dashboard` now. No tests referenced the old name.
- Notifications dropdown in topbar is an empty-state placeholder (no notification model yet) — same approach as the spec calls for.
- Date-picker is not a separate file: shadcn ships `calendar.tsx` and `popover.tsx`; composing a `DatePicker` is a 10-line consumer-side pattern, deferred until first consumer (appointments UI in Phase 8).

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

### ✅ Phase 2 — Central Database Schema (2026-05-02)

All Definition of Done items met:
- Fresh `php artisan migrate:fresh --seed` produces:
  - 1 super admin user (`admin@einaya.ps` / `Einaya@2025`)
  - 3 subscription plans (Starter / Pro / Enterprise)
  - 1 demo clinic on Pro plan with `demo.einaya.test` domain + tenant DB auto-created
- All three URLs return 200 (`einaya.test`, `app.einaya.test`, `demo.einaya.test`)
- 34 Pest tests pass — adds 6 new ones in `Feature/Central/` (3 audit, 2 plan seed, 1 clinic creation)
- TypeScript clean
- Tinker confirms: `Clinic::all()` returns demo clinic; `User::first()->is_super_admin === true`

### ✅ Phase 5 — Roles, Permissions & Policies (2026-05-02)

All Definition of Done items met:
- `spatie/laravel-permission` installed; the `create_permission_tables` migration moved to `database/migrations/tenant/2026_05_02_000023_*` so roles/permissions live per-clinic.
- 4 roles seeded into every tenant DB: `clinic_admin` (all 46 perms), `doctor` (medical stack + read-only on staff/payments/reports), `secretary` (admin + scheduling + billing only — explicit deny on medical permissions), `nurse` (v2 stub).
- 46 permissions across 13 resource groups, defined as a string-backed `App\Enums\Tenant\Permission` enum (and mirrored in `resources/js/types/auth.ts` for compile-time safety on the FE).
- 13 policies in `app/Policies/Tenant/`, registered explicitly via `App\Providers\AuthServiceProvider` (Laravel 12 ships no AuthServiceProvider by default).
- `App\Models\Tenant\User` uses `Spatie\Permission\Traits\HasRoles`; central `User` is left alone (super admins are gated solely by `is_super_admin`).
- New tenancy pipeline job `App\Jobs\Tenancy\SeedTenantRolesPermissions` runs in EVERY env (production included) so role tables are populated before any user is created. Demo seeder (`SeedTenantDatabaseInDev`) runs after, skipped in production + testing as before.
- `TenantDemoSeeder` assigns `clinic_admin` + `doctor` to the doctor user and `secretary` to the secretary user.
- `HandleInertiaRequests` shares `auth.permissions` and `auth.roles` (empty arrays for the central super admin since the trait isn't installed there).
- `resources/js/Hooks/useCan.ts` + `resources/js/Components/domain/Can.tsx` wrap the shared permissions for declarative use; TS types in `resources/js/types/auth.ts`.
- 6 new authorization tests pass — 42 total in the suite. Demo tenant verified: 4 roles, 46 permissions, 104 role-permission mappings, 3 user-role assignments.
- All three URLs return 200; `storage/logs/laravel.log` empty.

**Phase 5 deviations from the prompt:**
- "Secretary direct URL access to `/consultations` returns 403" deferred to Phase 7. There are no resource controllers built yet (Phase 4 only added auth controllers), so Gate-level tests cover the same ground without scaffolding throwaway routes.

### ✅ Phase 4 — Authentication, 2FA & Multi-Context Login (2026-05-02)

All Definition of Done items met:
- Two auth guards configured: `web` (tenant) → `App\Models\Tenant\User`, `web_central` → `App\Models\Central\User`. Two password brokers, two providers. The `central` middleware swaps `auth.defaults.guard` to `web_central` for the request lifetime so shared controllers stay context-agnostic.
- Routes registered twice (once per context) via a closure in `routes/auth.php` — names prefixed with `central.` / `tenant.`. No `/register` route in either context (no self-signup in v1).
- Login flow:
  - Email + password → `LoginRequest` (5 attempts/min throttle on email+IP)
  - If user has `two_factor_confirmed_at` → session-stash `auth.two_factor.user_id`/`guard`/`remember`, redirect to `/two-factor/challenge`
  - Otherwise → fully logged in
- 2FA built on `pragmarx/google2fa-laravel` + `bacon/bacon-qr-code` (SVG QR data URIs). `App\Services\TwoFactorService` does the crypto; `App\Traits\HasTwoFactorAuth` is mixed into both User models. Recovery codes are individually `Hash::make()`'d before being encrypted in `two_factor_recovery_codes`.
- Sessions switched to the `database` driver — central uses the existing `sessions` table from the default Laravel migration; tenants got a new `2026_05_02_000022_create_sessions_table.php`. `SESSION_DOMAIN=null` so each subdomain has its own cookie.
- Password rules apply on update + reset: `Password::min(10)->mixedCase()->numbers()->symbols()`. Login itself only requires non-empty (so users can copy/paste long random passwords without re-validating them).
- Frontend: `Login.tsx`, `ForgotPassword.tsx`, `ResetPassword.tsx`, `ConfirmPassword.tsx`, `VerifyEmail.tsx`, `Profile/Edit.tsx` updated to use relative URLs (no Ziggy `route()` calls). New pages: `TwoFactorChallenge.tsx`, `TwoFactorSetup.tsx`. `Register.tsx` removed.
- 19 new auth tests pass — 36 total in the suite. Smoke: `https://einaya.test/`, `https://app.einaya.test/login`, `https://demo.einaya.test/login` all return 200; `https://app.einaya.test/` redirects guests to `/login`.
- `storage/logs/laravel.log` empty.

### ✅ Phase 3 — Tenant Database Schema (2026-05-02)

All Definition of Done items met:
- 21 tenant migrations run cleanly via the auto-provisioning pipeline. `php artisan migrate:fresh --seed` end-to-end:
  - Builds central DB
  - Seeds super admin + plans + demo clinic
  - `Clinic::create('demo')` fires the `TenantCreated` JobPipeline → `CreateDatabase` → `MigrateDatabase` → `SeedTenantDatabaseInDev`
  - The demo tenant DB ends up populated with: 2 users, 1 doctor + 5 working hours + 5 lunch breaks, 5 insurance providers, 20 patients (12 with insurance), 30 appointments, 15 consultations on completed visits, 1 medical form / 3 sections / 10 questions / 16 options, 5 form submissions, 3 prescriptions (6 items), 3 diagnoses, 15 payments
- All three URLs return 200 (`einaya.test`, `app.einaya.test`, `demo.einaya.test`)
- 40 Pest tests pass — adds 6 new ones in `Feature/Tenant/`:
  - `TenancyIsolationTest` — the codebase's most critical test
  - `PatientCodeGenerationTest` (sequential, per-tenant; soft-deleted IDs not reused)
  - `PatientFactoryTest`
  - `FormSubmissionSnapshotTest` (verifies ADR-002 — form edits don't rewrite history)
  - `AppointmentStatusTest` (enum casting + transitions)
- `storage/logs/laravel.log` is empty / no errors

---

## In Progress

_(none — pause point. Next: Phase 7 — Super Admin)_

---

## Blockers / Open Questions

_(none)_

---

## Key Decisions Made During Build

### Phase 1

- **No `RouteServiceProvider`** — Laravel 12 doesn't ship one. Routes registered via `bootstrap/app.php` `withRouting()` and a `then:` callback for `routes/central.php`. Phase 1 prompt assumed RouteServiceProvider; deviation is structural to Laravel 12.
- **No `tenant` connection in `config/database.php`** — stancl/tenancy v3 reserves the name `tenant` and creates the connection at runtime by cloning the central `mysql` connection. Phase 1 prompt asked for one; adding it would conflict with the package.
- **Marketing `/` domain-restricted** to `einaya.{ps,test}` + loopback (in `routes/web.php`) — without this, the URI `/` collides with `routes/tenant.php`'s `/`, and tenant.php (loaded later via `Application::booted()`) wins for all hosts. Domain restriction makes routing deterministic.
- **Custom Tenant model at `app/Models/Central/Tenant.php`** — extends `Stancl\Tenancy\Database\Models\Tenant`, implements `TenantWithDatabase`, uses `HasDatabase` + `HasDomains` traits. The base Tenant model doesn't implement `TenantWithDatabase`, so multi-DB CreateDatabase job fails without a custom one. `config/tenancy.php` `tenant_model` updated to point here. *(Phase 2: replaced by `Clinic` model and `clinics` table.)*
- **Breeze Welcome.tsx replaced** with a minimal "Welcome to Einaya" page (per Phase 1 spec naming).
- **Breeze auth/profile/dashboard routes left in `routes/web.php`** untouched — Phase 4 will refactor onto tenant subdomains.
- **`app/Models/User.php` left at root** (not moved to `Models/Central/`) — Breeze depends on it; Phase 2 owns the central User model. *(Phase 2: moved to `app/Models/Central/User.php`; old file deleted; all references updated.)*
- **TS fixes in Breeze templates** are minimal patches (typed `usePage<PageProps>()`); Phase 4 rewrites these files entirely.
- **Pest.php split** — `RefreshDatabase` applied only to Breeze-installed tests (`Feature/Auth/`, `Feature/ProfileTest.php`, `Feature/ExampleTest.php`). The tenancy test in `Feature/TenancyTest.php` opts out because tenant DB creation/deletion is DDL that auto-commits and breaks RefreshDatabase's transaction-rollback strategy. TenancyTest manages its own state via `pestSmokeCleanup()` (drops tenant DB + ends tenancy + deletes the test tenant row, scoped to a unique `pestsmoke` tenant ID).
- **phpunit.xml uses `einaya_central_testing`** MySQL DB (not in-memory sqlite). Tenancy test requires `CREATE/DROP DATABASE` DDL which sqlite can't do. Run `mysql -e "CREATE DATABASE einaya_central_testing ..."` then `APP_ENV=testing DB_DATABASE=einaya_central_testing php artisan migrate` once before first test run.
- **`SESSION_DRIVER=file`** in `.env` and `.env.example` — Laravel default `database` requires a `sessions` table in whatever connection is active, which would mean a tenant migration. Phase 1 keeps `database/migrations/tenant/` empty per spec, so we use the file driver. Phase 3 will add a sessions migration to the tenant folder and switch back to `database`.

### Phase 2

- **`Clinic` replaces `Tenant` as the tenancy root model.** `app/Models/Central/Tenant.php` deleted; `app/Models/Central/Clinic.php` is the new stancl tenant model with `protected $table = 'clinics'`. `tenants` migration replaced by a full `clinics` migration with name/slug/owner/status/branding/etc. `config/tenancy.php` `tenant_model` now points at `Clinic::class`. The `domains.tenant_id` FK now references `clinics(id)`.
- **`Clinic` declares all real columns via `getCustomColumns()`.** stancl's `VirtualColumn` trait moves any attribute not listed there into the `data` JSON column. Without overriding, our `name`/`slug`/etc. would be persisted as JSON instead of as real columns. The override includes `created_at`, `updated_at`, `deleted_at` so SoftDeletes works.
- **Central `User` model now lives at `app/Models/Central/User.php`** with strict types, `SoftDeletes`, 2FA columns, `is_super_admin`, `preferred_language`. Old `app/Models/User.php` deleted. All Breeze references (`config/auth.php`, `RegisteredUserController`, `ProfileUpdateRequest`, every test file in `Feature/Auth/` and `ProfileTest.php`) updated to import `App\Models\Central\User`.
- **`UserFactory` moved to `database/factories/Central/UserFactory.php`** in matching namespace. Each Central model declares `protected static function newFactory()` so HasFactory finds the namespaced factory.
- **`tests/Feature/ProfileTest.php` `assertNull($user->fresh())` → `assertSoftDeleted($user)`.** Required because `User` now uses SoftDeletes and Eloquent `fresh()` skips global scopes (so it returns the trashed record, not null).
- **Subscription FK is added in a follow-up migration** (`2026_05_02_000003_add_subscription_id_fk_to_clinics_table`) because `clinics` has `subscription_id → subscriptions.id` and `subscriptions` has `clinic_id → clinics.id` — circular. Order: clinics (column nullable, no FK), subscription_plans, subscriptions, then add FK back onto clinics.
- **`subscription_id` typed as `unsignedBigInteger` (not `foreignId`) on clinics** to avoid the FK constraint at create-time. The constraint is added later by the follow-up migration.
- **`subscriptions.clinic_id` and `support_tickets.clinic_id` typed as `string`** (not `foreignId`) since `clinics.id` is a UUID string. FK added manually with `->references('id')->on('clinics')`.
- **Status columns use `string('col', 30)` + enum cast** (per `database-conventions.md`), not `->enum()` migration helper. Enums are string-backed (`pending`/`active`/`trial`/etc.) so JSON inspection stays readable.
- **`use WithoutModelEvents` removed from `DatabaseSeeder`.** With it on, `Clinic::create()` in `DemoClinicSeeder` did NOT fire stancl's `TenantCreated` event, so the `CreateDatabase` JobPipeline never ran and `einaya_tenant_demo` was never created. Phase 1 didn't hit this because tenants were created via tinker.
- **Tenant DB prefix is now env-driven.** `config('tenancy.database.prefix')` reads `TENANCY_DB_PREFIX` (default `einaya_tenant_`). `phpunit.xml` sets it to `einaya_test_tenant_` so `php artisan test` cannot drop the dev tenant DBs (the test cleanup helpers also DROP the prefixed DB; without isolation, every test run nuked `einaya_tenant_demo`). All test cleanup helpers compute the DB name from config rather than hardcoding.
- **`DemoClinicSeeder` is idempotent** (re-run safe): finds existing demo clinic by slug, ensures the domain row + active subscription exist, only triggers tenant DB creation on first run. Includes a guard that warns and skips `tenants:migrate` if `database/migrations/tenant/` is empty (Phase 3 fills that folder).
- **`AuditLogService` accepts a nullable `Request` and nullable `User`** — the audit log table allows null user_id, and seeder/cron contexts have no request. Backend-conventions rule "no facades in services" is honored: Request is constructor-injected (Laravel resolves it from the container) instead of using the `request()` helper.

### Phase 5

- **Spatie permission cache → `array` driver, not `database`.** stancl's `CacheTenancyBootstrapper` routes the database cache store to the active tenant DB, but tenant DBs have no `cache` table. The migration's `Cache::forget()` call therefore exploded mid-seed. `'store' => 'array'` keeps the cache process-local, which costs us nothing because the catalog is tiny (~4 roles, ~50 perms) and rebuilds in microseconds per request.
- **Two-stage tenant pipeline:** `SeedTenantRolesPermissions` runs unconditionally (every env); `SeedTenantDatabaseInDev` runs only in non-production+non-testing. Without the role seeder running in production, every clinic user would be locked out — Spatie's `Gate::before` short-circuits to false when no role/permission rows exist.
- **`AuthServiceProvider` registered explicitly** in `bootstrap/providers.php`. Laravel 12 doesn't ship one by default and policy auto-discovery doesn't span the `App\Models\Tenant\X` ↔ `App\Policies\Tenant\XPolicy` namespace pair (Laravel only auto-resolves `App\Policies\XPolicy`). Listing the 13 model→policy pairs explicitly is also greppable.
- **`HandleInertiaRequests::share` uses `method_exists(...)` to test for `HasRoles`.** The Inertia middleware is shared across central and tenant contexts; the central super admin's User model doesn't have `getAllPermissions()`, so the trait check keeps both contexts working without branching on guard.
- **`UserPolicy` lets a user always view themselves regardless of `staff.view`.** Without this, a doctor without staff perms couldn't even hit their own profile page. Self-delete via staff management still requires `staff.delete` AND is blocked by an `id !== id` guard.
- **`PaymentPolicy` and `FormSubmissionPolicy` return `false` on `update`/`delete`** even for clinic_admin. Payments are adjusted via the separate `refund` ability; form submissions are immutable per ADR-002. The policy enforces this even if a permission slips into the role matrix later.
- **No "super-admin" wildcard permission.** Spatie supports a `super-admin` role that bypasses every check via `Gate::before`; we don't use it. Clinic admin has every permission listed explicitly so role audits are accurate.
- **`PatientFilePolicy::view` cross-checks the file category** against `patients.view_medical`. Secretaries can see ID/insurance card scans (admin categories) but not external reports or prescription scans, even though they have `files.view` and `files.upload`. Defense-in-depth — same rule will be re-asserted at the controller level when Phase 7 builds file UI.

### Phase 4

- **Two guards + two providers + two brokers in `config/auth.php`.** Default guard is `web` (tenant); `web_central` is the central-context guard. The `EnsureCentralContext` middleware mutates `config('auth.defaults.guard')` and `auth.defaults.passwords` for the lifetime of central requests so `Auth::user()` / `Auth::attempt()` / `Password::sendResetLink()` resolve to the right model and table without explicit guard threading. This isn't elegant (config mutation is shared state) but it keeps the Breeze-style controllers reusable across both contexts.
- **`routes/auth.php` is a closure, not a route file.** It returns a callable that accepts a name prefix (`central` or `tenant`) and registers the same set of routes under that prefix. Both `routes/central.php` and `routes/tenant.php` `(require __DIR__.'/auth.php')('xxx')`. Why: route names are global in Laravel — registering `login` twice would silently let only the last-registered version generate URLs. Prefixing avoids collisions. The trade-off is `redirect()->route('login')` doesn't work; controllers use `redirect()->route(AuthContext::prefix().'.login')`.
- **Frontend uses relative URLs (`/login`, `/profile`, `/two-factor`) instead of Ziggy `route('xxx')`.** Same reason as above — Ziggy's `route('login')` would fail for one of the two contexts. Relative paths route correctly to the current host.
- **`bootstrap/app.php` calls `redirectGuestsTo(fn () => '/login')`** — Laravel's default `Authenticate` middleware tries to resolve `route('login')` on 401, which doesn't exist. The closure short-circuits the named-route lookup with a relative URL.
- **`HasTwoFactorAuth` trait + `TwoFactorService`** — service is the cryptography layer (Google2FA + QR), trait is the model-attribute layer (encrypt/decrypt secret, hash recovery codes, `confirmTwoFactor` returns the plaintext recovery codes once). Recovery code format `XXXX-XXXX` (8 chars). Codes are `Hash::make()`'d individually then JSON-encoded then `Crypt::encryptString`'d — three layers — so a stolen DB still requires the `APP_KEY` plus a brute-force pass.
- **2FA challenge runs against a separate rate limiter** (key: `two-factor|user_id|ip`) so a TOTP guesser can't bypass the login rate limit by skipping the credential step.
- **`Auth::attempt()` is split into `validate()` + `login()`** in `AuthenticatedSessionController::store()` so we can branch on `hasTwoFactorEnabled()` *before* the session is logged in. Without this, the user would already be authed before being asked for their second factor.
- **Sessions switched to `database` driver. Central uses the default Laravel `sessions` migration; tenant got `2026_05_02_000022_create_sessions_table.php`.** `SESSION_DOMAIN=null` keeps cookies per-host so a clinic A session never leaks into clinic B (each subdomain gets its own cookie). The `FilesystemTenancyBootstrapper` already handles per-tenant storage paths if anything needs file sessions later.
- **Password rules NOT applied on login.** A user with a strong existing password (set via reset/update) shouldn't fail to log in just because it has unusual characters — Laravel's Password rule is for *new* passwords. Applied to: password update (`PUT /password`) and password reset (`POST /reset-password`). Rule: `Password::min(10)->mixedCase()->numbers()->symbols()`.
- **Old Breeze auth tests deleted.** `AuthenticationTest`, `EmailVerificationTest`, `PasswordConfirmationTest`, `PasswordResetTest`, `PasswordUpdateTest`, `RegistrationTest`, `ProfileTest` all removed. Replaced with the 7 Phase 4 tests, which cover the same ground plus 2FA, throttling, and cross-context auth. `Register.tsx` and `RegisteredUserController` also deleted (no v1 self-signup).
- **`tests/Feature/Auth/TenantLoginTest` and `WrongContextTest` opt out of `RefreshDatabase`** because they create real tenant DBs (DDL auto-commits and breaks transaction rollback). Listed explicitly in `tests/Pest.php` alongside `TenancyTest` and the tenant tests. The other 5 auth tests stay in the RefreshDatabase group since they only touch the central DB.

### Phase 6

- **Self-rolled `useTheme()` over `next-themes`.** next-themes is great for Next.js (it owns the document head and body), but in our Inertia/Blade setup we needed: (a) backend persistence, (b) a pre-paint script in Blade that runs *before* React mounts, (c) compatibility with the `<html>` `dir`/`lang` attributes Blade sets server-side. A single hook (44 lines) handles all three; the shadcn `sonner.tsx` component was patched to use it.
- **Tailwind tokens in RGB triplets, not HSL.** The shadcn `init` command produced HSL-format sidebar tokens that clashed with the rest of our palette. Standardizing on `rgb(var(--token) / <alpha-value>)` everywhere keeps the `<alpha-value>` shorthand working with utilities like `bg-primary/15`, which we use heavily in `StatusBadge`. Trade-off: re-running `shadcn add` will overwrite this and must be diffed.
- **Language switcher does a full page reload.** Inertia partial reloads can swap the JSON props but can't re-paint the `<html dir>`/`lang`/font-family chain in one tick — and forcing a hard reload also lets the in-page Blade boot script set the right pre-paint state for the new locale. This is intentional, not a TODO.
- **Pre-paint theme script in `app.blade.php`.** Reads `localStorage['einaya-theme']` first, falls back to the user's stored pref, falls back to OS preference, then sets `document.documentElement.classList` BEFORE Vite assets load. Without this, every navigation would flash light-mode for ~80–120ms while React mounts. The same script also reads `auth()->user()->theme_preference` server-side as a tertiary fallback so first-paint-after-login is correct without client storage.
- **`<html dir>` set by Blade, not React.** The dir attribute is computed from `session('locale') ?? user->preferred_language ?? app->getLocale()` in the layout view. React-driven dir-swapping would mean a flash of LTR content for AR users on first paint. Reload-on-locale-change keeps this server-rendered.
- **`HandleInertiaRequests` shares `auth.isSuperAdmin`** as a precomputed boolean. The frontend uses this to decide which layout to mount (`AppLayout` vs `CentralLayout`) and whether `/design-system` is reachable, without having to inspect the user model client-side. The central super admin's user model has no `HasRoles` trait, so we can't infer "super admin" from `roles` alone.
- **Sidebar side computed from `useDirection()`.** shadcn's `<Sidebar side="left|right">` accepts a literal value; passing `side={direction === 'rtl' ? 'right' : 'left'}` mirrors the entire sidebar including its drawer behavior on mobile. Combined with `tailwindcss-rtl` and logical-property classes (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`), the layout swaps without per-component RTL conditionals.
- **Sonner is mounted once at app root** (in `app.tsx`, inside `<TooltipProvider>` so all toast actions can have tooltips). Pages opt-in to flash-toast forwarding via `useFlashToasts()` — kept as an opt-in hook rather than a layout-level effect so flash propagation is explicit and easy to disable on pages that handle their own success/error UI.
- **`AllowDesignSystem` middleware uses `app()->environment('local', 'development')`** rather than `app()->isLocal()`. The latter only checks for `local`; we treat both `local` and `development` (and *only* those) as "you can see internals." Production super admins can still see it because it's a useful debugging surface for them.
- **Three i18n namespaces shipped now:** `common` (nav, actions, status, topbar, language, empty, table), `auth` (login, 2FA), `dashboard` (welcome, stats). Phase 7+ adds `patients`, `appointments`, `consultations`, `forms`, `payments`, `staff`, `settings` as those features ship — keeps each namespace's JSON file small and lazy-load-ready.
- **`User | null` in `PageProps.auth.user`.** Most pages assume an authenticated user, but `Tenant/Welcome.tsx` (unauthenticated tenant landing) doesn't. Typing it as nullable is honest; the two surviving Breeze files (`AuthenticatedLayout`, `UpdateProfileInformationForm`) use a `!` non-null assertion since their middleware guarantees a user.
- **Bundle size warning is acknowledged, not fixed.** Phase 6 ships a 506kB main bundle (167kB gzip) because every shadcn primitive + i18n + TanStack table + Sonner + lucide is statically imported. Code-splitting is a Phase-7 concern: route-level `lazy()` for `DesignSystem` and the per-feature pages, and a separate locale-fetch path so AR users don't ship EN strings (and vice versa).

### Phase 3

- **Auto-provisioning hook lives in `App\Jobs\Tenancy\SeedTenantDatabaseInDev`**, wired into `TenancyServiceProvider`'s `TenantCreated` `JobPipeline` after `Jobs\CreateDatabase` and `Jobs\MigrateDatabase`. The job is `shouldBeQueued(false)` so it runs synchronously during `Clinic::create()` — the seeder skips itself when `app()->environment('production', 'testing')` to keep prod clean and tests fast. Tests that need seeded data (only `TenancyIsolationTest`) call the seeder explicitly.
- **`DemoClinicSeeder` no longer calls `tenants:migrate` manually** — the JobPipeline does it. Also removed `tenantMigrationsExist()` guard since Phase 3 always has migrations now.
- **Tenant root seeder lives at `Database\Seeders\Tenant\DatabaseSeeder`** and just calls `TenantDemoSeeder`. stancl's default `seeder_parameters['--class']` is the string `'DatabaseSeeder'`, but the SeedTenantDatabaseInDev job invokes the tenant seeder by FQCN, so the central root seeder is never accidentally run inside a tenant DB.
- **Patient code generation lives in `App\Services\Tenant\PatientCodeGenerator`** and is invoked from `Patient::booted()`'s `creating` event. Format `P-%05d`, computed as `max(id) + 1` over `withTrashed()` so soft-deleted IDs don't get reused. Per-tenant counter — verified by `PatientCodeGenerationTest`.
- **Form snapshot shape is built by the seeder and the snapshot test** (matching shape). When Phase 8 builds the form builder UI, the canonical snapshot serializer should move into `App\Services\Tenant\FormSnapshotter` (or similar) and be the single source of truth for both submission writes and historical reads.
- **Three FK delete strategies in tenant schema:** `cascadeOnDelete()` for child rows that can't survive parent removal (`doctor_working_hours`, `doctor_breaks`, `doctor_time_off`, `form_sections`, `form_questions`, `form_question_options`, `prescription_items`); `nullOnDelete()` where the FK is metadata that can disappear (`patients.registered_by`, `patients.insurance_provider_id`, `consultations.appointment_id`, `form_submissions.medical_form_id`, `payments.appointment_id`/`consultation_id`, `tenant_audit_logs.user_id`); `restrictOnDelete()` everywhere else so accidentally hard-deleting a patient/doctor/user fails loudly instead of cascading through medical records.
- **`patients.preferred_language`, `users.preferred_language` cast as `App\Enums\Tenant\PreferredLanguage`** (en/ar) — single shared enum so both staff and patients use the same set of language codes.
- **All FormQuestion/FormSection JSON fields cast as `array`**; `validation_rules` and `conditions` are nullable JSON for v1 (rules) / v2 (conditional logic).
- **Test cleanup helper at `tests/Feature/Tenant/TenancyTestSetup.php`** drops tenant DBs by literal name pattern (`SHOW DATABASES LIKE`) since stancl's tenant DBs are auto-committed DDL and can't be rolled back with `RefreshDatabase`. Each tenant test uses a unique slug prefix (`pesttestiso-`, `pesttestcode-`, `pesttestsnapshot-`, etc.) so two test files never collide on the same DB. `phpunit.xml`'s `TENANCY_DB_PREFIX=einaya_test_tenant_` keeps these databases isolated from any dev tenant DBs.
- **`pest()->extend(...)->in('Feature/Tenant')`** registers the tenant tests *without* `RefreshDatabase` (same opt-out as `TenancyTest`/`ClinicCreationTest`). The folder also contains `TenancyTestSetup.php` — Pest only collects `*Test.php` so the helper isn't run as a test, just `require_once`'d by the actual test files.
- **Patient factory `withInsurance(int $providerId)` state** keeps the seeder simple (~60% of patients get this state) and avoids the factory making its own provider rows.
- **Demo doctor's working schedule is Sun–Thu (`day_of_week` 0–4) 09:00–17:00 with a 13:00–14:00 lunch break** — matches typical Palestinian clinic hours; weekend is Fri/Sat.

---

## Files Modified This Session

### Phase 2 — Created

- `database/migrations/2019_09_15_000010_create_clinics_table.php` (replaces tenants)
- `database/migrations/2026_05_02_000001_create_subscription_plans_table.php`
- `database/migrations/2026_05_02_000002_create_subscriptions_table.php`
- `database/migrations/2026_05_02_000003_add_subscription_id_fk_to_clinics_table.php`
- `database/migrations/2026_05_02_000004_create_global_settings_table.php`
- `database/migrations/2026_05_02_000005_create_central_audit_logs_table.php`
- `database/migrations/2026_05_02_000006_create_support_tickets_table.php`
- `app/Enums/Central/{ClinicStatus,SubscriptionStatus,TicketStatus}.php`
- `app/Models/Central/{User,Clinic,SubscriptionPlan,Subscription,GlobalSetting,CentralAuditLog,SupportTicket}.php`
- `app/Services/Central/AuditLogService.php`
- `database/factories/Central/{UserFactory,ClinicFactory,SubscriptionPlanFactory,SubscriptionFactory}.php`
- `database/seeders/Central/{SuperAdminSeeder,SubscriptionPlansSeeder,DemoClinicSeeder}.php`
- `tests/Feature/Central/{ClinicCreationTest,SubscriptionPlanTest,AuditLogTest}.php`

### Phase 2 — Modified

- `database/migrations/0001_01_01_000000_create_users_table.php` — added 2FA, `is_super_admin`, `preferred_language`, softDeletes
- `database/migrations/2019_09_15_000020_create_domains_table.php` — FK now references `clinics(id)`
- `database/seeders/DatabaseSeeder.php` — wires three Central seeders; removed `WithoutModelEvents`
- `config/auth.php` — `App\Models\Central\User`
- `config/tenancy.php` — `tenant_model => Clinic::class`; prefix/suffix env-driven
- `phpunit.xml` — `TENANCY_DB_PREFIX=einaya_test_tenant_`
- `tests/Pest.php` — RefreshDatabase scope updated; ClinicCreationTest opts out
- `tests/Feature/TenancyTest.php` — uses `Clinic` with full required attributes; cleanup uses configured prefix
- `tests/Feature/ProfileTest.php` — `assertSoftDeleted` instead of `assertNull(fresh)`
- `app/Http/Controllers/Auth/RegisteredUserController.php` — Central\User import
- `app/Http/Requests/ProfileUpdateRequest.php` — Central\User import
- All `tests/Feature/Auth/*.php` — Central\User imports

### Phase 2 — Deleted

- `app/Models/User.php` (replaced by `app/Models/Central/User.php`)
- `app/Models/Central/Tenant.php` (replaced by `app/Models/Central/Clinic.php`)
- `database/factories/UserFactory.php` (moved to `database/factories/Central/UserFactory.php`)
- `app/Enums/Central/.gitkeep`, `app/Services/Central/.gitkeep`

### Phase 3 — Created

- `database/migrations/tenant/2026_05_02_000001..000021_*.php` (21 tenant migrations covering users, doctors+schedule, insurance, patients+files, appointments, consultations, full form builder, form submissions, prescriptions, diagnoses, payments, clinic settings, tenant audit logs)
- `app/Enums/Tenant/{PreferredLanguage,PatientGender,PatientMaritalStatus,PatientFileCategory,AppointmentStatus,FormType,FormQuestionType,PaymentMethod,PaymentStatus}.php`
- `app/Models/Tenant/{User,Doctor,DoctorWorkingHour,DoctorBreak,DoctorTimeOff,InsuranceProvider,Patient,PatientFile,Appointment,Consultation,MedicalForm,FormSection,FormQuestion,FormQuestionOption,FormSubmission,Prescription,PrescriptionItem,Diagnosis,Payment,ClinicSetting,TenantAuditLog}.php`
- `app/Services/Tenant/{PatientCodeGenerator,AuditLogService}.php`
- `app/Jobs/Tenancy/SeedTenantDatabaseInDev.php` (JobPipeline step)
- `database/factories/Tenant/{User,Doctor,InsuranceProvider,Patient,Appointment,Consultation,MedicalForm}Factory.php`
- `database/seeders/Tenant/{DatabaseSeeder,TenantDemoSeeder}.php`
- `tests/Feature/Tenant/{TenancyTestSetup.php,TenancyIsolationTest,PatientCodeGenerationTest,PatientFactoryTest,FormSubmissionSnapshotTest,AppointmentStatusTest}.php`

### Phase 3 — Modified

- `app/Providers/TenancyServiceProvider.php` — `SeedTenantDatabaseInDev::class` added to `TenantCreated` pipeline
- `database/seeders/Central/DemoClinicSeeder.php` — dropped manual `tenants:migrate` and `tenantMigrationsExist()` (the pipeline runs migrations + seeder now)
- `tests/Pest.php` — `Feature/Tenant` opted out of `RefreshDatabase`

### Phase 4 — Created

- `app/Services/TwoFactorService.php`
- `app/Traits/HasTwoFactorAuth.php`
- `app/Support/AuthContext.php` (helper for `central.`/`tenant.` route-name prefix + guard/broker resolution)
- `app/Http/Middleware/EnsureCentralContext.php`
- `app/Http/Middleware/RequireTwoFactor.php`
- `app/Http/Controllers/Auth/TwoFactorChallengeController.php`
- `app/Http/Controllers/Auth/TwoFactorSetupController.php`
- `app/Http/Requests/Auth/TwoFactorChallengeRequest.php`
- `database/migrations/tenant/2026_05_02_000022_create_sessions_table.php`
- `resources/js/Pages/Auth/TwoFactorChallenge.tsx`
- `resources/js/Pages/Auth/TwoFactorSetup.tsx`
- `tests/Feature/Auth/{CentralLoginTest,TenantLoginTest,WrongContextTest,TwoFactorSetupTest,TwoFactorChallengeTest,LoginThrottlingTest,PasswordRequirementsTest}.php`

### Phase 4 — Modified

- `composer.json` / `composer.lock` — added `pragmarx/google2fa-laravel`, `bacon/bacon-qr-code`
- `config/auth.php` — two guards, two providers, two password brokers
- `bootstrap/app.php` — middleware aliases (`central`, `two_factor`); `redirectGuestsTo(fn () => '/login')`
- `app/Providers/TenancyServiceProvider.php` — unchanged from Phase 3
- `app/Models/Central/User.php` + `app/Models/Tenant/User.php` — `HasTwoFactorAuth` trait
- `app/Http/Controllers/Auth/*` — context-aware redirects, password broker selection, password rules
- `app/Http/Controllers/ProfileController.php` — context-aware
- `app/Http/Requests/ProfileUpdateRequest.php` + `Auth/LoginRequest.php` — model resolution by guard, throttling-only login
- `routes/auth.php` — closure-based, name-prefixed
- `routes/web.php` — only marketing root remains
- `routes/central.php` — `central` middleware + auth route inclusion + auth-guarded dashboard
- `routes/tenant.php` — auth route inclusion + auth-aware tenant home
- `resources/js/Pages/Auth/{Login,ForgotPassword,ResetPassword,ConfirmPassword,VerifyEmail}.tsx` — relative URLs
- `resources/js/Pages/Profile/{Edit,Partials/*}.tsx` — relative URLs + 2FA section in Edit
- `resources/js/Layouts/AuthenticatedLayout.tsx` — relative URLs + path-based active state
- `tests/Pest.php` — auth test files split between RefreshDatabase / non-RefreshDatabase groups
- `tests/Feature/TenancyTest.php` — central root assertion changed to `/login` (root now requires auth)
- `.env`, `.env.example` — `SESSION_DRIVER=database`

### Phase 4 — Deleted

- `app/Http/Controllers/Auth/RegisteredUserController.php`
- `resources/js/Pages/Auth/Register.tsx`
- `tests/Feature/Auth/{Authentication,EmailVerification,PasswordConfirmation,PasswordReset,PasswordUpdate,Registration}Test.php`
- `tests/Feature/ProfileTest.php`

### Phase 5 — Created

- `app/Enums/Tenant/{Role,Permission}.php`
- `app/Policies/Tenant/{Patient,Appointment,Consultation,MedicalForm,FormSubmission,Prescription,Diagnosis,Payment,PatientFile,InsuranceProvider,User,Doctor,AuditLog}Policy.php`
- `app/Providers/AuthServiceProvider.php`
- `app/Jobs/Tenancy/SeedTenantRolesPermissions.php`
- `database/seeders/Tenant/RolesAndPermissionsSeeder.php`
- `database/migrations/tenant/2026_05_02_000023_create_permission_tables.php` (moved from default location)
- `config/permission.php` (published)
- `resources/js/types/auth.ts`
- `resources/js/Hooks/useCan.ts`
- `resources/js/Components/domain/Can.tsx`
- `tests/Feature/Tenant/Authorization/{RoleAssignment,ClinicAdminFullAccess,SecretaryCannotViewMedical,DoctorCanManageForms,PolicyEnforcement}Test.php`

### Phase 5 — Modified

- `composer.json` / `composer.lock` — added `spatie/laravel-permission`
- `config/permission.php` — `cache.store` switched to `array`
- `bootstrap/providers.php` — `AuthServiceProvider` registered
- `app/Providers/TenancyServiceProvider.php` — `SeedTenantRolesPermissions` added to pipeline before demo seeder
- `app/Models/Tenant/User.php` — `HasRoles` trait
- `app/Http/Middleware/HandleInertiaRequests.php` — shares `auth.permissions`, `auth.roles`, and a `flash` bag
- `database/seeders/Tenant/TenantDemoSeeder.php` — assigns `clinic_admin`+`doctor` and `secretary` roles
- `resources/js/types/index.d.ts` — `auth.permissions` + `auth.roles` typed via `auth.ts`

### Phase 6 — Created

- `tailwind.config.ts` (replaces `tailwind.config.js`)
- `components.json` (shadcn registry config)
- `resources/css/app.css` (rewritten with full token block)
- `resources/js/lib/utils.ts` (`cn()` helper)
- `resources/js/Components/ui/{accordion,alert,alert-dialog,avatar,badge,breadcrumb,button,calendar,card,checkbox,command,dialog,dropdown-menu,form,input,label,navigation-menu,pagination,popover,progress,radio-group,scroll-area,select,separator,sheet,sidebar,skeleton,sonner,switch,table,tabs,textarea,tooltip}.tsx` (33 shadcn primitives — `sonner.tsx` modified to use our `useTheme`)
- `resources/js/Components/domain/{AppBreadcrumb,ConfirmDialog,DataTable,EmptyState,FormModal,LoadingSpinner,PageHeader,PageSkeleton,StatusBadge}.tsx`
- `resources/js/Components/domain/layout/{AppSidebar,AppTopbar,CentralSidebar,LanguageSwitcher,SidebarBrand,ThemeToggle,UserMenu}.tsx`
- `resources/js/Hooks/{useDirection,useFlashToasts,useLocale,useTheme}.ts`
- `resources/js/Hooks/use-mobile.tsx` (shipped by shadcn `sidebar`)
- `resources/js/Layouts/{AppLayout,CentralLayout}.tsx`
- `resources/js/Pages/{DesignSystem,Tenant/Dashboard,Central/Dashboard}.tsx`
- `resources/js/i18n.ts`
- `resources/js/locales/{en,ar}/{common,auth,dashboard}.json`
- `app/Http/Controllers/PreferenceController.php`
- `app/Http/Middleware/{SetLocale,AllowDesignSystem}.php`
- `database/migrations/2026_05_05_000001_add_theme_preference_to_users.php`
- `database/migrations/tenant/2026_05_05_000001_add_theme_preference_to_users.php`
- `tests/Feature/Central/PreferencesTest.php` (4 tests)

### Phase 6 — Modified

- `package.json` / `pnpm-lock.yaml` — added: tailwindcss@^3.4 (upgraded from 3.2.1), tailwindcss-animate, tailwindcss-rtl, @tailwindcss/typography, class-variance-authority, clsx, tailwind-merge, lucide-react, sonner, cmdk, vaul, next-themes (transitive shadcn dep — unused at runtime), date-fns, react-day-picker, @tanstack/react-table, i18next, react-i18next, i18next-browser-languagedetector, plus 19 `@radix-ui/react-*` primitives.
- `resources/js/app.tsx` — imports `i18n.ts`, mounts `<TooltipProvider>` + `<Toaster>` at root, swaps progress bar color to primary blue.
- `resources/js/types/index.d.ts` — `User` interface picks up `preferred_language` + `theme_preference`; new `Preferences` type; `PageProps.auth.user` now `User | null`; `PageProps.auth.isSuperAdmin` boolean; new `PageProps.preferences`.
- `resources/views/app.blade.php` — server-renders `<html lang dir>`, embeds Google Fonts (Manrope + IBM Plex Sans Arabic + JetBrains Mono), runs pre-paint theme script.
- `app/Models/Central/User.php`, `app/Models/Tenant/User.php` — added `theme_preference` to `$fillable`.
- `app/Http/Middleware/HandleInertiaRequests.php` — shares `preferences` and `auth.isSuperAdmin`.
- `bootstrap/app.php` — `SetLocale` prepended to web group; aliases `central`, `two_factor`, `design_system`.
- `routes/central.php` — renames root render to `Central/Dashboard`; adds `/api/preferences/{language,theme}` (auth) + `/api/preferences/language/guest` + `/design-system` (`design_system` middleware).
- `routes/tenant.php` — adds `/api/preferences/{language,theme}` + guest variant + `/design-system`.
- `resources/js/Layouts/AuthenticatedLayout.tsx`, `resources/js/Pages/Profile/Partials/UpdateProfileInformationForm.tsx` — `auth.user!` non-null assertion to satisfy the new nullable type.
- `resources/js/Components/ui/button.tsx` — sized to spec (`h-11` default, `h-14` lg, `icon: h-11 w-11`).
- `resources/js/Components/ui/input.tsx` — sized to spec (`h-11`, ring-2).
- `tests/Pest.php` — `Feature/Central/PreferencesTest.php` added to `RefreshDatabase` group.

### Phase 6 — Deleted

- `resources/js/Pages/Central/SuperAdmin.tsx` (replaced by `Central/Dashboard.tsx`)
- `tailwind.config.js` (replaced by `tailwind.config.ts`)

### Phase 5 — Post-completion fix

- **Added `database/migrations/tenant/2026_05_02_000024_create_cache_table.php`** (tables `cache` + `cache_locks`). Logging in at a tenant subdomain blew up with "Table 'einaya_tenant_demo.cache' doesn't exist" — Laravel's `RateLimiter` uses the `database` cache store, and stancl's `CacheTenancyBootstrapper` routes that store to the active tenant DB. Mirroring the central `cache_table` migration into the tenant folder fixes the rate limiter, any future tagged caches, and per-clinic memoization. (Spatie's permission cache stays on the `array` driver — it doesn't need to persist between requests.)

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
4. Paste the active phase prompt from `ai/prompts/phase-03-*.md`
5. Say: "Continue from where the previous session left off. Don't regenerate completed work."

If the Vite dev server is dead between sessions: `pnpm dev` in a new terminal, or `php artisan serve` (Laravel built-in) plus `pnpm build` for static assets.
