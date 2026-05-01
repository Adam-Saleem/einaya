# Phase 3 — Tenant Database Schema

> **Prerequisite:** Paste `00-master-spec.md` above this prompt. Phases 1-2 must be complete.

## Goal

Build the complete tenant database schema. This is the biggest phase — every clinic's medical, scheduling, billing, and form data lives here.

All migrations go in `database/migrations/tenant/` and run automatically when a new clinic is provisioned.

## Tables to Build

### Users & Staff

#### `users` (clinic-side users: doctors + secretaries)

```
id
name (string)
email (string, unique-within-tenant)
email_verified_at (timestamp, nullable)
password (string)
phone (string, nullable)
avatar_path (string, nullable)
two_factor_secret, two_factor_recovery_codes, two_factor_confirmed_at
preferred_language (enum: 'en','ar', default 'ar')
is_active (boolean, default true)
last_login_at (timestamp, nullable)
last_login_ip (string, nullable)
remember_token, timestamps, softDeletes
```

#### `doctors`

```
id
user_id (foreignId → users)         -- in v1, one-to-one with user (no unique constraint, schema ready for v2)
specialty (string)
license_number (string, nullable)
bio_en (text, nullable)
bio_ar (text, nullable)
consultation_duration_minutes (int, default 30)
is_active (boolean, default true)
timestamps, softDeletes
```
Indexes: `user_id`

#### `doctor_working_hours`

```
id
doctor_id (foreignId → doctors)
day_of_week (tinyint, 0-6 where 0=Sunday)
start_time (time)
end_time (time)
is_active (boolean, default true)
timestamps
```
Indexes: `[doctor_id, day_of_week]`

#### `doctor_breaks` (recurring breaks: lunch, prayer)

```
id
doctor_id (foreignId)
day_of_week (tinyint)
start_time (time)
end_time (time)
label (string)                       -- e.g. "Lunch", "Dhuhr Prayer"
timestamps
```

#### `doctor_time_off` (one-off vacations, leave)

```
id
doctor_id (foreignId)
starts_at (datetime)
ends_at (datetime)
reason (string, nullable)
timestamps
```

### Insurance

#### `insurance_providers`

```
id
name (string)
is_active (boolean, default true)
timestamps, softDeletes
```
Unique: `name`

### Patients

#### `patients`

```
id
patient_code (string, unique)        -- auto-generated, e.g. P-00042
first_name (string)
last_name (string)
national_id (string, nullable, indexed but NOT unique)
date_of_birth (date, nullable)
gender (enum: 'male','female','other', nullable)
marital_status (enum: 'single','married','divorced','widowed', nullable)
occupation (string, nullable)
preferred_language (enum: 'en','ar', default 'ar')

phone (string, indexed)
phone_alt (string, nullable)
email (string, nullable)
address (string, nullable)
city (string, nullable)

emergency_name (string, nullable)
emergency_phone (string, nullable)
emergency_relation (string, nullable)

blood_type (string 5, nullable)
allergies_summary (text, nullable)
chronic_summary (text, nullable)
medications_summary (text, nullable)

has_insurance (boolean, default false)
insurance_provider_id (foreignId → insurance_providers, nullable)
insurance_policy_number (string, nullable)

profile_photo_path (string, nullable)
notes (text, nullable)
referred_by (string, nullable)

registered_by (foreignId → users, nullable)
timestamps, softDeletes
```
Indexes: `phone`, `national_id`, `[first_name, last_name]`, `registered_by`

#### `patient_files`

```
id
patient_id (foreignId)
uploaded_by (foreignId → users)
category (enum: 'id_card','insurance_card','external_report','prescription_scan','other')
file_path (string)
original_name (string)
mime_type (string)
size_bytes (unsignedBigInteger)
notes (text, nullable)
timestamps, softDeletes
```
Indexes: `patient_id`, `category`

### Appointments

#### `appointments`

```
id
patient_id (foreignId)
doctor_id (foreignId)
scheduled_for (datetime)
duration_minutes (int, default 30)
status (enum: 'pending','confirmed','arrived','in_progress','completed','cancelled','no_show')
reason (string, nullable)            -- patient's stated reason at booking
notes (text, nullable)               -- secretary's notes
cancelled_at (datetime, nullable)
cancellation_reason (string, nullable)
arrived_at (datetime, nullable)
queue_number (int, nullable)
created_by (foreignId → users)
timestamps, softDeletes
```
Indexes: `[doctor_id, scheduled_for]`, `[patient_id, scheduled_for]`, `status`

### Consultations

#### `consultations`

