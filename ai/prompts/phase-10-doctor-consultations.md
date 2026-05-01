# Phase 10 — Doctor Module: Consultation Flow

> **Prerequisite:** Paste `00-master-spec.md` above this prompt. Phases 1-9 must be complete.

## Goal

Build the doctor's consultation workflow: see today's queue, start a consultation, fill medical forms (with versioning via snapshots), record diagnoses, write prescriptions, view full visit history.

This is where everything comes together: forms from Phase 8, patients from Phase 9, audit logging from Phase 3.

## Pages to Build

All under `resources/js/Pages/Tenant/Doctor/`. Use `AppLayout`. Permissions enforced via policies (Phase 5).

### 1. Doctor Dashboard (`/doctor`)
File: `Pages/Tenant/Doctor/Dashboard.tsx`

Stat cards:
- Today's appointments (total / arrived / waiting)
- Patients seen today
- Pending follow-ups (consultations marked `follow_up_in_days` and due)
- This month's consultations

Sections:
- **Now serving panel** — current in-progress consultation (if any) with "Resume" button
- **Today's queue** — list of arrived patients waiting, with "Start Consultation" button per row
- **Today's schedule** — full day timeline (read-only)
- **Recent patients** — last 5 the doctor saw

### 2. Today's Queue (`/doctor/queue`)
File: `Pages/Tenant/Doctor/Queue.tsx`

Live list (auto-refresh every 30s) of today's arrived patients sorted by `queue_number`:
- Queue number (large)
- Patient name + age + gender
- Appointment time vs arrival time
- Wait duration (calculated, color-coded: green <15min, yellow 15-30min, red >30min)
- Action: "Start Consultation"

Doctor can also start a consultation for a walk-in (patient not in queue) via "Add Walk-in" button — opens patient search → starts consultation directly.

### 3. Consultation Page (`/consultations/{id}` — the main work view)
File: `Pages/Tenant/Doctor/Consultation.tsx`

This is the doctor's primary work surface. Layout:

```
┌──────────────────────────────────────────────────────────────┐
│  PATIENT HEADER                                                │
│  Photo | Name | Code | Age/Gender | Phone                      │
│  Allergies (red) | Chronic (yellow) | Blood type | Insurance  │
├─────────────────────┬────────────────────────────────────────┤
│                     │                                          │
│  LEFT PANEL         │  CENTER PANEL                            │
│  (35%)              │  (65%)                                   │
│                     │                                          │
│  Visit History      │  Current Consultation                    │
│  (timeline)         │  ─────────────────                       │
│                     │                                          │
│  ▸ 2025-01-15       │  Tab: Overview                           │
│    General Check    │    Chief complaint [textarea]            │
│  ▸ 2024-11-02       │    Notes [textarea]                      │
│    Flu              │    Follow-up in: [number] days           │
│  ▸ 2024-08-20       │                                          │
│    Initial Visit    │  Tab: Medical Form                       │
│                     │    [Form picker → fill form]             │
│                     │                                          │
│                     │  Tab: Diagnoses                          │
│                     │    [Add diagnosis]                       │
│                     │                                          │
│                     │  Tab: Prescription                       │
│                     │    [Add medication item]                 │
│                     │                                          │
│                     │  Tab: Files                              │
│                     │    [Upload / view files]                 │
│                     │                                          │
│                     │  ─────────────────                       │
│                     │  [Save Draft]  [Complete Consultation]   │
└─────────────────────┴────────────────────────────────────────┘
```

#### Left panel: Visit History
- Timeline of all past consultations for this patient
- Click an entry → expands inline to show summary OR opens read-only modal
- Indicator if entry has form submission, prescription, diagnosis
- **Critical:** when viewing a past visit, the form renders using `form_snapshot` from that submission, not the current form structure

#### Center panel: Current Consultation tabs

**Tab: Overview**
- Chief complaint (textarea)
- Free-text notes
- Follow-up days (number)
- Auto-save every 30 seconds OR on tab change

