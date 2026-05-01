# Phase 9 — Secretary / Reception Module

> **Prerequisite:** Paste `00-master-spec.md` above this prompt. Phases 1-8 must be complete.

## Goal

Build the secretary's workflow: patient registration, search, appointments, queue, billing. The secretary's UI must be **fast** — they handle walk-ins under time pressure.

## Pages to Build

All under `resources/js/Pages/Tenant/`. Use `AppLayout`. Sidebar items hidden via `<Can />` if user is not authorized.

### 1. Reception Dashboard (`/reception`)
File: `Pages/Tenant/Reception/Dashboard.tsx`

The secretary's homepage when they log in.

Stat strip:
- Today's appointments: total / arrived / pending / completed
- Walk-ins today
- Pending payments

**Today's queue panel** (large, central):
- Live list of appointments for today, sorted by `scheduled_for`
- Each row shows: queue number, patient name, scheduled time, status badge, actions
- Status quick-actions: "Mark arrived", "Cancel", "Complete"
- Click row → patient quick-view side panel

Action buttons (top):
- **Add Walk-in** (large, prominent)
- **Search Patient** (cmd+k)
- **Book Appointment**

### 2. Patient Search & Registration

#### Patient Search (always-on, cmd+k)
File: `Components/domain/PatientSearch.tsx`

A global command palette accessible from anywhere via cmd+k or the search input in topbar.

Behavior:
- Type to search by name OR phone OR national ID
- Real-time results (debounced 300ms)
- Empty state: "No patient found. Register new?"
- Click result → patient profile
- Click "Register new" → opens registration modal pre-filled with the search query

#### Patient Registration Modal
File: `Components/domain/PatientRegistrationForm.tsx`

**Progressive disclosure** — start with minimum, expand for more.

**Step 1 (always visible):**
- First name *
- Last name *
- Phone *
- Date of birth (with age helper showing computed age)
- Gender *

**Step 2 (collapsible: "More details"):**
- National ID
- Email
- Marital status
- Occupation
- Preferred language (default: clinic default)
- Address, city
- Phone alt
- Referred by

**Step 3 (collapsible: "Emergency contact"):**
- Name, phone, relation

**Step 4 (collapsible: "Quick medical flags"):**
- Blood type (select)
- Allergies summary (textarea)
- Chronic conditions summary (textarea)
- Current medications summary (textarea)

**Step 5 (collapsible: "Insurance"):**
- Has insurance toggle
- Insurance provider (combobox: searchable, with "Add new: '...'" option at bottom that creates a new provider on submit)
- Policy number

**Step 6 (collapsible: "Files"):**
- Drop zone for ID card scan, insurance card scan, prior reports
- Each file picks a category from a dropdown
- Optional notes per file

**Step 7 (collapsible: "Notes"):**
- Free-text notes from secretary

**Submit:**
- Validates required fields
- Creates patient
- Auto-generates `patient_code` (P-XXXXX)
- Logs to audit
- Closes modal, redirects to patient profile OR returns to flow that triggered registration

**Phone-first guard:**
- Before submission, system checks if phone already exists for another patient
- If yes: shows warning dialog "3 patients found with this phone — is it one of them?" with list. Secretary chooses to cancel, use existing, or proceed anyway (creates duplicate intentionally — sometimes happens with family sharing phone).

### 3. Patients List (`/patients`)
File: `Pages/Tenant/Patients/Index.tsx`

DataTable:
- Patient code, name, phone, age, gender, last visit, registered at
- Filters: gender, has insurance, age range, registered date range
- Search: name, phone, national ID, patient code
- Top-right: "Register Patient" button

### 4. Patient Profile (`/patients/{id}`)
File: `Pages/Tenant/Patients/Show.tsx`

**Header section** (always visible):
- Photo
- Patient code
- Name + age + gender
- Phone (clickable to copy)
- Quick medical flags (blood type badge, allergies highlight, chronic conditions)
- Insurance badge (if any)
- Action buttons: Edit, Book Appointment, Add Payment

