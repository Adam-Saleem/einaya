# Einaya — Master Spec

> **Paste this entire file at the top of every Claude conversation related to Einaya code generation.**

---

## Product

- **Name:** Einaya (عناية — Arabic for "care")
- **Domain:** einaya.ps
- **Description:** Multi-tenant SaaS for medical clinics. Each clinic gets its own subdomain (e.g. `clinic1.einaya.ps`).
- **Region:** Palestine
- **Languages:** English + Arabic (full RTL support)

## Tech Stack

| Layer | Choice |
|---|---|
| Backend | Laravel 12, PHP 8.3+ |
| Database | MySQL 8 |
| Auth | Laravel Breeze (Inertia React stack) + manual 2FA via `pragmarx/google2fa-laravel` |
| Tenancy | `stancl/tenancy` v3 — **multi-database mode** |
| Permissions | `spatie/laravel-permission` |
| Frontend | Inertia.js + React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + shadcn/ui (CLI-installed components) |
| i18n | `react-i18next` + Tailwind RTL plugin |
| Calendar | FullCalendar (MIT package) |
| Queue | Database driver (v1) — designed to swap to Redis+Horizon later |
| Storage | Local disk (v1) — designed to swap to S3 later |
| Testing | Pest v3 |
| Package mgr | pnpm |
| Local dev | Laravel Herd (Mac/Win) |

## Architecture

### Tenancy Model — Multi-Database

Chosen for medical data isolation. Each clinic has its own MySQL database.

- **Central DB:** `einaya_central`
  Stores: clinics, domains, subscriptions, super admin users, global settings, platform-level audit logs.

- **Tenant DB:** `einaya_tenant_{clinic_id}`
  Stores: doctors, staff, patients, appointments, consultations, medical forms, submissions, payments, clinic settings, clinic-level audit logs.

### Subdomain Routing

| URL | Context | Purpose |
|---|---|---|
| `einaya.ps` | Central | Marketing site, signup |
| `app.einaya.ps` | Central | Super admin panel |
| `{clinic}.einaya.ps` | Tenant | Clinic panel (admin / doctor / secretary) |

Subdomain switching uses stancl/tenancy's `InitializeTenancyByDomain` middleware. **Code must always be tenancy-aware** — never assume central context inside tenant routes.

### Roles

**Tenant context (per clinic):**
1. **Clinic Admin** — the doctor who owns the clinic. Full access. Manages staff, hours, branding, forms.
2. **Doctor** — in v1 there is one doctor per clinic (= the clinic admin). Schema supports multiple doctors for v2.
3. **Secretary / Receptionist** — patient registration, appointments, billing, queue. Cannot access medical records or consultation notes.
4. **Nurse** *(v2)* — schema-ready, not built in v1.

**Central context:**
- **Super Admin** — Einaya platform owner.

## V1 Scope

### IN
- Multi-tenant subdomain provisioning
- Clinic signup creates tenant DB + first admin user
- Auth + 2FA + roles + permissions
- Patient registration with quick medical flags
- Appointments (calendar, statuses, queue)
- Doctor consultations with custom-built medical forms
- Form builder (sections, questions, options, validation)
- Form submissions with **JSON snapshots** (immutable history — see ADR-002)
- Prescriptions + diagnoses attached to consultations
- In-clinic patient billing: cash + card + insurance tracking
- Insurance providers per clinic (add-new-on-the-fly)
- File uploads (patient ID, insurance card, reports, prescriptions)
- In-app notifications (no SMS/email in v1)
- i18n: English + Arabic with full RTL
- Dark / light mode
- Audit logging for sensitive actions
- Pest tests for tenancy isolation, auth, key business logic

### OUT (designed for, but not built)
- SaaS subscription billing (Stripe/Cashier — stub the plans table only)
- SMS / Email notifications (interface only, no driver)
- S3 file storage (interface only, local disk implementation)
- Multiple doctors per clinic (schema ready, UI single-doctor)
- Patient portal (patient-facing app)
- Telemedicine
- Lab integrations
- Reporting/analytics beyond basic dashboards

