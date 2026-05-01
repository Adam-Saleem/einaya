# Phase 1 — Project Setup & Tenancy Foundation

> **Prerequisite:** Paste `00-master-spec.md` above this prompt.

## Goal

Set up the Einaya project foundation: a working Laravel 12 + Inertia React + TypeScript skeleton with stancl/tenancy v3 multi-database mode wired up. **No business features yet** — just a working tenancy skeleton.

## Deliverables

### 1. Fresh Laravel 12 project

Bootstrap with:
- Laravel Breeze (Inertia React + TypeScript stack, SSR=false)
- pnpm as package manager (replace any npm references)
- Pest v3 installed and configured (replace PHPUnit defaults)
- PHP 8.3+ strict types in all new files

### 2. stancl/tenancy v3 — Multi-Database Mode

- Install: `composer require stancl/tenancy`
- Publish config and migrations
- Configure central domains: `einaya.ps`, `app.einaya.ps`, `einaya.test`, `app.einaya.test`
- Configure tenant domain pattern: `{clinic}.einaya.ps` and `{clinic}.einaya.test`
- Enable bootstrappers: `DatabaseTenancyBootstrapper`, `CacheTenancyBootstrapper`, `FilesystemTenancyBootstrapper`, `QueueTenancyBootstrapper`
- Tenant migrations folder: `database/migrations/tenant`
- Tenant DB naming pattern: `einaya_tenant_{tenant_id}`
- Configure central database connection: `einaya_central`
- Configure separate `tenant` connection in `config/database.php`

### 3. Folder Structure

Create the following directories (with `.gitkeep` files where empty):

```
app/
├── Services/{Central,Tenant}/
├── Actions/{Central,Tenant}/
├── Http/Controllers/{Central,Tenant}/
├── Http/Requests/{Central,Tenant}/
├── Policies/
├── Enums/{Central,Tenant}/
├── Models/{Central,Tenant}/
└── Multitenancy/

database/
├── migrations/          (central migrations)
└── migrations/tenant/   (tenant migrations — empty for now)

resources/js/
├── Pages/{Auth,Central,Tenant}/
├── Layouts/
├── Components/ui/
├── Components/domain/
├── Hooks/
├── types/
└── locales/{en,ar}/
```

### 4. Routes Split

- `routes/web.php` — marketing/public pages (central context, root domain)
- `routes/central.php` — super admin routes (central context, `app.einaya.ps`)
- `routes/tenant.php` — clinic routes (tenant subdomains)

Wire all three into `RouteServiceProvider` with:
- Central routes use `web` middleware group
- Tenant routes use `web` + `InitializeTenancyByDomain` + `PreventAccessFromCentralDomains` middleware

### 5. Laravel Herd Configuration

Document in `README.md`:
- How to add `einaya.test` to Herd's parked sites
- How to enable wildcard `*.einaya.test` (Herd → Sites → Add wildcard)
- How to provision the central MySQL database manually for first run

### 6. "Hello Tenancy" Smoke Test

Three working endpoints:
- `GET einaya.test` → returns Inertia page "Welcome to Einaya"
- `GET app.einaya.test` → returns Inertia page "Super Admin Panel"
- `GET demo.einaya.test` → returns Inertia page "Tenant: demo" (after tenant exists)

Plus a Pest feature test:
- Create a tenant via tenancy API
- Make a request to its subdomain
- Assert tenancy is initialized (`tenancy()->initialized` is true)
- Assert `tenant('id')` returns the expected value

### 7. Environment Configuration

`.env.example` with all required vars documented:
```
APP_NAME=Einaya
APP_URL=https://einaya.test
TENANCY_DB_CONNECTION=tenant
DB_CONNECTION=mysql
DB_DATABASE=einaya_central
# ... etc
```

### 8. README.md

Setup steps for a new developer:
1. Prerequisites (PHP 8.3, MySQL 8, Herd, pnpm)
2. Clone and install
3. Configure Herd wildcard
4. Create central DB
5. Run migrations + seeders
6. Start dev: `composer dev` (concurrent php artisan serve + vite + queue + pail)

## Constraints

- **Do NOT** scaffold any business features yet (no patients, appointments, etc.)
- **Do NOT** install shadcn yet — that's Phase 6
- **Do NOT** install Spatie permissions yet — that's Phase 5
- Keep this phase focused purely on a working tenancy skeleton
- Every PHP file: `declare(strict_types=1);`
- Every new TypeScript file: explicit types, no `any`

## Definition of Done

- [ ] `pnpm install` + `composer install` work clean
- [ ] `php artisan migrate` runs successfully on central DB
- [ ] `pnpm dev` starts Vite without errors
- [ ] All three URL types resolve correctly:
  - [ ] `einaya.test` → Welcome page
  - [ ] `app.einaya.test` → Super Admin Panel page
  - [ ] `demo.einaya.test` → Tenant page (after creating tenant via tinker)
- [ ] Pest tenancy smoke test passes
- [ ] Creating a new tenant via tinker:
  - [ ] Auto-creates the tenant database (`einaya_tenant_{id}`)
  - [ ] Subdomain immediately works
- [ ] No errors in `storage/logs/laravel.log`
- [ ] No TypeScript errors (`pnpm tsc --noEmit`)
- [ ] No console errors in browser

## Files I Should See After This Phase

- `config/tenancy.php` — configured with central domains and tenant connection
- `app/Providers/TenancyServiceProvider.php` — published and customized
- `routes/central.php`, `routes/tenant.php`
- `app/Http/Middleware/` — tenancy middleware aliases registered
- `database/migrations/2024_*_create_tenants_table.php` (from stancl)
- `database/migrations/2024_*_create_domains_table.php` (from stancl)
- `tests/Feature/TenancyTest.php` — smoke test
- `README.md` — setup instructions
- `.env.example` — all vars

## Notes for Future Phases

- Phase 2 will add the rest of the central schema (users, clinics with branding, subscriptions stub)
- Phase 3 will add tenant migrations
- Do not pre-create any tables that those phases own