```
id
appointment_id (foreignId, unique, nullable)   -- one consultation per appointment
patient_id (foreignId)
doctor_id (foreignId)
started_at (datetime)
ended_at (datetime, nullable)
chief_complaint (text, nullable)
notes (text, nullable)               -- doctor's free-text notes outside the form
follow_up_in_days (int, nullable)
timestamps, softDeletes
```
Indexes: `patient_id`, `doctor_id`, `appointment_id`

### Medical Forms (Form Builder)

> **Critical design:** see ADR-002 (form snapshots).

#### `medical_forms`

```
id
doctor_id (foreignId)
title (string)
description (text, nullable)
type (enum: 'intake','follow_up','custom', default 'custom')
is_active (boolean, default true)
timestamps, softDeletes
```
Indexes: `doctor_id`

#### `form_sections`

```
id
medical_form_id (foreignId)
title (string)
description (text, nullable)
order (int)
timestamps, softDeletes
```
Indexes: `medical_form_id`

#### `form_questions`

```
id
form_section_id (foreignId)
key (string)                         -- stable identifier, e.g. "smokes_cigarettes"
label (string)
help_text (text, nullable)
type (enum: 'text','textarea','number','radio','checkbox','select','date','file','signature')
is_required (boolean, default false)
validation_rules (json, nullable)    -- {min, max, regex, ...}
conditions (json, nullable)          -- v2 conditional logic
order (int)
timestamps, softDeletes
```
Indexes: `form_section_id`

#### `form_question_options`

```
id
form_question_id (foreignId)
value (string)
label (string)
order (int)
timestamps, softDeletes
```
Indexes: `form_question_id`

### Form Submissions (Immutable History)

#### `form_submissions`

```
id
medical_form_id (foreignId)          -- reference for grouping; may point to current/edited form
consultation_id (foreignId, nullable)
patient_id (foreignId)
doctor_id (foreignId)
form_snapshot (json)                 -- FULL form structure at submission time
answers_snapshot (json)              -- { questionKey: answer }
submitted_at (datetime)
timestamps, softDeletes
```
Indexes: `patient_id`, `consultation_id`, `medical_form_id`, `doctor_id`

### Prescriptions

#### `prescriptions`

```
id
consultation_id (foreignId)
patient_id (foreignId)
doctor_id (foreignId)
notes (text, nullable)
printed_at (datetime, nullable)
timestamps, softDeletes
```
Indexes: `consultation_id`, `patient_id`

#### `prescription_items`

```
id
prescription_id (foreignId)
medication_name (string)
dosage (string)                      -- e.g. "500 mg"
frequency (string)                   -- e.g. "twice daily"
duration (string)                    -- e.g. "7 days"
instructions (text, nullable)
order (int)
timestamps
```
Indexes: `prescription_id`

### Diagnoses

#### `diagnoses`

```
id
consultation_id (foreignId)
patient_id (foreignId)
code (string, nullable)              -- for future ICD-10
description (string)
notes (text, nullable)
timestamps, softDeletes
```
Indexes: `consultation_id`, `patient_id`

### Payments (in-clinic billing)

#### `payments`

```
id
patient_id (foreignId)
appointment_id (foreignId, nullable)
consultation_id (foreignId, nullable)
amount (decimal 10,2)
currency (string 3, default 'USD')
method (enum: 'cash','card','insurance','mixed')
insurance_amount (decimal 10,2, default 0)
cash_amount (decimal 10,2, default 0)
card_amount (decimal 10,2, default 0)
status (enum: 'pending','paid','partial','refunded', default 'paid')
receipt_number (string, unique)
notes (text, nullable)
collected_by (foreignId → users)
paid_at (datetime, nullable)
timestamps, softDeletes
```
Indexes: `patient_id`, `appointment_id`, `receipt_number`, `paid_at`

### Settings & Audit

#### `clinic_settings`

```
id
key (string, unique)
value (json)
timestamps
```

#### `tenant_audit_logs`

```
id
user_id (foreignId, nullable)
action (string)
auditable_type (string, nullable)
auditable_id (unsignedBigInteger, nullable)
old_values (json, nullable)
new_values (json, nullable)
ip_address (string, nullable)
user_agent (string, nullable)
created_at (timestamp)               -- no updated_at
```
Indexes: `user_id`, `[auditable_type, auditable_id]`, `created_at`

## Deliverables

### 1. Migrations

All migrations in `database/migrations/tenant/`, in dependency order.

### 2. Models

In `app/Models/Tenant/` — every model gets:
- `declare(strict_types=1);`
- `$fillable`
- Proper casts (json, enum, datetime, decimal:2)
- Relationships (with type hints)
- Soft deletes where applicable
- No business logic

