# Phase 8 — Clinic Admin Module (incl. Form Builder)

> **Prerequisite:** Paste `00-master-spec.md` above this prompt. Phases 1-7 must be complete.

## Goal

Build the clinic admin panel — what the doctor (who is also the clinic admin in v1) sees when they log in to their clinic's subdomain. Includes the **dynamic form builder**, which is the most complex feature of the entire app.

## Pages to Build

All under `resources/js/Pages/Tenant/`. All use `AppLayout`.

### 1. Clinic Dashboard (`/`)
File: `Pages/Tenant/Dashboard.tsx`

Stat cards:
- Today's appointments (count + completed/arrived/pending breakdown)
- Patients this month (new + returning)
- Revenue this month (sum of `payments.amount` where `paid_at` in current month)
- Pending follow-ups (consultations with `follow_up_in_days` set, due within 7 days)

Sections:
- Today's schedule (next 5 appointments)
- Recent patients (last 5)
- Quick actions (Add Patient, Book Appointment, Start Consultation)

### 2. Staff Management (`/staff`)
File: `Pages/Tenant/Staff/Index.tsx`

DataTable: name, email, role, last login, status, actions.

Add/Edit modal:
- Name, email, phone
- Role (select: secretary in v1; doctor option present but disabled with tooltip "Multi-doctor support coming soon")
- Initial password (auto-generated, copy button)
- Active toggle

On create:
- Create user in tenant DB
- Assign role via Spatie
- Send welcome email *(stub — just show creds in toast for v1)*
- Log to tenant audit

Reset password action — generates new temp password, forces change on next login.

### 3. Doctor Profile (`/doctor/profile`)
File: `Pages/Tenant/Doctor/Profile.tsx`

Sections:
- Avatar upload
- Name, specialty, license number
- Bio (EN + AR — both fields visible, both saved)
- Contact info
- Default consultation duration

### 4. Working Hours (`/doctor/hours`)
File: `Pages/Tenant/Doctor/WorkingHours.tsx`

Per day of week (Sun-Sat):
- Toggle: working that day?
- If yes: start time, end time
- Sub-list: breaks (lunch, prayer) — add/remove
- Time-off section: list upcoming time-off entries, add new

Visual representation: a week-view mini-calendar showing working hours and breaks shaded.

### 5. Clinic Settings (`/settings`)
File: `Pages/Tenant/Settings/Index.tsx`

Tabs:
- **General**: clinic name, address, phone, email
- **Branding**: logo upload, primary color picker (overrides default brand color for this clinic only — applied via CSS variable)
- **Localization**: default language for new patients
- **Receipt**: receipt header text, footer text, logo on receipts toggle
- **Notifications** *(in-app only for v1)*: appointment reminders on/off

### 6. Insurance Providers (`/insurance-providers`)
File: `Pages/Tenant/InsuranceProviders/Index.tsx`

Simple CRUD list:
- Name
- Active toggle
- Patient count using this provider (read-only)
- Add / edit / soft-delete

### 7. Reports (`/reports`)
File: `Pages/Tenant/Reports/Index.tsx`

Tabs:
- **Appointments**: date range, group by status, export CSV
- **Revenue**: date range, breakdown by payment method, export CSV
- **Patients**: new vs returning, gender breakdown, age groups
- **Diagnoses**: most common (counts diagnoses across consultations in date range)

For v1: simple tables + 1-2 charts per report. No PDF export yet (v2).

### 8. Audit Logs (`/audit`)
File: `Pages/Tenant/Audit/Index.tsx`

Same pattern as central audit, but tenant-scoped. Filters by user, action, date range.

---

## Form Builder — The Big One

### 9. Forms List (`/forms`)
File: `Pages/Tenant/Forms/Index.tsx`

DataTable:
- Title, type, sections count, questions count, submissions count
- Created at
- Actions (Edit, Duplicate, Activate/Deactivate, Delete)

Top-right: "Create Form" button.

### 10. Form Builder (`/forms/{id}/edit`)
File: `Pages/Tenant/Forms/Builder.tsx`

This is **the most complex UI in the app**. Take time on this.

