# Phase 2 — Central Database Schema

> **Prerequisite:** Paste `00-master-spec.md` above this prompt. Phase 1 must be complete.

## Goal

Build the complete central database schema. The central DB stores platform-level data: clinics, super admins, subscription plans, global settings, central audit logs.

## Tables to Build

All migrations go in `database/migrations/` and run on the **central** connection.

### `users` (super admins only — clinic users live in tenant DBs)

```
id
name (string)
email (string, unique)
email_verified_at (timestamp, nullable)
password (string)
two_factor_secret (text, nullable)
two_factor_recovery_codes (text, nullable)
two_factor_confirmed_at (timestamp, nullable)
is_super_admin (boolean, default true)  -- this table only contains super admins
preferred_language (enum: 'en','ar', default 'en')
remember_token, timestamps, softDeletes
```
Indexes: `email`

### `clinics` (the tenant model — extends stancl/tenancy's Tenant contract)

```
id (string, UUID — required by stancl)
name (string)
slug (string, unique)               -- used for subdomain, e.g. "demo" → demo.einaya.ps
owner_name (string)                 -- the doctor's name
owner_email (string)                -- used to create the clinic admin user in tenant DB
owner_phone (string, nullable)
status (enum: 'pending','active','suspended','cancelled', default 'pending')
branding (json, nullable)           -- {logo_path, primary_color, ...} overrides per clinic
data (json, nullable)               -- stancl/tenancy custom column
trial_ends_at (timestamp, nullable)
subscription_id (foreignId, nullable)
timestamps, softDeletes
```
Indexes: `slug`, `status`

### `domains` (stancl/tenancy default table — already created in Phase 1)

No changes; just confirm it exists.

### `subscription_plans`

```
id
name (string)
slug (string, unique)
price_monthly (decimal 10,2)
price_yearly (decimal 10,2)
max_patients (int, nullable)        -- null = unlimited
max_staff (int, nullable)
features (json)                     -- ["form_builder","sms","reports", ...]
is_active (boolean, default true)
order (int, default 0)
timestamps, softDeletes
```

### `subscriptions` (stub — full billing wired in v2)

```
id
clinic_id (foreignId → clinics)
plan_id (foreignId → subscription_plans)
status (enum: 'trial','active','past_due','cancelled')
starts_at (timestamp)
ends_at (timestamp, nullable)
trial_ends_at (timestamp, nullable)
timestamps, softDeletes
```
Indexes: `clinic_id`, `plan_id`, `status`

### `global_settings`

```
id
key (string, unique)
value (json)
timestamps
```

### `central_audit_logs`

```
id
user_id (foreignId, nullable)
action (string)                     -- e.g. "clinic.suspended", "plan.created"
auditable_type (string, nullable)
auditable_id (unsignedBigInteger, nullable)
old_values (json, nullable)
new_values (json, nullable)
ip_address (string, nullable)
user_agent (string, nullable)
created_at (timestamp)              -- no updated_at (logs are immutable)
```
Indexes: `user_id`, `[auditable_type, auditable_id]`, `created_at`

### `support_tickets`

```
id
clinic_id (foreignId → clinics)
opened_by_email (string)
subject (string)
body (text)
status (enum: 'open','pending','closed', default 'open')
timestamps, softDeletes
```
Indexes: `clinic_id`, `status`

## Deliverables

### 1. Migrations

All 8 migration files in correct order. Use foreign key constraints.

### 2. Eloquent Models

In `app/Models/Central/`:
- `User.php` (extends `Authenticatable`)
- `Clinic.php` (extends `Stancl\Tenancy\Database\Models\Tenant`, implements `TenantWithDatabase`)
- `SubscriptionPlan.php`
- `Subscription.php`
- `GlobalSetting.php`
- `CentralAuditLog.php`
- `SupportTicket.php`

Each model:
- `declare(strict_types=1);`
- `$fillable` (never `$guarded = []`)
- Casts (`json` for json columns, enum casts for status fields, `datetime` for timestamps)
- Relationships
- Soft deletes where specified
- No business logic — keep models thin

### 3. Enums

In `app/Enums/Central/`:
- `ClinicStatus` (Pending, Active, Suspended, Cancelled)
- `SubscriptionStatus` (Trial, Active, PastDue, Cancelled)
- `TicketStatus` (Open, Pending, Closed)

Use PHP 8.1 native backed enums (string-backed).

### 4. Factories

In `database/factories/Central/`:
- `UserFactory` (super admin)
- `ClinicFactory` (with realistic Arabic + English clinic names)
- `SubscriptionPlanFactory`
- `SubscriptionFactory`

### 5. Seeders

In `database/seeders/Central/`:

**SuperAdminSeeder**
- Creates 1 super admin: `admin@einaya.ps` / password `Einaya@2025`
- Email verified, language `en`

**SubscriptionPlansSeeder**
Creates 3 plans:
- Starter: $19/mo, $190/yr, max 500 patients, 2 staff, basic features
- Pro: $49/mo, $490/yr, max 5000 patients, 5 staff, all features
- Enterprise: $129/mo, $1290/yr, unlimited, premium support

**DemoClinicSeeder**
- Creates 1 demo clinic: slug `demo`, name "Demo Clinic"
- Status `active`, on Pro plan
- Auto-creates the tenant DB
- **Guard:** if `database/migrations/tenant/` is empty, skip running tenant migrations gracefully (Phase 3 will add them)

Wire all three into `DatabaseSeeder` (central seeders only — no tenant seeders yet).

### 6. Audit Log Foundation

Create `app/Services/Central/AuditLogService.php`:
- Method: `log(User $user, string $action, Model $auditable = null, array $oldValues = [], array $newValues = [])`
- Captures IP and user agent from current request
- Used by future code to record platform-level actions

### 7. Tests

In `tests/Feature/Central/`:
- `ClinicCreationTest.php` — creating a clinic via the seeder produces a valid tenant with working subdomain
- `SubscriptionPlanTest.php` — plans seed correctly with expected values
- `AuditLogTest.php` — logging captures all expected fields

## Constraints

- Use `$fillable` not `$guarded`
- Every FK has an index
- Every model uses strict types
- Currency stored as `decimal(10,2)`, never `float`
- No business logic in models — push to services/actions
- All enums use `:string` backing
- All `json` columns have `array` casts on the model

## Definition of Done

- [ ] Fresh `php artisan migrate:fresh --seed` produces:
  - [ ] 1 super admin user
  - [ ] 3 subscription plans
  - [ ] 1 demo clinic
- [ ] `demo.einaya.test` resolves (even if tenant DB is empty)
- [ ] All factories work in Pest tests
- [ ] All Phase 2 tests pass
- [ ] No PHP errors, no migration errors
- [ ] `php artisan tinker` → `Clinic::all()` returns the demo clinic
- [ ] `php artisan tinker` → `User::first()->is_super_admin` returns `true`

## Notes for Future Phases

- Phase 3 will add tenant migrations and a `TenantDemoSeeder` that runs on tenant creation
- Phase 4 will adapt Breeze for super admin (central) and clinic users (tenant) login
- Don't add login/auth routes or pages yet — Phase 4 owns those