**Tabs:**

Tab 1: **Overview**
- All admin info (contact, address, emergency, insurance)
- Edit inline buttons per section

Tab 2: **Visit History**
- Timeline of past appointments and consultations
- Each entry expandable to show consultation summary (read-only for secretary; full data for doctor)
- Secretary view: appointment status, payment info
- Doctor view: also shows consultation notes, prescriptions, diagnoses, form submissions

Tab 3: **Files**
- Grid of uploaded files by category
- Upload button
- Click file → preview/download

Tab 4: **Payments**
- All payments for this patient
- Outstanding balance (if any)
- Add Payment button

Tab 5: **Audit** *(visible only to clinic admin/doctor)*
- Audit log filtered by this patient

### 5. Appointments

#### Appointments Calendar (`/appointments`)
File: `Pages/Tenant/Appointments/Calendar.tsx`

Use **FullCalendar** with:
- Views: Day, Week, Month
- Time slots aligned to doctor's working hours (9:00-17:00 visible, before/after grayed)
- Breaks shown as gray blocks (lunch, prayer)
- Time-off shown as red blocks
- Appointments as colored blocks (color by status)
- Click empty slot → opens "Book Appointment" dialog with that time prefilled
- Click appointment → opens detail/edit dialog
- Drag appointment → reschedule (saves to backend, with confirmation toast)

**Status colors:**
- Pending: gray
- Confirmed: blue
- Arrived: yellow
- In progress: purple
- Completed: green
- Cancelled: red (with strikethrough)
- No show: dark red

#### Book Appointment Dialog
- Patient (combobox: search by name/phone, or "Register new patient" inline)
- Date + time
- Duration (default from doctor settings)
- Reason (optional, from patient)
- Notes (secretary)
- Status (default "pending")

Validation:
- Cannot book outside working hours
- Cannot book during breaks/time-off (warning, not block — sometimes secretaries override)
- Conflict detection: if another appointment overlaps, show warning

#### Today's Schedule (`/appointments/today`)
File: `Pages/Tenant/Appointments/Today.tsx`
- Same content as Reception Dashboard's queue panel, but full-page
- Quick actions per row

### 6. Queue Management
Built into dashboard + today's schedule. Each appointment status transition:
- Pending → Confirmed: by secretary (confirm via call/SMS)
- Confirmed → Arrived: when patient checks in (sets `arrived_at`, assigns `queue_number`)
- Arrived → In Progress: when doctor starts consultation (Phase 10 transitions this)
- In Progress → Completed: when consultation ends
- Any → Cancelled / No Show: by secretary

`queue_number` is per-day, auto-incremented when patient marked as arrived.

### 7. Payments

#### Add Payment Dialog
File: `Components/domain/PaymentForm.tsx`

Triggered from:
- Patient profile
- Completed appointment
- Standalone "Add Payment" page

Fields:
- Patient (auto if from context, searchable otherwise)
- Linked appointment (optional)
- Linked consultation (optional, auto-derived from appointment)
- Amount
- Method:
  - Cash
  - Card
  - Insurance
  - **Mixed** — opens 3 amount fields (cash + card + insurance) that must sum to total

Auto-generated:
- `receipt_number` (sequential, format: R-YYYYMM-XXXXX)
- `paid_at` (now)
- `collected_by` (current user)

Submit:
- Validates sum (for mixed)
- Creates payment record
- Print receipt button (opens print-friendly view)

#### Payments List (`/payments`)
File: `Pages/Tenant/Payments/Index.tsx`

DataTable:
- Receipt number, patient, amount, method, status, paid at, collected by
- Filters: date range, method, status
- Total at top of filtered range

### 8. Print Receipt
File: `Pages/Tenant/Payments/Receipt.tsx`

Renders a print-optimized HTML view:
- Clinic logo + name + address
- Receipt number, date
- Patient info
- Line items: appointment/consultation reference, amount
- Total
- Payment method breakdown
- Thank you note (from clinic settings)

