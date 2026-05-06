# Einaya — Post-v1 Enhancement Plan

> **Scope.** This is a planning document, not a build prompt. It catalogues every concrete bug, gap, and rough edge surfaced during the Phase 1–10 build, then groups them into phases that can be executed in any order. Each item names the file(s) and a short, testable acceptance bar so it can be picked up cold.
>
> **Last reviewed:** 2026-05-07 (after Phase 10 wrap, before any post-v1 changes).
>
> **How to read it.** Phases 11–15 are ordered by risk: 11 fixes user-visible breakage; 12 polishes UX; 13 attacks performance; 14 covers accessibility / a11y; 15 hardens the operational surface. Phase 16 captures everything explicitly out-of-scope for v1 (Stripe, Twilio, S3, mobile app, etc.) so we don't lose it.
>
> **What this document is not.** It does not cover post-v1 *features* from the master spec (telemedicine, multi-doctor UI, ICD-10 lookup) — those live in `00-master-spec.md` and the Phase 10 prompt. This is the residue: things that are wrong or unfinished about what we've already shipped.

---

## Phase 11 — Triage: bugs and dead clicks ✅ shipped 2026-05-07

All 15 items below are done. See PROGRESS.md "Phase 11 — Post-v1 Triage" for per-item ship notes. The catalogue below is preserved as the original problem statement.

### 11.1 Sidebar items pointing at routes that don't exist

**Found in:** `resources/js/Components/domain/layout/AppSidebar.tsx`

The sidebar has been accumulating links faster than the controllers they point at.

| Link | Route exists? | Action |
| --- | --- | --- |
| `/` | yes | — |
| `/reception` | yes | — |
| `/patients` | yes | — |
| `/appointments` | yes | — |
| `/doctor` | yes | — |
| `/doctor/queue` | yes | — |
| `/forms` | yes | — |
| `/prescriptions` | **no list route exists** | Either build an index or remove the sidebar item |
| `/payments` | yes | — |
| `/reports` | yes | — |
| `/staff` | yes | — |
| `/settings` | yes | — |
| `/branding` | **no route exists** | Sidebar should link to `/settings#branding` (or similar tab anchor) instead |
| `/consultations` | **no list route, only `/consultations/{id}`** | Build a `ConsultationListController` or drop the sidebar item — see 11.2 |

**Acceptance:** every visible sidebar item resolves to a 200 page. Clicking them as both `clinic_admin` + `secretary` exercises permission gates correctly (some items should hide).

### 11.2 `Pages/Consultations/Index.tsx` doesn't exist

**Files:** none yet. Needs `app/Http/Controllers/Tenant/ConsultationController` (read-only index) + `resources/js/Pages/Tenant/Consultations/Index.tsx`.

The Phase 5 permission `consultations.view` exists; the doctor sidebar exposes `/consultations` from Phase 6 but no controller backs it. Today clicking it 404s.

**Acceptance:** GET `/consultations` returns a paginated DataTable: patient · doctor · started_at · ended_at · status. Filters: date range, doctor (when multi-doctor lands), patient, only-completed. Doctor only sees their own; clinic_admin sees all.

### 11.3 `MedicalFormController::index/edit` permission gate added late, missed in Phase 8

**File:** `app/Http/Controllers/Tenant/MedicalFormController.php`

Phase 9 retro-fitted `forms.view` / `forms.manage` checks because the Phase 9 secretary-403 test caught the gap. Other Phase 8 controllers were never audited for the same bug. **All these need an explicit `ensureCan` at the entry of `index`/`show`**:

- `InsuranceProviderController::index` (`insurance.view`)
- `StaffController::index` (`staff.view`)
- `DoctorProfileController::show` (`doctor.view_profile`)
- `WorkingHoursController::show` (`doctor.manage_hours`)
- `SettingsController::show` (`clinic.view_settings`)
- `ReportController::index` (`reports.view`) — already has it
- `AuditController::index` (`audit.view`) — already has it

The form-request permission checks only catch mutations. A user with no permission can today GET the index page and see data they shouldn't. Same shape of bug we caught for `/forms`.