## Patient Data — Key Design Principles

1. **Reception captures administrative data only** (identity, contact, insurance, quick medical flags). Doctors capture full medical data via the custom form builder.
2. **Medical forms are per doctor.** Each doctor builds their own forms (intake, follow-up, condition-specific).
3. **Form submissions are immutable.** On submit, the entire form structure is snapshotted as JSON into the submission record. Old visits always render with the form structure that existed at submission time. (See ADR-002.)
4. **Soft deletes everywhere on medical data** — never hard delete patient records, consultations, prescriptions, or files.
5. **Audit log every read/write of patient medical data** (consultations, prescriptions, files). Audit log critical admin actions (user creation, role changes, clinic suspension).

## Code Style & Architecture

- **Service classes** for business logic — `app/Services`
- **Form Requests** for validation — `app/Http/Requests`
- **API Resources** for response shaping (used by Inertia too)
- **Policies** for authorization — `app/Policies`
- **Repositories ONLY where they reduce real complexity** (don't over-engineer)
- **Action classes** for one-off operations — `app/Actions` (preferred over fat controllers)
- **Enums** for status fields (PHP 8.1 native enums)
- **Strict types:** `declare(strict_types=1)` at top of all PHP files
- **All models use `$fillable`** (never `$guarded = []`)
- **Soft deletes** where specified
- **Database indexes** on every foreign key + every column used in WHERE
- **Naming:** `snake_case` in DB, `camelCase` in JS/TS, `PascalCase` for components

## Frontend Conventions

- **Inertia pages:** `resources/js/Pages/{Module}/{Page}.tsx`
- **Layouts:** `resources/js/Layouts/{Layout}.tsx`
- **Components:**
  - `resources/js/Components/ui/` — shadcn primitives (auto-generated by CLI)
  - `resources/js/Components/domain/` — custom domain components
- **Hooks:** `resources/js/Hooks/{useThing}.ts`
- **Types:** `resources/js/types/{module}.ts`
- All Inertia page props are typed via a shared `PageProps<T>` generic
- Use shadcn components first; only build custom when shadcn lacks it
- **Forms:** `react-hook-form` + `zod` resolver; server returns Inertia validation errors which auto-populate
- **Tables:** shadcn DataTable pattern (TanStack Table v8)
- **Toasts:** `sonner` (shadcn's recommended toaster)
- **Icons:** `lucide-react`

## Design Tokens

Tokens are defined **once** in Phase 6 (UI Foundation), based on the Design Tokens Worksheet (filled by user from Stitch references). All subsequent UI phases use these tokens — **do not introduce new colors or font sizes ad hoc**.

## Localization (i18n + RTL)

- Default language per user (stored on `users.preferred_language`)
- Default language per patient for printouts (stored on `patients.preferred_language`)
- All UI strings go through `i18next` — **never hardcode**
- Translation files: `resources/js/locales/{en,ar}/{namespace}.json`
- RTL: `<html dir="rtl">` when locale=ar; Tailwind logical properties (`ms-`/`me-`/`ps-`/`pe-`) instead of `ml-`/`mr-`/`pl-`/`pr-`
- **Numbers:** keep Western digits (0-9) by default — Arabic Eastern digits are confusing for medical data
- **Dates:** `dayjs` with locale switching

## Definition of Done — Per Phase

A phase is "done" only when:

1. All migrations run cleanly on a fresh database
2. Seeders produce realistic, usable demo data
3. The relevant Pest tests pass
4. Manual smoke test in browser confirms the user-facing flow works
5. No PHP errors, no TypeScript errors, no console errors
6. Tenancy isolation verified (data from clinic A invisible to clinic B)

## Reference Documents

- **ADRs** in `ai/decisions/` — explain *why* each architectural choice was made
- **Conventions** in `ai/conventions/` — explain *how* to write code in this project
- **Design tokens** in `ai/design/tokens-final.md` — exact colors, fonts, spacing

When generating code, **respect all of the above**. If you must deviate, explicitly call it out and explain why.
