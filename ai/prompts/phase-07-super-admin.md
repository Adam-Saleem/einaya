# Phase 7 — Super Admin Module

> **Prerequisite:** Paste `00-master-spec.md` above this prompt. Phases 1-6 must be complete.

## Goal

Build the super admin panel at `app.einaya.ps`. Super admins manage clinics, view platform stats, handle support tickets, and configure global settings.

## Pages to Build

All under `resources/js/Pages/Central/`. All use `CentralLayout`.

### 1. Dashboard (`/`)
File: `Pages/Central/Dashboard.tsx`

Stat cards (real data):
- Total clinics (active count + total)
- Active subscriptions
- Total patients across all tenants (sum across tenant DBs — use a periodic cache, not real-time aggregation)
- Total revenue this month (will be 0 until billing is implemented — placeholder)

Charts (using recharts):
- New clinics per month (last 12 months) — line chart
- Plan distribution (pie chart)

Recent activity:
- Last 10 entries from `central_audit_logs`

### 2. Clinics List (`/clinics`)
File: `Pages/Central/Clinics/Index.tsx`

DataTable with columns:
- Patient code → Logo (small) | Name | Slug
- Owner email
- Plan
- Status (badge)
- Created at
- Actions (View, Suspend/Activate, Delete)

Filters:
- Status (all / pending / active / suspended / cancelled)
- Plan (all / starter / pro / enterprise)
- Search by name, slug, owner email

Top-right action button: "Create Clinic"

### 3. Clinic Detail (`/clinics/{id}`)
File: `Pages/Central/Clinics/Show.tsx`

Tabs:
- **Overview**: clinic info, owner contact, subdomain link, status, current plan
- **Subscription**: plan, started/ends, trial info, change plan button
- **Usage**: patient count, staff count, storage used, last activity
- **Audit**: filtered audit log entries for this clinic
- **Danger Zone**: suspend, reactivate, cancel, delete

### 4. Create/Edit Clinic
Modal forms.

Create form fields:
- Name (required)
- Slug (required, unique, lowercase-validated, lives at `{slug}.einaya.ps`)
- Owner name, email, phone
- Plan (select)
- Trial days (default 14)

On submit:
- Create clinic record
- Provision tenant DB (auto via stancl)
- Run tenant migrations + seeders
- Create the clinic admin user in tenant DB with a generated temporary password
- Send invitation (in v1: just display the credentials in a success toast — no email yet)
- Log to central audit

### 5. Subscription Plans (`/plans`)
File: `Pages/Central/Plans/Index.tsx`