**Acceptance:** every `secretary`-role test for the listed paths returns 403. Add a parameterized test in `tests/Feature/Tenant/SecretaryAccessMatrixTest.php` that walks the matrix.

### 11.4 Reception dashboard "stat" card duplication

**File:** `resources/js/Pages/Tenant/Reception/Dashboard.tsx`

The 4-card stat strip currently shows: Today's appointments / Walk-ins / Pending payments / **"Total today"** (which is the same number as Today's appointments). Cosmetic embarrassment.

**Acceptance:** replace the duplicate card with something useful — first-arrival average (mins), or no-show count, or "next appointment" countdown.

### 11.5 PatientRegistrationForm in Reception passes empty `insuranceProviders={[]}`

**File:** `resources/js/Pages/Tenant/Reception/Dashboard.tsx`

A walk-in registration started from Reception can't pick an insurance provider because the dashboard controller doesn't load them. They have to register without insurance and edit it on the patient profile after.

**Acceptance:** `ReceptionDashboardController::index` loads active providers and passes them down; the registration modal works the same as on `/patients`.

### 11.6 PatientRegistrationForm phone-duplicate matches never reach the dialog

**File:** `app/Http/Controllers/Tenant/PatientController.php` + `resources/js/Components/domain/PatientRegistrationForm.tsx`

The controller stashes matches in `back()->with('duplicate_phone_matches', ...)` (Inertia flash bag), but the React component reads them off `(window as any).__flash` — which nothing populates. The duplicates never render in the warning alert. The "Use existing / Create anyway" buttons do work because the secretary can re-submit with `force_duplicate_phone=true`.

**Two fixes are valid:**
- Promote `duplicate_phone_matches` to a shared Inertia prop via `HandleInertiaRequests` (cleanest).
- Or surface them through the validation error response itself (`errors.duplicates` as a JSON-encoded list), which avoids polluting the global prop tree but is hacky.

**Acceptance:** registering with a duplicate phone shows the matches in the alert; clicking a row opens the existing patient.

### 11.7 Cmd+K patient search built but not mounted

**File:** `resources/js/Components/domain/PatientSearch.tsx` exists but is imported nowhere.

**Acceptance:** mount once at `AppLayout` level so cmd+k opens it from any tenant page. Feed `onCreateNew` to an outer state that opens `PatientRegistrationForm` with the query pre-filled.

### 11.8 Topbar "search" button is decorative

**File:** `resources/js/Components/domain/layout/AppTopbar.tsx`

The topbar shows a search button with a ⌘K hint that does nothing on click. Wire it to the same dispatch the keyboard shortcut uses (11.7).

### 11.9 Notifications dropdown is a placeholder

**File:** `resources/js/Components/domain/layout/AppTopbar.tsx`

Bell icon opens a dropdown saying "no notifications" because there's no notification model. **Either:**
- Hide it until v2 (recommended for v1).
- Or wire it to a tiny in-app notification table (overkill for v1).

### 11.10 Sidebar "back arrow" / breadcrumb hierarchy missing on key pages

**Pages missing breadcrumbs:**
- `Patients/Index` — should be `Patients` only, fine
- `Appointments/Calendar` — fine
- `Reception/Dashboard` — fine
- `Doctor/Dashboard` — fine

Where breadcrumbs ARE missing meaningfully:
- `Doctor/Consultation` — breadcrumb says "Consultations / {patient name}" but "Consultations" links to `/doctor` (the dashboard) which is confusing. Fix the label or the href.

### 11.11 `MedicalFormController::edit` form snapshot loaded via XHR hack

**File:** `resources/js/Pages/Tenant/Doctor/Consultation.tsx` (line 220 — `axios.get('/forms/${formId}/edit', { headers: { 'X-Inertia': 'true' } })`)

Hitting the edit page just to grab the form structure as JSON is brittle: any future change to that route's response shape breaks consultations. The Inertia version mismatch is silenced with `'X-Inertia-Version': '*'` which is also wrong.