**Tab: Medical Form**
- Form picker (dropdown of doctor's active forms — defaults to "intake" type for new patients, "follow_up" for returning patients)
- Renders selected form using shared `<FormRenderer />` component
- Fields are editable
- Required field validation
- **On save:** generates `form_snapshot` + `answers_snapshot` and creates `form_submission` record
- Multiple submissions allowed per consultation (e.g. intake + condition-specific form)

**Tab: Diagnoses**
- List of diagnoses for this consultation
- Add diagnosis: code (optional, free text for v1; ICD-10 lookup is v2), description, notes
- Edit / delete inline

**Tab: Prescription**
- List of medication items
- Add item: medication name, dosage, frequency, duration, instructions
- Drag-to-reorder
- Auto-suggest medication names from previous prescriptions in this clinic (in-DB autocomplete)
- "Print Prescription" button → opens print-friendly view
- Print includes clinic branding, doctor name + license, patient info, items, signature line
- Bilingual print (patient's preferred language)

**Tab: Files**
- Upload consultation-related files (lab results, etc.)
- These are stored as `patient_files` with category `external_report` or new category `consultation_attachment`

#### Footer actions
- **Save Draft** — keeps consultation in `in_progress` status, can resume later
- **Complete Consultation** — confirmation dialog, sets `ended_at`, transitions appointment to `completed`, generates payment if not already done (or prompts for it)

### 4. Form Renderer Component
File: `Components/domain/FormRenderer.tsx`

**The same component renders both:**
1. A live form being filled during consultation (interactive)
2. A historical submission (read-only, using `form_snapshot`)

Props:
```typescript
type Props = {
  schema: FormSchema; // either current form structure or a snapshot
  values?: Record<string, any>; // for read-only or pre-filled state
  readOnly?: boolean;
  onSubmit?: (values: Record<string, any>) => void;
  onChange?: (values: Record<string, any>) => void; // for autosave
};
```

Renders sections + questions based on `type`:
- text / textarea / number / date → respective inputs
- radio / checkbox / select → respective controls with options
- file → file upload (uses Storage)
- signature → canvas-based signature pad (use `react-signature-canvas`)

Validates required fields and validation rules before submission.

In read-only mode: renders all fields disabled with their values from `answers_snapshot`.

### 5. Patient Visit History (`/patients/{id}/history`)
File: `Pages/Tenant/Doctor/PatientHistory.tsx`

Standalone page for deep history review (separate from the consultation page's left panel).

Timeline view:
- Past consultations
- Each shows: date, doctor (relevant for v2 multi-doctor), chief complaint, diagnoses summary
- Expand entry → renders the consultation in read-only:
  - Form submissions rendered using their snapshots
  - Diagnoses, prescriptions
  - Files attached

This view is the **proof point** of the snapshot architecture: a consultation from 6 months ago renders with the form structure as it was 6 months ago, even though the form has been edited since.

### 6. Forms List for Quick Access
Doctor's forms list (already exists from Phase 8) is reachable from sidebar. No changes here.

### 7. Prescription Print View
File: `Pages/Tenant/Doctor/PrescriptionPrint.tsx`

Print-friendly layout:
- Header: clinic logo + name + address + phone
- Doctor: name, specialty, license
- Patient: name, age, gender, code
- Date
- Diagnoses (brief list)
- Medications table: name, dosage, frequency, duration, instructions
- Signature line + stamp area
- Footer: clinic disclaimer

`@media print` optimized. Bilingual based on patient preference.

## Backend

### Routes (in `routes/tenant.php`, behind doctor permissions)

```
# Doctor dashboard
GET    /doctor                              → Dashboard
GET    /doctor/queue                        → Today's queue

# Consultations
GET    /consultations                       → Index (filtered list)
POST   /consultations                       → Start (creates record, transitions appointment)
GET    /consultations/{id}                  → Show / work view
PATCH  /consultations/{id}                  → Update (chief complaint, notes, follow_up)
POST   /consultations/{id}/complete         → Complete (sets ended_at, transitions appointment)

# Form submissions
POST   /consultations/{id}/submissions      → Submit a form (generates snapshot + answers)
GET    /submissions/{id}                    → Show snapshot read-only

# Diagnoses
POST   /consultations/{id}/diagnoses        → Create
PATCH  /diagnoses/{id}                      → Update
DELETE /diagnoses/{id}                      → Soft delete

# Prescriptions
POST   /consultations/{id}/prescription     → Create or update single prescription
POST   /prescriptions/{id}/items            → Add item
PATCH  /prescriptions/{id}/items/{itemId}   → Update item
DELETE /prescriptions/{id}/items/{itemId}   → Delete
GET    /prescriptions/{id}/print            → Print view

# Patient history
GET    /patients/{id}/history               → Full history page
```

### Controllers
- `Tenant/Doctor/DashboardController`
- `Tenant/Doctor/QueueController`
- `Tenant/Doctor/ConsultationController`
- `Tenant/Doctor/FormSubmissionController`
- `Tenant/Doctor/DiagnosisController`
- `Tenant/Doctor/PrescriptionController`
- `Tenant/Doctor/PatientHistoryController`

### Actions
- `StartConsultationAction` — creates consultation, transitions appointment status
- `CompleteConsultationAction` — finalizes, transitions appointment, optionally creates payment placeholder
- `SubmitFormAction` — generates snapshot via `FormSnapshotService`, persists submission
- `CreatePrescriptionAction`

### Services
- `FormSnapshotService` (already built in Phase 8) — used here to snapshot form on submit
- `Tenant/MedicationSuggestionService` — returns previously prescribed medications matching a query string (clinic-wide, for autocomplete)

### Form Requests
- `Tenant/Doctor/StartConsultationRequest`
- `Tenant/Doctor/UpdateConsultationRequest`
- `Tenant/Doctor/SubmitFormRequest` — validates against form's required fields and validation rules
- `Tenant/Doctor/StoreDiagnosisRequest`
- `Tenant/Doctor/StorePrescriptionItemRequest`

### Resources
- `Tenant/ConsultationResource`
- `Tenant/FormSubmissionResource` — includes `form_snapshot` so frontend can render
- `Tenant/PrescriptionResource`
- `Tenant/DiagnosisResource`
- `Tenant/PatientHistoryResource` — aggregates everything for timeline

## Auto-save Strategy

Long consultations risk data loss on refresh/disconnect.

Implementation:
- Debounce 5 seconds on overview/notes textarea changes → PATCH consultation
- Form fields: client-side state only until form is submitted (not auto-saved — too risky)
- Diagnoses, prescription items: saved immediately on add/edit/delete (small, atomic)
- Visual indicator: "Saved 3 seconds ago" / "Saving..." / "Unsaved changes"

## Tests

In `tests/Feature/Tenant/Doctor/`:
- `StartConsultationTest.php` — appointment transitions arrived → in_progress
- `CompleteConsultationTest.php` — appointment transitions to completed
- `FormSubmissionSnapshotTest.php` (the critical one):
  - Submit form v1 for patient → snapshot stored
  - Edit form (add question, change label, delete option)
  - Submit form v2 for same patient → second snapshot has new structure
  - Render history → first submission renders with v1 structure, second with v2
- `PrescriptionItemsTest.php`
- `DiagnosisCRUDTest.php`
- `PatientHistoryTest.php` — timeline returns correct chronological data
- `MedicationAutocompleteTest.php`
- `SecretaryCannotAccessConsultationsTest.php` — 403 on doctor routes

## Constraints

- Every consultation action audited
- Form submissions are immutable once submitted (no edit, no delete — can soft-delete the consultation entirely if needed, but submission stays)
- Prescription items are editable until the prescription is `printed_at` — after printing, they lock (legal/medical reason: a printed prescription is a document)
- Diagnoses can be edited/deleted before consultation completion; after completion, only soft delete
- All forms in i18n
- Print views bilingual based on patient.preferred_language
- The `<FormRenderer />` component is the single source of truth for rendering forms — the form builder preview (Phase 8) and the consultation view (Phase 10) both use it

## Definition of Done

- [ ] Doctor logs in, sees dashboard with arrived patients
- [ ] Click "Start Consultation" → consultation page opens with patient header + tabs
- [ ] Can fill the medical form, submit → snapshot stored
- [ ] Edit the form, submit again → second submission has new snapshot, first stays unchanged
- [ ] Visit history renders each past visit with its original form structure (proven by test)
- [ ] Diagnoses + prescription items work
- [ ] Print prescription opens printable view in patient's language
- [ ] Complete consultation transitions appointment correctly
- [ ] Auto-save works for notes/chief complaint
- [ ] Secretary blocked from all doctor routes
- [ ] All Phase 10 tests pass
- [ ] Mobile/tablet usable for consultation (doctors sometimes review on tablet)

## Final Project Validation

After Phase 10 completes, run a full end-to-end smoke test:

1. Super admin creates a new clinic at `app.einaya.test`
2. New clinic admin logs in at `newclinic.einaya.test`
3. Builds a custom intake form
4. Adds a secretary
5. Secretary registers a patient
6. Books appointment
7. Patient "arrives" → enters queue
8. Doctor starts consultation
9. Fills form, adds diagnosis, writes prescription
10. Prints prescription
11. Records cash + insurance mixed payment
12. Edits the form (adds a new question)
13. Books second appointment for same patient
14. Completes second consultation with new form
15. Views patient history → first visit renders with old form structure, second with new

If all 15 steps work, **v1 is shippable**.

## Post-v1 Roadmap (NOT in this phase)

- SaaS billing via Stripe + Cashier
- SMS reminders (Twilio)
- Email notifications
- S3 file storage
- Patient portal (read-only access for patients)
- Multi-doctor per clinic UI
- ICD-10 diagnosis lookup
- Lab results integration
- Telemedicine
- Mobile app (React Native)
- Advanced analytics