### 3. Enums

In `app/Enums/Tenant/` — backed string enums for every status/type field.

### 4. Factories

A factory per model. Factories use Faker with realistic Arabic + English names where appropriate.

### 5. TenantDemoSeeder

In `database/seeders/Tenant/`, runs inside a tenant context. Creates:

- 1 doctor user (clinic admin) — email derived from clinic owner_email
- 1 secretary user — `secretary@{slug}.einaya.ps`
- 1 doctor profile with specialty "General Medicine", working hours Sun-Thu 09:00-17:00, lunch break 13:00-14:00
- 5 insurance providers (realistic local names)
- 20 patients with realistic data:
  - Mix of EN + AR names
  - ~60% with insurance
  - Ages 1-85, varied gender/marital
  - Some with allergies, chronic conditions
- 30 appointments spread across the past 60 days and next 30 days
  - Mix of all statuses (more `completed` for past, more `confirmed`/`pending` for future)
- 1 medical form titled "General Intake Form" with:
  - 3 sections: "Personal History", "Current Symptoms", "Lifestyle"
  - ~10 questions of mixed types (text, textarea, radio, checkbox, select, date)
  - Realistic options for radio/checkbox/select
- 5 form submissions linked to past completed appointments
  - Each with proper `form_snapshot` and `answers_snapshot`
- Prescriptions on past completed appointments (~3)
- Diagnoses on past completed appointments (~3)
- Payments on past completed appointments (mix of cash, card, insurance, mixed)

### 6. Auto-Provisioning Hook

Wire into stancl/tenancy lifecycle so when a tenant is created:
1. Tenant DB is created
2. Tenant migrations run automatically
3. **In non-production env only:** `TenantDemoSeeder` runs automatically

Use stancl's `JobPipeline` or event listeners. Document the hook in code comments.

### 7. Audit Log Foundation (Tenant)

`app/Services/Tenant/AuditLogService.php` — same pattern as central, but writes to tenant_audit_logs in current tenant context.

### 8. Patient Code Generation

`app/Services/Tenant/PatientCodeGenerator.php`:
- Generates next code in format `P-00001`, `P-00002`, ...
- Per-tenant (no global counter)
- Used by `Patient` model's creating event

## Tests

In `tests/Feature/Tenant/`:

### CRITICAL: Tenancy isolation test
`TenancyIsolationTest.php`:
- Create 2 tenants (A and B)
- Run seeder in both
- Switch to tenant A context, count patients → e.g. 20
- Switch to tenant B context, count patients → 20 (separate)
- Switch to A, create a patient → assert it does NOT appear in B
- Switch to B, create a patient → assert it does NOT appear in A
- This is the single most important test in the entire codebase.

### Patient creation
- `PatientCodeGenerationTest.php` — codes are sequential per tenant
- `PatientFactoryTest.php` — factories produce valid data

### Form snapshots
- `FormSubmissionSnapshotTest.php`:
  - Build form v1, submit, verify snapshot is captured
  - Edit the form (add/remove question), submit again, verify second submission has the new snapshot, first submission still has the old one

### Appointments
- `AppointmentStatusTest.php` — status transitions

## Constraints

- Strict types everywhere
- Every FK indexed
- Soft deletes on every table that touches medical/patient data
- No business logic in models
- Use enums (PHP 8.1) cast on status fields, not raw strings
- All `json` columns have `array` casts
- All `decimal` columns have `decimal:2` casts
- Foreign keys use `cascadeOnDelete()` ONLY for child records that should never exist orphaned (e.g. `prescription_items` on `prescription` deletion). Otherwise, use `restrictOnDelete()` to force explicit handling.

## Definition of Done

- [ ] All tenant migrations run cleanly via `php artisan tenants:migrate`
- [ ] Creating a tenant via tinker auto-runs migrations + seeder
- [ ] Demo tenant has fully populated data (20 patients, 30 appointments, etc.)
- [ ] **Tenancy isolation test passes** — this is non-negotiable
- [ ] Form snapshot test passes
- [ ] Patient code generator produces sequential codes per tenant
- [ ] No PHP errors in `storage/logs/laravel.log`
- [ ] All factories produce valid data verified by tests

## Notes for Future Phases

- Phase 4 builds auth (Breeze + 2FA) — will use the `users` table from this phase
- Phase 5 wires Spatie permissions to assign roles to tenant users
- Phase 8 builds the form builder UI on top of these tables
- Phase 10 builds the consultation flow that creates `form_submissions` with snapshots