**Fix:** add `GET /forms/{form}/snapshot` that returns the canonical `FormSnapshot` JSON via `FormSnapshotService::snapshot()` directly. Update `Consultation.tsx` to call that.

### 11.12 PaymentForm patient picker is a free-text "Patient ID" input

**File:** `resources/js/Components/domain/PaymentForm.tsx`

The standalone "Add payment" button on `/payments` opens a dialog that asks the secretary to TYPE the patient ID. This obviously never works.

**Fix:** swap that field for a small `<PatientCombobox />` (extract from `PatientSearch` so the same debounced JSON search is reused). Same component should go into the appointment booking dialog and the consultation start flow.

### 11.13 Calendar booking dialog also asks for "Patient ID" as a free-text field

**File:** `resources/js/Pages/Tenant/Appointments/Calendar.tsx` line ~190

Same fix as 11.12 — the new shared `<PatientCombobox />` replaces the typed-ID input.

### 11.14 Dead code from Breeze

**Files:** `resources/js/Pages/Welcome.tsx`, `resources/js/Pages/Dashboard.tsx`, `resources/js/Pages/Profile/Edit.tsx` and partials use Tailwind-arbitrary `bg-white / bg-gray-*` classes from the original Breeze install.

These pages still work but render in the wrong palette in dark mode — `bg-white` is force-white even with `dark` class. Either repaint with the design tokens or replace with the new layouts.

`Pages/Dashboard.tsx` is currently unreferenced (the central + tenant dashboards live elsewhere). Just delete it.

### 11.15 Working-hours visualization missing

**Spec said:** "Visual representation: a week-view mini-calendar showing working hours and breaks shaded."

**What we have:** a row-per-day editor + a flat list of breaks.

**Acceptance:** add a small read-only week view above the editor showing working hours as solid blocks and breaks/time-off as shaded bands.

---

## Phase 12 — UX & visual polish

### 12.1 Search inputs on list pages: blur-or-Enter behavior is laggy

**Files:**
- `Pages/Tenant/Patients/Index.tsx`
- `Pages/Tenant/Payments/Index.tsx`
- `Pages/Tenant/Audit/Index.tsx`
- `Pages/Tenant/Reports/Index.tsx`
- `Pages/Central/Clinics/Index.tsx`
- `Pages/Central/Tickets/Index.tsx`

Today these pages debounce nothing — they only fire on `Enter` or `onBlur`. Typing four characters and pausing does nothing until you click away. Replace with a 300ms debounced effect (same pattern as `PatientSearch`).

**Suggested helper:** `resources/js/Hooks/useDebouncedFilter.ts` so every list page has one line each.

### 12.2 Mutation buttons don't go disabled / show a spinner

**Found:** every page that calls `router.post / router.delete / router.patch` directly (not through `useForm`) lacks a `disabled` state on the triggering button. List in PROGRESS audit (search "Pages that send mutations without disabling the submit btn"):
- `Settings/Index.tsx` logo upload
- `Forms/Index.tsx` duplicate / delete
- `Forms/Builder.tsx` reorder + delete
- `Appointments/Today.tsx` arrive / cancel
- `Doctor/WorkingHours.tsx` break/time-off destroy
- `Doctor/Dashboard.tsx` start-consultation
- `Doctor/Queue.tsx` start-consultation
- `Doctor/Consultation.tsx` complete + diagnosis delete + prescription item delete + form submit

A double-click on "Mark arrived" calls `arrive` twice → 500 the second time (queue_number unique-ish but the sequence is fragile) → toast says "marked arrived" twice. Same for "Start consultation" which can race two parallel POSTs.

**Acceptance:** introduce a tiny hook `usePending(action)` that wraps `router.*` calls and returns `[busy, run]` — busy disables the button. Apply across all the listed pages.

### 12.3 Modal close-on-backdrop works but doesn't preserve form state

**Component:** `resources/js/Components/ui/dialog.tsx` (shadcn default)

shadcn's Dialog dismisses on Escape and on outside-click. For long forms (`PatientRegistrationForm`, `Builder.QuestionDialog`) that's destructive — you can lose 30s of typing. Add `onOpenAutoFocus` + a `confirm if dirty` interceptor for those two.