#### Layout
```
┌─────────────────────────────────────────────────────┐
│  Form Title [editable]    Type [select]    [Save]   │
│  Description [editable textarea]                     │
├─────────────────────┬───────────────────────────────┤
│                     │                                │
│  SECTIONS PANEL     │   QUESTIONS PANEL              │
│  (left, 30%)        │   (right, 70%)                 │
│                     │                                │
│  □ Personal History │   Section: Personal History    │
│  ✓ Current Symptoms │   ──────────────────────       │
│  □ Lifestyle        │   1. Do you smoke?  [edit]     │
│  □ Family History   │      Type: Radio               │
│                     │      Options: Yes, No          │
│  [+ Add Section]    │                                │
│                     │   2. Allergies     [edit]      │
│                     │      Type: Textarea            │
│                     │                                │
│                     │   [+ Add Question]             │
│                     │                                │
│                     ├───────────────────────────────┤
│                     │  [Preview Form] [Save Draft]  │
└─────────────────────┴───────────────────────────────┘
```

#### Functionality

**Sections panel:**
- List of sections with drag-to-reorder (use `@dnd-kit/sortable`)
- Click section → highlight + show its questions in right panel
- Add section → opens inline form (title, description)
- Edit section → inline editing
- Delete section → confirm dialog (warns about questions and historical submissions)

**Questions panel:**
- For currently selected section
- Drag-to-reorder questions
- Add question → opens dialog:
  - Label (required)
  - Stable key (auto-generated from label, editable)
  - Help text (optional)
  - Type (select): text, textarea, number, radio, checkbox, select, date, file, signature
  - Required toggle
  - Validation rules (varies by type — see below)
  - For radio/checkbox/select: options list (label + value pairs, drag-to-reorder)
- Edit question → same dialog with prefilled
- Delete question → confirm dialog

**Validation rules per type:**
- text/textarea: min length, max length, regex
- number: min, max
- date: min date, max date
- file: max size (MB), allowed types
- (rules stored as JSON in `validation_rules` column)

**Stable key generation:**
- Auto from label: lowercase, replace non-alphanumeric with `_`, collapse multiples, trim
- Example: "Do you smoke?" → `do_you_smoke`
- Editable; must be unique within form
- Used in submissions to enable cross-version analytics

**Preview Form** button:
- Opens a dialog rendering the entire form as it would appear during a consultation (read-only)
- Allows the doctor to verify what patient experience looks like
- Validates all fields render correctly

**Save behavior:**
- Auto-save on every change (debounced 1 second) — no "Save" button needed for individual changes
- "Publish" toggle: an unpublished form is a draft visible only to its creator. Once published, it's available to use during consultations.

### 11. Create Form
- Create button on `/forms` → modal: title, type
- On submit → redirect to builder with empty form

### 12. Form Submissions Viewer (`/forms/{id}/submissions`)
File: `Pages/Tenant/Forms/Submissions.tsx`

Read-only list of all submissions of this form across all patients.
DataTable: patient, submitted at, doctor, view button.

Detail view: renders the submission using the `form_snapshot` (NOT the live form).

---

## Backend

### Routes (in `routes/tenant.php`, behind auth middleware)

```
# Dashboard
GET    /                                  → Dashboard

# Staff
GET    /staff                             → Staff index
POST   /staff                             → Create staff
PATCH  /staff/{id}                        → Update
POST   /staff/{id}/reset-password         → Reset password
DELETE /staff/{id}                        → Soft delete

# Doctor
GET    /doctor/profile                    → Profile
PATCH  /doctor/profile                    → Update
GET    /doctor/hours                      → Working hours page
POST   /doctor/hours                      → Save weekly hours
POST   /doctor/breaks                     → Add break
DELETE /doctor/breaks/{id}                → Remove break
POST   /doctor/time-off                   → Add time off
DELETE /doctor/time-off/{id}              → Remove time off

# Settings
GET    /settings                          → Settings index
PATCH  /settings                          → Update
POST   /settings/branding/logo            → Upload logo

# Insurance providers
GET    /insurance-providers               → List
POST   /insurance-providers               → Create
PATCH  /insurance-providers/{id}          → Update
DELETE /insurance-providers/{id}          → Soft delete

# Reports
GET    /reports                           → Reports index
GET    /reports/appointments              → Appointments report
GET    /reports/revenue                   → Revenue report
GET    /reports/patients                  → Patients report
GET    /reports/diagnoses                 → Diagnoses report
GET    /reports/{type}/export             → CSV export

# Audit
GET    /audit                             → Audit logs

# Forms
GET    /forms                             → Forms index
POST   /forms                             → Create
GET    /forms/{id}/edit                   → Builder page
PATCH  /forms/{id}                        → Update form metadata (title, type, is_active)
DELETE /forms/{id}                        → Soft delete

# Form sections
POST   /forms/{form}/sections             → Create section
PATCH  /forms/{form}/sections/{id}        → Update
DELETE /forms/{form}/sections/{id}        → Soft delete
POST   /forms/{form}/sections/reorder     → Bulk reorder

# Form questions
POST   /sections/{section}/questions      → Create question
PATCH  /sections/{section}/questions/{id} → Update
DELETE /sections/{section}/questions/{id} → Soft delete
POST   /sections/{section}/questions/reorder → Bulk reorder

# Form submissions
GET    /forms/{id}/submissions            → Submissions list
GET    /submissions/{id}                  → Show submission (renders snapshot)
```

