# Einaya

Multi-tenant SaaS for medical clinics. Each clinic is a tenant with its own MySQL database, served from a subdomain of `einaya.ps`.

## Stack

Laravel 12 · Inertia.js + React 18 + TypeScript · MySQL 8 · stancl/tenancy v3 (multi-database) · Tailwind · Pest v3 · pnpm.

## Prerequisites

- PHP 8.3+ (Herd ships PHP 8.4 — fine)
- Composer 2
- Node 20+ and pnpm 10+
- MySQL 8
- Laravel Herd (Mac/Win) for local subdomain routing

## Local setup

### 1. Clone and install

```bash
git clone <repo> einaya
cd einaya
composer install
pnpm install
cp .env.example .env
php artisan key:generate
```

### 2. Configure Herd for wildcard subdomains

The app uses three URL types locally:

| URL                     | Context           |
| ----------------------- | ----------------- |
| `einaya.test`           | Marketing root    |
| `app.einaya.test`       | Super admin panel |
| `{clinic}.einaya.test`  | Clinic (tenant)   |

To make all of these resolve to this app:

1. Open Herd → **Sites**
2. Add this folder as a parked site at `einaya.test`
3. Click the site row → **Isolate** if you want a specific PHP version
4. **Enable wildcard subdomains:** click the site → toggle **"Wildcard subdomains"** ON. This makes `*.einaya.test` and `app.einaya.test` resolve here too.

### 3. Create the central MySQL database

```bash
mysql -u root -e "CREATE DATABASE einaya_central CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Edit `.env` with your MySQL credentials (`DB_USERNAME`, `DB_PASSWORD`).

### 4. Migrate

```bash
php artisan migrate
```

This populates `einaya_central` with the tenants/domains tables (and Laravel defaults). Tenant DBs are created on demand when a tenant is registered.

### 5. Run the dev server

```bash
pnpm dev
```

Then open:

- <http://einaya.test> — marketing root
- <http://app.einaya.test> — super admin
- <http://demo.einaya.test> — only resolves once a `demo` tenant exists (see below)

### 6. Create a test tenant

```bash
php artisan tinker
```

```php
$tenant = Stancl\Tenancy\Database\Models\Tenant::create(['id' => 'demo']);
$tenant->domains()->create(['domain' => 'demo.einaya.test']);
```

This:
- Inserts a row into `einaya_central.tenants`
- Inserts a row into `einaya_central.domains`
- Creates the database `einaya_tenant_demo` (synchronously, via the `CreateDatabase` job)

Visit <http://demo.einaya.test> — you should see a "Tenant: demo" page.

## Tests

```bash
./vendor/bin/pest
```

The tenancy smoke test (`tests/Feature/TenancyTest.php`) creates real tenant DBs and tears them down. It needs a working MySQL connection.

## Project layout

| Path                          | Purpose                                 |
| ----------------------------- | --------------------------------------- |
| `app/Models/Central/`         | Central-context models (Phase 2+)       |
| `app/Models/Tenant/`          | Tenant-context models (Phase 3+)        |
| `app/Services/{C,T}/`         | Service classes by context              |
| `app/Actions/{C,T}/`          | Single-purpose action classes           |
| `routes/web.php`              | Marketing root (central root domains)   |
| `routes/central.php`          | Super admin panel (`app.einaya.*`)      |
| `routes/tenant.php`           | Tenant subdomains                       |
| `database/migrations/`        | Central migrations                      |
| `database/migrations/tenant/` | Tenant migrations (run per-tenant)      |
| `resources/js/Pages/Central/` | Inertia super admin pages               |
| `resources/js/Pages/Tenant/`  | Inertia tenant clinic pages             |
| `ai/`                         | Build spec, ADRs, phase prompts         |

## Architecture references

- `ai/00-master-spec.md` — full product + tech spec
- `ai/decisions/` — architecture decision records (ADRs)
- `ai/conventions/` — code conventions
- `ai/PROGRESS.md` — current build status