**Acceptance:** typing into the form, clicking the backdrop, prompts "Discard changes?" with Cancel / Discard. Escape behaves identically.

### 12.4 Mixed payment dialog: total / split mismatch UX

**File:** `resources/js/Components/domain/PaymentForm.tsx`

Today the "Record payment" button stays enabled even when sum ≠ amount. A red alert appears AFTER you've typed the wrong split. The spec says "must sum to total."

**Acceptance:** disable the submit button when `sumMismatch`. Show a sum-running line `Sum: 60 / 100` live as the secretary types. Done in 12.2 if `usePending` covers it.

### 12.5 Receipt + prescription print: bilingual based on patient lang only

**Files:** `Pages/Tenant/Payments/Receipt.tsx`, `Pages/Tenant/Doctor/PrescriptionPrint.tsx`

Both pages flip `<html dir>` to the patient's language. But:
- The fonts don't swap with the dir (Manrope used for AR text). Add a body class that picks `--font-arabic` for AR.
- The "Doctor" / "Prescription" / "Receipt" labels are hard-coded in a 60-line `STRINGS` object inside each file. Promote to the `tenant` namespace so translators can adjust without touching code.

**Acceptance:** print in AR uses IBM Plex Sans Arabic. Print in EN uses Manrope. Both respect the dir.

### 12.6 Date format inconsistency

**21 places** use `toLocaleDateString()` / `toLocaleString()` without a locale or a format. Result: same datetime renders different ways depending on the browser locale.

**Fix:** introduce `resources/js/lib/dates.ts` with `formatDate(iso)`, `formatTime(iso)`, `formatDateTime(iso)` that read locale from Inertia's `preferences.locale` and format accordingly. Replace every direct `.toLocale*` call.

**Bonus:** factor in clinic timezone (currently UTC by default; spec says "default Asia/Hebron"). Server should apply timezone on render, FE should display the local clock time the doctor expects.

### 12.7 Hard-coded English in shadcn `<Select>` items

**Files:** Patients/Index, Payments/Index, Forms/Index, Patients/Show file-category, Doctor/PrescriptionPrint header.

Strings like `<SelectItem value="female">Female</SelectItem>` — the values stay English, the labels should be `t()`-wrapped. Roughly 20 such instances. Worth a pass.

### 12.8 AR translation file is 75 keys behind EN

**Counts:** `tenant.json` EN: 439 keys, AR: 364 keys. The 75 missing keys fall back to English text in an Arabic-first UI — visible to clinic users.

**Action:** translate the gap. Most are deeply nested under `doctorPanel.consultation.*` and `patients.form.*` (Phase 8/10 strings written EN-only).

**Tooling note:** consider a CI job that diffs key counts and fails the build if AR drifts > 5% behind EN.

### 12.9 Font sizing — base 14px is right for clinical density but…

…some places drop below it because shadcn's defaults are `text-sm` (13px) on inputs and `text-xs` (12px) on table headers. The Phase 6 spec said "base 14, line-height 1.5".

Audit the major work surfaces:
- Builder question rows — currently `text-xs` for type/key. Bump to `text-sm`.
- Consultation history left panel entries — `text-xs` on the chief complaint line. Bump.
- Calendar event titles in FullCalendar — uses default 12px which is too small for patient names in a clinic; pass a custom `eventContent` renderer that uses `text-base`.

### 12.10 Topbar layout shift when language switches

**File:** `resources/js/Components/domain/layout/AppTopbar.tsx` + `LanguageSwitcher`

Switching language reloads the page (intentional — see Phase 6 PROGRESS). But the user briefly sees the OLD direction in the freshly-loaded HTML before React picks up the new state. Acceptable for v1 — note it.

### 12.11 Toast positions: top-right doesn't make sense in RTL

**File:** `resources/js/app.tsx` line ~22 (`<Toaster richColors closeButton position="top-right" />`).