### Controllers
`app/Http/Controllers/Tenant/`:
- `DashboardController`
- `StaffController`
- `DoctorProfileController`
- `WorkingHoursController`
- `SettingsController`
- `InsuranceProviderController`
- `ReportController`
- `AuditController`
- `MedicalFormController`
- `FormSectionController`
- `FormQuestionController`
- `FormSubmissionController`

### Form Requests
Per-controller, in `app/Http/Requests/Tenant/`.

### Resources
Per-model, in `app/Http/Resources/Tenant/`.

### Services
- `app/Services/Tenant/MedicalFormService.php` — handles form duplication, version tracking
- `app/Services/Tenant/FormSnapshotService.php` — generates snapshot JSON from a form (used at submission time in Phase 10)
- `app/Services/Tenant/StatsService.php` — dashboard stats
- `app/Services/Tenant/ReportService.php` — report generation
- `app/Services/Tenant/CSVExporter.php`

### Form Snapshot Generation Logic

Critical: `FormSnapshotService::snapshot(MedicalForm $form): array`

Returns:
```json
{
  "form_id": 12,
  "title": "General Intake Form",
  "sections": [
    {
      "id": 45, "title": "Personal History", "order": 1,
      "questions": [
        {
          "id": 100, "key": "smokes_cigarettes", "label": "Do you smoke?",
          "type": "radio", "required": true, "validation_rules": null,
          "options": [
            {"value": "yes", "label": "Yes"},
            {"value": "no", "label": "No"}
          ]
        }
      ]
    }
  ]
}
```

This is called from Phase 10's consultation flow when a doctor submits a form during consultation.

## Tests

In `tests/Feature/Tenant/`:
- `FormBuilderTest.php`:
  - Create form, add section, add question, reorder
  - Generate snapshot returns correct structure
  - Stable keys auto-generated and unique within form
- `StaffManagementTest.php` — secretary cannot access staff routes (403)
- `WorkingHoursTest.php` — saving hours works
- `InsuranceProviderTest.php`
- `ReportsTest.php`
- `BrandingUploadTest.php`

## Constraints

- All operations log to tenant audit
- All routes use policies (Phase 5)
- All forms use react-hook-form + zod
- Drag-and-drop persists immediately (don't wait for "Save")
- Form builder MUST work in both LTR and RTL
- All strings in i18n
- Do NOT delete questions if any submission references them — soft delete only

## Definition of Done

- [ ] Doctor logs in, lands on populated dashboard
- [ ] Can build a multi-section, multi-question form
- [ ] All question types render correctly in preview
- [ ] Snapshot generation produces correct JSON
- [ ] Drag-reorder works for sections and questions in both LTR and RTL
- [ ] Stable keys auto-generated, editable, unique-within-form
- [ ] Staff CRUD works, secretary role auto-assigned
- [ ] Working hours save correctly
- [ ] Logo upload works (stored in tenant filesystem)
- [ ] All reports render with real data
- [ ] All Phase 8 tests pass

## Notes for Future Phases

- Phase 10 uses the form structure built here, plus `FormSnapshotService`, to render and submit forms during consultations
- The `Preview Form` dialog uses the same renderer that Phase 10 will use during consultations — extract into a shared `<FormRenderer />` component if practical