Uses `@media print` styles. Trigger: `window.print()` button or auto-print after submission.

Bilingual: prints in patient's preferred language.

## Backend

### Routes (in `routes/tenant.php`)

```
# Reception dashboard
GET    /reception                          → Dashboard

# Patients
GET    /patients                           → Index
POST   /patients                           → Create
GET    /patients/{id}                      → Show
PATCH  /patients/{id}                      → Update
DELETE /patients/{id}                      → Soft delete
GET    /patients/search                    → AJAX search (returns JSON)
POST   /patients/{id}/files                → Upload file
DELETE /patients/{id}/files/{file_id}      → Delete file

# Appointments
GET    /appointments                       → Calendar page
GET    /appointments/today                 → Today list
GET    /appointments/data                  → AJAX feed for FullCalendar
POST   /appointments                       → Create
PATCH  /appointments/{id}                  → Update (incl. drag-reschedule)
POST   /appointments/{id}/arrive           → Mark arrived
POST   /appointments/{id}/cancel           → Cancel
POST   /appointments/{id}/no-show          → Mark no-show

# Payments
GET    /payments                           → Index
POST   /payments                           → Create
GET    /payments/{id}/receipt              → Print receipt view
```

### Controllers
- `Tenant/ReceptionDashboardController`
- `Tenant/PatientController`
- `Tenant/PatientFileController`
- `Tenant/AppointmentController`
- `Tenant/PaymentController`

### Actions
- `RegisterPatientAction` — creates patient, generates code, handles files, logs audit
- `BookAppointmentAction` — validates conflicts, creates record
- `RecordPaymentAction` — generates receipt number, validates sums

### Form Requests
- `Tenant/StorePatientRequest`
- `Tenant/UpdatePatientRequest`
- `Tenant/StoreAppointmentRequest`
- `Tenant/UpdateAppointmentRequest`
- `Tenant/StorePaymentRequest`

### Services
- `Tenant/PatientSearchService` — fast multi-field search
- `Tenant/AppointmentConflictService` — checks overlapping bookings, breaks, time-off
- `Tenant/ReceiptNumberGenerator`
- `Tenant/QueueService` — manages today's queue numbering

## Tests

In `tests/Feature/Tenant/`:
- `PatientRegistrationTest.php` — full flow including duplicate phone warning
- `PatientSearchTest.php` — search by name, phone, national ID
- `AppointmentBookingTest.php`
- `AppointmentConflictDetectionTest.php`
- `AppointmentRescheduleTest.php`
- `PaymentRecordingTest.php` — incl. mixed method validation
- `ReceiptGenerationTest.php`
- `SecretaryCannotAccessConsultationsTest.php` (role enforcement)

## Constraints

- All actions audited
- Patient profile photos: max 2MB, jpg/png/webp
- Patient files: max 10MB each, pdf/jpg/png/webp
- File storage uses Laravel's Storage facade (local disk in v1, swappable to S3)
- All times stored UTC, displayed in clinic's timezone (clinic timezone in clinic_settings, default `Asia/Hebron`)
- Phone validation: lenient (accepts spaces, dashes, parens, +) but normalized on save (digits + leading +)

## Definition of Done

- [ ] Secretary logs in → reception dashboard shows today's queue
- [ ] Cmd+K opens search globally
- [ ] Registering a new patient with phone duplicate triggers warning
- [ ] Calendar shows appointments with correct status colors
- [ ] Drag-rescheduling an appointment persists
- [ ] Booking outside working hours blocked / warning
- [ ] Marking arrived assigns next queue number for the day
- [ ] Mixed payment validates sum correctly
- [ ] Receipt prints in patient's language
- [ ] Secretary cannot access /forms or /consultations (403)
- [ ] All Phase 9 tests pass
- [ ] Mobile-responsive (tablet at minimum — secretaries use both)

## Notes for Future Phases

- Phase 10 (doctor consultation) reads `patient.appointments` to find arrived patients waiting in the queue
- Phase 10 transitions appointment status from "arrived" → "in_progress" → "completed"