In RTL, "top-right" is the *start* corner; in LTR, it's the *end*. Should be `top-end` to match user expectation. Sonner doesn't natively support that — use `useDirection()` and pick `top-right` for LTR / `top-left` for RTL.

### 12.12 Avatar fallback initials for Arabic names

**File:** `resources/js/Components/domain/layout/UserMenu.tsx` + `Patients/Show.tsx`

Initials are computed via `name.split(/\s+/).map(p => p.charAt(0)).join('').toUpperCase()`. For Arabic names like "ليلى حباش", `charAt(0)` returns "ل" — fine, but `toUpperCase()` is a no-op and the avatar looks correct.

The bug: Arabic letters in the avatar text don't get the Arabic font (the avatar uses `font-sans` / Manrope). Add an `dir="rtl"` + `font-arabic` conditional when initials contain Arabic codepoints.

### 12.13 Forms list "search" missing

**File:** `Pages/Tenant/Forms/Index.tsx`

No search input. With dozens of forms, it'll be hard to find one by title. Add the same debounced search pattern from 12.1.

### 12.14 Builder: sections panel needs an "untitled" placeholder

**File:** `Pages/Tenant/Forms/Builder.tsx` line ~410

Empty section title renders `(untitled)` literally. Use `t('builder.untitledSection')` and an italic + muted style.

### 12.15 Builder: question rows show "key · type · 0 options" even for non-options types

**File:** `Pages/Tenant/Forms/Builder.tsx` `<QuestionItem>` (~line 525)

`{question.has_options && \`· ${question.options.length} options\`}` — fine. But for radio with zero options it says "· 0 options". Should warn the doctor that a radio question with 0 options is broken.

**Fix:** if `has_options && options.length === 0`, render a `⚠ no options yet` red badge.

### 12.16 Mobile / tablet review

Spec: "Mobile-responsive (tablet at minimum — secretaries use both)" and "doctors sometimes review on tablet."

The dashboard, calendar, and consultation pages are tested on desktop only. Need a pass on iPad-portrait (768px) at least:
- AppLayout sidebar collapses to a sheet — works
- Reception queue table scrolls horizontally — works
- Consultation page split panel becomes vertical at md breakpoint — `lg:grid-cols-[320px_1fr]` is right; verify on real iPad
- Forms builder split panel — `md:grid-cols-[320px_1fr]` may be too tight on iPad. Consider stacking on md and only splitting on lg.
- Doctor/Queue table is too wide for iPad portrait — drop "Arrived" column on `md:hidden` or convert to a card list.

### 12.17 Dialog max-height and scrolling

`Pages/Tenant/Forms/Builder.tsx`'s preview dialog has `max-h-[80vh] overflow-y-auto` — good. But `PatientRegistrationForm` doesn't and the accordion content can push the modal off-screen on a 13" laptop. Add `max-h-[85vh] overflow-y-auto` to all FormModals.

### 12.18 Empty-state polish

`<EmptyState />` exists (Phase 6) but most pages render a plain `<p>—</p>` instead. Targets:
- Patients/Index "no patients found"
- Doctor/Dashboard "no queue"
- Forms/Submissions "no submissions"
- Forms/Index "no forms"
- Reception "no appointments today"
- Reports tabs

Replace with `<EmptyState icon={...} title={...} description={...} action={...} />`. Consistent visual rhythm.

---

## Phase 13 — Performance & data hygiene

### 13.1 Bundle size

**Current:** `app.js` 538 kB (158 kB gz), `Dashboard.js` 367 kB (94 kB gz, recharts), `Builder.js` ~120 kB (dnd-kit). Total `public/build/assets` is 2.0 MB.

**Plan:**
1. Convert top-level imports in `app.tsx` to dynamic imports per Inertia page. The `resolvePageComponent` helper already supports lazy chunks; we just need `import.meta.glob('./Pages/**/*.tsx', { eager: false })`.
2. Move `recharts` to a dedicated chunk that only loads on dashboard pages — already happens with code splitting once the entry isn't eager.
3. Move `@fullcalendar/*` similarly — only `/appointments` needs it.
4. Move `dnd-kit` similarly — only the form builder needs it.
5. Move `react-colorful` similarly — only Settings needs it.