Lists all plans, with edit/create capability. Plans are referenced by subscription records, so editing should preserve historical data (don't allow deletion if any active subscription uses the plan; soft-delete and create new instead).

### 6. Subscriptions (`/subscriptions`)
File: `Pages/Central/Subscriptions/Index.tsx`

Read-only list (full management is v2 with billing):
- Clinic
- Plan
- Status
- Started / ends
- Trial end

Manual override action: "Mark as paid until..." (sets `ends_at` manually). Admins use this to grant time before billing is implemented.

### 7. Support Tickets (`/tickets`)
File: `Pages/Central/Tickets/Index.tsx`

DataTable. Columns: subject, clinic, opened by, status, opened at.

Detail view: full body, response section, change status (open → pending → closed).

For v1, responses are NOT emailed — just stored as text on the ticket. (Email integration v2.)

### 8. Audit Logs (`/audit`)
File: `Pages/Central/Audit/Index.tsx`

Read-only DataTable with filters:
- Date range
- User
- Action
- Auditable type

Detail dialog showing old/new values diff.

### 9. Global Settings (`/settings`)
File: `Pages/Central/Settings/Index.tsx`

Tabs:
- **General**: platform name, support email, default language
- **Legal**: terms URL, privacy URL
- **Branding**: platform logo (used on signup pages, emails when added)
- **Email** *(stub for v2)*

Settings stored in `global_settings` table (key/value/json).

## Backend

### Routes
In `routes/central.php` (all behind auth + super admin middleware):

```
GET    /                       → Dashboard
GET    /clinics                → Clinics index
POST   /clinics                → Create
GET    /clinics/{id}           → Show
PATCH  /clinics/{id}           → Update
POST   /clinics/{id}/suspend   → Suspend
POST   /clinics/{id}/activate  → Activate
DELETE /clinics/{id}           → Delete (soft)
GET    /plans                  → Plans index
POST   /plans                  → Create
PATCH  /plans/{id}             → Update
DELETE /plans/{id}             → Soft delete
GET    /subscriptions          → Subscriptions index
PATCH  /subscriptions/{id}     → Override (extend ends_at)
GET    /tickets                → Tickets index
GET    /tickets/{id}           → Show
PATCH  /tickets/{id}           → Update status / add response
GET    /audit                  → Audit logs index
GET    /settings               → Settings index
PATCH  /settings               → Update
```

### Controllers

`app/Http/Controllers/Central/`:
- `DashboardController`
- `ClinicController`
- `PlanController`
- `SubscriptionController`
- `TicketController`
- `AuditController`
- `SettingController`

### Actions

For complex operations, use action classes:
- `app/Actions/Central/CreateClinicAction.php` — orchestrates: create central record + provision tenant DB + create admin user + assign roles + log audit
- `app/Actions/Central/SuspendClinicAction.php` — sets status, logs audit, doesn't delete data
- `app/Actions/Central/ChangeClinicPlanAction.php`

### Form Requests

- `Central/StoreClinicRequest`
- `Central/UpdateClinicRequest`
- `Central/StorePlanRequest`
- `Central/UpdatePlanRequest`
- `Central/UpdateTicketRequest`

### Resources (API/Inertia)

- `Central/ClinicResource`
- `Central/PlanResource`
- `Central/SubscriptionResource`
- `Central/TicketResource`
- `Central/AuditLogResource`

## Stat Aggregation

Cross-tenant patient count requires querying every tenant DB. Don't do this on every dashboard load.

Implement:
- Job `App\Jobs\Central\AggregatePlatformStats` — runs hourly via scheduler
- Stores results in `global_settings` (key: `platform_stats`, value: JSON)
- Dashboard reads from cached value

For v1, the schedule entry is registered but the dashboard also has a "Refresh now" button for super admins.

## Tests

In `tests/Feature/Central/`:
- `CreateClinicTest.php` — full flow: create clinic via UI → tenant DB exists → can log in to subdomain
- `SuspendClinicTest.php` — suspended clinic users cannot log in
- `PlanCannotBeDeletedTest.php` — if active subscription exists
- `AuditLogCreatedOnClinicSuspensionTest.php`
- `OnlySuperAdminCanAccessTest.php` — non-super-admin gets 403

## Constraints

- All actions logged via central audit service
- Suspending a clinic does NOT delete tenant data — just blocks access
- Slug validation: `[a-z0-9-]+`, 3-30 chars, must not match reserved words (`app`, `admin`, `api`, `www`, `mail`)
- Slug cannot be changed after creation (would break subdomain history)
- Use `<Can />` minimally here — super admin has full access. Only authentication check needed.

## Definition of Done

- [ ] Super admin logs in, lands on dashboard with real stats
- [ ] Can create a new clinic from UI
- [ ] New clinic's subdomain immediately works
- [ ] New clinic admin can log in with shown temp credentials
- [ ] Suspending a clinic blocks tenant logins
- [ ] All filters and search work in clinic list
- [ ] Audit log shows entries for create/suspend/activate/update
- [ ] All Phase 7 tests pass
- [ ] No errors, no console warnings

## Notes

- Branding (logo, primary color overrides per clinic) is stored on the clinic record but the clinic admin sets it via tenant UI in Phase 8 — super admin only sees it as JSON
- Email/SMS sending stubs are not built here — v2