**Target:** main bundle < 200 kB gz, lazy chunks per route.

**Acceptance:** Lighthouse "Total Blocking Time" drops below 200ms on a clean tenant page.

### 13.2 N+1 risks

Quick scan didn't find obvious offenders in controllers — most lazy-load via `with()`. But two areas are risky:

- `ConsultationResource` eager-loads diagnoses + prescriptions.items + formSubmissions. On the Patient History page (which shows up to dozens of consultations) that's potentially 4×N additional queries. Verify with `php artisan db:listen` during a 50-consultation history render. If counts are high, add `Consultation::query()->with(['diagnoses', 'prescriptions.items', 'formSubmissions:id,medical_form_id,form_snapshot,answers_snapshot,submitted_at,consultation_id'])` at the controller level (already done; just verify).
- `AggregatePlatformStats` job iterates tenants and runs queries per tenant. For 50 clinics × 3 queries per tenant we already pay ~150 round trips. Cache the per-tenant counts in `clinic_settings.usage_stats` and only refresh on demand.

**Acceptance:** add a small `tests/Feature/Tenant/Doctor/PatientHistoryQueryCountTest.php` that asserts query count is ≤ N + constant for N consultations.

### 13.3 Indexes review

Patients table has indexes on phone, national_id, name, registered_by, has_insurance — good. But `PatientSearchService::search()` does `LIKE '%query%'` which can't use any of these. For clinics with > 5k patients this will be slow.

**Fix:** add a `(first_name, last_name)` GIN-equivalent — MySQL doesn't have GIN, use a generated tsvector column with FULLTEXT, or switch to Meilisearch / Typesense. v2 territory; for v1 add a migration to add a FULLTEXT index on `(first_name, last_name)` and switch the service to `MATCH AGAINST` when the term is > 3 chars.

### 13.4 Auto-aggregate job runs against tenant DBs serially

**File:** `app/Jobs/Central/AggregatePlatformStats.php`

Runs `$clinic->run(...)` in a loop. With 50 clinics each iteration is ~200ms of DB switching overhead. Total job time: 10s. Acceptable for hourly cron; not acceptable when triggered manually from the dashboard "Refresh now" button.

**Fix:** make `Refresh now` enqueue the job instead of running synchronously — show a "computing…" indicator and poll `platform_stats.generated_at` every 2s. Or split per-clinic into separate jobs and parallelize on the queue.

### 13.5 Inertia partial reloads

A few mutation handlers do full `router.reload()` when only specific props need refreshing.

**Examples:**
- `Forms/Builder.tsx::reload()` reloads ALL props of the page including the heavy section/question tree. Could use `only: ['form']`.
- `Doctor/Consultation.tsx::ensurePrescription()` does a full page reload — should `only: ['consultation']`.

### 13.6 Avatar / file URLs

Tenant uploads land in `storage/<tenant_suffix>/app/public/`. The `/storage` symlink exists for the global `public` dir, but with stancl's filesystem rewriting, the URL `/storage/branding/<file>` ends up serving from the tenant's per-suffix storage path — works in Herd but won't on a non-symlinked deployment.

**Fix:** introduce a `storage:tenant-link` Artisan command run as part of the TenantCreated pipeline that creates `public/storage-tenant_<id>` → `storage/tenant_<id>/app/public`. Or use signed URLs through stancl's `tenant.asset` route (which we disabled in Phase 7 because Vite assets broke). Re-enable selectively for `Storage::url()` calls only.

### 13.7 Form snapshot can grow unbounded

The `form_submissions.form_snapshot` JSON column has no max size limit. A pathological 200-question form with 50 options each + long labels could be > 1 MB per submission. MySQL `JSON` columns max out at LONGTEXT (4 GB) so it won't break, but indexing / backups become expensive.

**Mitigation:** content-validate the snapshot at write time — abort if > 500 KB. Or store the snapshot once per (form_version, hash) and reference it from submissions.

---

## Phase 14 — Accessibility

### 14.1 Keyboard navigation in the form builder

dnd-kit supports keyboard (we registered `KeyboardSensor`) but the visual focus ring for sortable items is hard to see. Add a `data-[is-dragging=true]:ring-2 ring-ring` style and a screen-reader announcement when an item is moved.

### 14.2 Focus trap on FormModal / ConfirmDialog

shadcn dialog uses Radix which traps focus correctly by default. Verify with screen reader (VoiceOver / NVDA): tab cycles inside the modal, never escapes.

### 14.3 Aria labels on icon-only buttons

Many icon-only buttons in the topbar / data tables lack `aria-label`. Audit all `<Button variant="ghost" size="icon">` and add accessible names.

**Files:** Reception/Dashboard, Patients/Show, Doctor/Consultation, Forms/Builder.

### 14.4 Color contrast

The status palette (Phase 6) uses subtle `bg-success/15` etc. for badges. Run the Lighthouse contrast check on the dashboard — some `text-muted-foreground` on `bg-card` combinations are at 4.4:1 against the standard 4.5:1 minimum. Either bump muted to a slightly darker slate or accept the trade-off and document.

### 14.5 RTL bugs

dnd-kit handles RTL correctly. FullCalendar's `direction="rtl"` works. But:
- The topbar search button hint ⌘K shows the literal symbol; in RTL it should still appear at the trailing edge.
- The form builder section panel grip handle is on the leading edge; verify it doesn't swap incorrectly in RTL.
- The `<Calendar />` component (date picker) needs RTL testing — react-day-picker has its own direction prop.

### 14.6 Forms with required fields don't announce them

`<Label>` shows a `*` for required fields but screen readers don't get `aria-required="true"` on the input itself. Audit all custom inputs.

---

## Phase 15 — Observability & DX

### 15.1 No global error boundary

If a Doctor/Consultation page crashes mid-typing, the whole React tree unmounts and the user sees a blank page (we hit this in Phase 8 with the Toaster). Add a top-level `<ErrorBoundary />` in `app.tsx` that renders a Sentry-style "something went wrong, refresh" panel and reports to the server.

### 15.2 No client-side error reporting

We have `storage/logs/laravel.log` for server errors but client errors go nowhere. v1 ok; v2 should add Sentry.

### 15.3 Inconsistent `error` flash usage

Controllers return `back()->with('error', '...')` for some failures but `assertSessionHasErrors([...])` for validation. The toast layer (`useFlashToasts`) handles both, but the visual style is the same. Consider making validation errors use `toast.error` with the field name surfaced.

### 15.4 Tests for tenant-context that need real tenant DB are slow

Running the full Pest suite takes ~85s on a clean DB drop. Of that, ~50s is spent creating + migrating tenant DBs in tests (CreateClinicTest, SuspendClinicTest, FormBuilderTest, etc.). Two acceleration ideas:
- Cache a tenant DB template at the start of each test run; clone it for each test rather than running migrations from scratch.
- Mark these tests `@group slow` and run them less frequently in CI.

### 15.5 No CI / GitHub Actions

There's no `.github/workflows/` directory. Set up a CI that runs `php artisan test`, `pnpm exec tsc --noEmit`, and `pnpm build` on every PR.

### 15.6 No browser end-to-end tests

The Phase 10 spec ends with a 15-step end-to-end smoke test. We've never automated it. Add a Playwright suite that:
1. Spins up a fresh tenant
2. Logs in as super_admin → creates clinic
3. Logs in as clinic_admin → builds form, adds secretary
4. Logs in as secretary → registers patient, books appointment
5. Logs in as doctor → starts consultation, fills form, prints prescription
6. Records payment
7. Edits form
8. Books second appointment
9. Verifies first visit history renders with old form snapshot

This is the proof that v1 actually works end-to-end.

### 15.7 Logging of sensitive fields

`AuditLogService` writes old/new values as JSON. For password-reset events (`staff.password_reset`) we log nothing sensitive, but for `clinic.updated` the `owner_email` is logged. That's fine for medical clinic admins (it's their own email) but if a staff edit ever logs `password_hash` we have a leak. Audit which `$model->only([...])` calls run through the log service and add a `$auditExclude = ['password', 'two_factor_secret', ...]` filter.

### 15.8 Database backup / restore documented

There's no documentation for backing up the central DB plus N tenant DBs. For a clinic SaaS this is critical. Write a runbook that uses `mysqldump --routines --triggers` per tenant and stores to S3.

---

## Phase 16 — Out-of-scope until v2 (kept here so we don't lose it)

These are explicit deferrals from various phase prompts. Listed here as a backlog index, not in priority order.

- **Stripe billing** (master spec). Add `Subscription::stripe_customer_id`, `stripe_subscription_id`, wire Cashier, build a billing portal under `app.einaya/billing`.
- **Twilio SMS** for appointment reminders + 2FA-by-SMS option.
- **Email** for receipts, prescriptions, password resets, ticket replies. Currently all stubbed.
- **S3 storage** swap-out from local disk. Stancl already supports a per-tenant prefix.
- **Patient portal** — read-only access for patients to their own appointments + records (separate guard, `web_patient`).
- **Multi-doctor per clinic UI**. Currently `staff.create` only allows `secretary`. Drop the lock once doctor/multiplexed scheduling is built.
- **ICD-10 diagnosis lookup** (Phase 10 prompt). Use the bundled CSV for now; consider an API later.
- **Lab results integration** (HL7 / FHIR).
- **Telemedicine** — video sessions via WebRTC.
- **Mobile app** (React Native) — share TS types via a workspace.
- **Advanced analytics** — cohort retention, no-show rates by hour, revenue by doctor.
- **PDF export** for receipts + prescriptions (browser print is v1).
- **Receipt + prescription QR code** for verification (e.g. `https://demo.einaya.test/verify/<receipt_number>`).
- **Branding override applied to the running tenant UI** — Phase 8 stores `branding.primary_color` but doesn't yet override the CSS variable. Wire it through Inertia share + a `<ClinicTheme />` component that mounts in `AppLayout`.
- **Form builder: conditional questions** — `validation_rules.conditions` JSON exists in schema since Phase 3; the UI never edits or evaluates them.
- **Form builder: import / export** to JSON for sharing forms between clinics.
- **Audit log retention** — central + tenant audit tables grow forever. Add a `central:prune-audit-logs` scheduled command that archives entries older than 2 years to cold storage.
- **2FA enforcement policy** — clinic admin can require all staff to enable 2FA. Currently per-user opt-in.
- **Session impersonation** — super admin "log in as clinic admin" for support. Phase 7 deferred this; needs a careful audit trail.
- **Webhooks** — let clinics subscribe to events (appointment.created, payment.recorded) for external EMR integrations.
- **Locale per-clinic default applied to login pages** — Phase 8 stores `localization.default_language` but the tenant login still uses i18next browser detection.
- **Receipt + Prescription text editor** — clinic-specific header/footer rich text, not just plain string.
- **Calendar: per-doctor view** (multi-doctor v2).
- **Recurring appointments** — every Tuesday for 6 weeks, etc.
- **Patient quick-view side panel** from Reception dashboard click — Phase 9 deferred this in favor of opening the full profile.
- **"Add walk-in" flow on Reception dashboard** opens registration modal but doesn't auto-book an appointment after creation. Manually intuitive, but slower.
- **Form auto-save** during consultation. Phase 10 explicitly chose not to (data-loss risk). Revisit if doctors complain.

---

## Notes on prioritization

If we have one week of polish budget, do **11.1, 11.3, 11.7, 11.11, 11.12, 11.13, 11.14, 12.1, 12.2** — those are the user-visible breakage and the most-requested UX wins. The rest is good to have but not urgent.

If we have a month, layer Phase 12 + the perf items (13.1, 13.2). After that, Phase 14 becomes the gating factor for any compliance-sensitive customer.

Phase 16 is product roadmap, not engineering polish — it lives here so it doesn't get lost when the master spec gets pruned.
