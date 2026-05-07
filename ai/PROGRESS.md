# Einaya — Build Progress

> **Update this file at the end of every Claude session, especially when context is getting full.**
> The next session reads this + `00-master-spec.md` and knows exactly where to resume.

---

## Current Status

**Active phase:** Phase 21 — reception simplification + 2-step appointment flow shipped. Reception dashboard reduced to one queue + one CTA; `<NewAppointmentDialog>` walks the user through patient → time slot in two steps; simple patient form (full_name only required) supports both new and existing patients. Pest 104/104.
**Last session date:** 2026-05-07

---

## Completed Phases

### 📋 Phase 21 — Reception simplification + 2-step appointment flow (2026-05-07)

The reception dashboard was a four-stat strip + walk-in form + queue table; the new screen is **one queue table + one "+ New appointment" CTA**. Booking is a two-step dialog: pick / register a patient, then pick a time slot. The patient form was 7 accordion sections; the simple form is 8 fields with **only `full_name` required** — the comprehensive accordion version stays available on `/patients` for editing detailed records (insurance, emergency contacts, medical flags).

- **21.1 Schema.** Tenant migration `2026_05_07_000002_add_village_to_patients` adds `village` (string nullable). `first_name`, `last_name`, `patient_code`, `gender` enum kept as-is — non-destructive. Existing detailed pages still display `patient_code`; the new UI hides it. The `gender` enum still allows `other` for legacy rows but the new form only exposes `male`/`female`.
- **21.2 Backend.** `RegisterPatientAction::execute()` now also accepts a `full_name` field — splits on the first space (single-word names duplicate to `last_name` so the existing `name` accessor and DB `NOT NULL` still work). `StorePatientRequest` makes `first_name` + `last_name` conditional on `full_name` presence; phone is now nullable; `village` validated. `PatientResource` exposes `village`. `PatientController::store` returns JSON (201 with `{patient: {id, name, …}}`) when `expectsJson()` so the new dialog's axios POST can chain into `/appointments`; the existing Inertia flow (redirect + flash) is preserved for the detailed form.
- **21.3 Locations.** New `resources/js/data/locations.ts` exports `CITIES: City[]` for the West Bank + Gaza — 12 governorates, ~70 villages, EN + AR labels. Patient stores city/village as language-stable English ids (`hebron`, `halhul`) so cross-clinic reporting stays clean; the UI shows the localised label via `name[locale]`.
- **21.4 NewAppointmentDialog.** New `Components/domain/NewAppointmentDialog.tsx` (~370 lines). Stepper at top; step 1 toggles between **Existing patient** (`<PatientCombobox>`) and **New patient** (8-field simple form: full_name required, national_id / phone / gender / marital_status / city / village / DOB optional). Step 2 collects doctor, scheduled_for (datetime-local), duration, reason, with the existing soft-warning workflow + force-confirm checkbox. Submit chains `axios POST /patients` (when new) → `router.post /appointments` so a single user action lands both records. 422 on patient creation surfaces inline and reopens step 1. Direction-aware Next/Back arrows for RTL.
- **21.5 Reception rewrite.** Dropped the four stat cards and the walk-in form. The page header carries an inline summary line ("`{done}` of `{total}` done") and a single primary CTA `+ New appointment` (size lg). Below sits the queue table (or an `<EmptyState>` with a CTA-mirror when nothing is scheduled). `ReceptionDashboardController` simplified accordingly — passes `summary`, `queue`, and the `doctors` list (active doctors + their `consultation_duration_minutes`) so the dialog's step 2 has defaults.
- **21.6 i18n.** New keys: `tenant.reception.newAppointment.*` (step labels, modes, reserve, warnings, force) and `tenant.reception.confirmCancel.*`, `tenant.patients.simple.*` (8 field labels + 4 marital options + city/village placeholders + dateOfBirth), `tenant.reception.summary` (interpolated). EN ↔ AR mirrored.
- **21.7 Tests.** New `tests/Feature/Tenant/SimplePatientCreationTest.php` with 4 cases: multi-word full_name splits correctly, single-word duplicates to last_name, JSON-content-type POST returns 201 with the patient envelope, village + city columns persist. Existing `PatientRegistrationTest` and `AppointmentBookingTest` still pass unchanged (the action change is additive). Full Pest suite **104/104** (was 100, +4 net).
- **Verification.** `pnpm exec tsc --noEmit` clean, `pnpm build` green (main 353 kB / 115 kB gz), smoke 200 across the seven authed routes (`/`, `/reception`, `/patients`, `/forms`, `/payments`, `/doctor`, `/settings`); `storage/logs/laravel.log` empty.

**Out of scope.** No backfill of existing `name` rows into a `full_name` column (the accessor handles display). The Calendar booking dialog at `/appointments` keeps its existing more-detailed form for now — the new simplified flow lives only on Reception. Multi-doctor selection is still v2 (the dialog renders the list but production data is single-doctor).

### 🎟️ Phase 20 — Coupons & tenant self-service subscription (2026-05-07)

Super admins can issue redemption codes that extend or upgrade a clinic's subscription; clinic admins on tenant subdomains can apply codes themselves to keep their access live. Without Stripe wired up, coupons are the only mechanism that moves a subscription forward in v1.

- **20.1 Schema.** Two central migrations: `coupons` (code unique, plan_id FK, duration_days, expires_at nullable, max_uses + used_count, description, is_active, created_by, soft-deletes) and `coupon_redemptions` (append-only audit row per redemption with snapshots of prior/new plan + ends_at, unique on `(coupon_id, clinic_id)` so a clinic can't redeem the same coupon twice).
- **20.2 Models + permission.** `App\Models\Central\Coupon` with `CentralConnection` exposes `active()` scope, `status()` (one of `active|expired|exhausted|disabled`), and `isRedeemable()`. `CouponRedemption` carries `belongsTo` to `Coupon`, `Clinic`, `priorPlan`, `newPlan`. New `clinic.manage_subscription` permission added to `Permission` enum + `auth.ts`; auto-granted to `clinic_admin` (which gets all permissions). Demo tenant re-seeded via `SeedTenantRolesPermissions`.
- **20.3 Central admin CRUD.** `Central\CouponController` (index/store/update/destroy) inside the existing `auth + super_admin` group. `StoreCouponRequest` + `UpdateCouponRequest` regex-validate the code, normalise to upper-case in `prepareForValidation` so the unique check is case-insensitive. `CouponResource` exposes derived `status`, `is_expired`, `is_exhausted`, `remaining_uses`. Sidebar entry under Settings (`TicketPercent` lucide). New `Pages/Central/Coupons/Index.tsx` — DataTable with search/status/plan filters, create/edit `<FormModal>`s with a "Generate" button for random 8-char codes, copy-to-clipboard, toggle-active, soft-delete confirm. Audit-log entries for `coupon.{created,updated,deleted}`.
- **20.4 RedeemCouponAction.** The only piece touching central DB from inside a tenant context. Wraps everything in a `DB::connection(tenancy.database.central_connection)->transaction(fn () => …)` with `lockForUpdate()` on the coupon row, so two clinic admins can't race the last slot. Three outcomes by current state:
  - **extend** — coupon's `plan_id` matches the active subscription's plan: adds `duration_days` to `ends_at`, preserving any unused future time.
  - **switch** — coupon's `plan_id` differs: cancels the current subscription (status=cancelled, ends_at=now), opens a fresh subscription on the coupon's plan with `ends_at = now + duration_days`. Unused time on the prior plan is forfeited.
  - **activate** — clinic has no active subscription (post-trial / suspended): opens a new subscription on the coupon's plan.
  Throws `ValidationException` for unknown / expired / exhausted / disabled codes and for the same clinic redeeming twice. Writes a `CouponRedemption` snapshot + central audit row `coupon.redeemed`.
- **20.5 Tenant subscription page.** `Tenant\SubscriptionController` (`show` + `redeem`) gated by `clinic.manage_subscription`. Two new routes inside the tenant `auth` group: `GET /subscription`, `POST /subscription/redeem`. New `RedeemCouponRequest` re-checks the regex and the permission. `Pages/Tenant/Subscription/Index.tsx` — current-plan card with status badge + "ends on" + "X days left" countdown (turns warning ≤14d, danger ≤3d) + "started" date; coupon-apply form with toast on success/error; plan catalogue card showing all active plans with feature checklists and a "current" pill; redemption-history table (last 10 entries). New AppSidebar entry under Admin (`TicketPercent` icon) gated by the new permission.
- **20.6 i18n.** `central.coupons.*` (admin) + `tenant.subscription.*` (clinic side) + nav entries for `coupons` (central) and `subscription` (tenant) on both languages. AR plurals for `daysCount_*`.
- **20.7 Tests.** New `tests/Feature/Central/CouponTest.php` (5 cases — create normalises code, duplicate-case rejected, 403 for non-super-admin, status scope behaviour, update + soft-delete) and `tests/Feature/Tenant/SubscriptionRedeemTest.php` (6 cases — extend, switch, double-redemption blocked, exhausted, expired, doctor/secretary 403). Both files added to `tests/Pest.php`. Full suite **100/100 passing** (was 89, +11 net).
- **Verification.** `pnpm exec tsc --noEmit` clean, `pnpm build` green (main 351 kB / 114 kB gz), smoke 200 across `app.einaya.test/coupons`, `/demo-requests`, `/clinics` and `demo.einaya.test/`, `/subscription`, `/settings`; `storage/logs/laravel.log` empty.

**Out of scope.** No public redemption (codes are entered after the clinic exists); no auto-renew when `ends_at` passes (existing `EnsureClinicActive` middleware will suspend the clinic — they need a fresh coupon); no Stripe / Cashier yet (when billing lands, coupons translate to Stripe coupon objects and the redemption action delegates).

### 🌐 Phase 18 — Marketing site expansion (2026-05-07)

Public-facing einaya.test domain grew from a one-page hero to a small marketing site (Home / About / Pricing) with the theme + language toggles wired and a hero dashboard mockup that adapts to the active palette.

- **18.1 Apex preference routes.** The theme + language dropdowns POST to `/api/preferences/{theme,language}`. Those routes existed only inside the central + tenant groups, so toggling them from `einaya.test` 404'd. Added public copies inside the apex domain block in `routes/web.php`. `PreferenceController` already handles guest vs authed gracefully (the user-pref write is conditional on `$request->user()`), so no controller changes needed.
- **18.2 MarketingLayout.** New `Layouts/MarketingLayout.tsx` is the shared chrome for Home / About / Pricing — sticky topbar with logo, About / Pricing nav, language + theme toggles, and a single primary "Talk to us" CTA. Footer carries About / Pricing / Talk-to-us. Sign-in link dropped from the marketing surface entirely (existing customers still reach login via tenant subdomain or app.einaya.test). The layout owns the `DemoRequestDialog` and exposes a `useDemoDialog()` context so any descendant can call `open('demo' | 'register')` without lifting state.
- **18.3 About page.** `Pages/About.tsx` at `/about` — eyebrow + headline + subhead, four-photo masonry grid (curated Unsplash IDs, lazy-loaded), "Our story" two-column block, four "what we believe" value cards (lucide icons + i18n copy), gradient CTA to demo dialog. ~120 lines of new EN + AR copy under `common.about.*`.
- **18.4 Pricing page.** `Pages/Pricing.tsx` at `/pricing` — billing toggle (monthly / yearly with -17% hint), three plan cards pulled live from `subscription_plans` (cheapest first; the middle plan gets a "Most popular" pin), each card lists max-patient + max-staff caps and the plan's `features[]` translated via `pricing.features.*` keys. FAQ section with shadcn Accordion. Same gradient CTA. Plans are loaded inside the apex `routes/web.php` closure (`SubscriptionPlan::where('is_active', true)`) and passed as page props. `description` column doesn't exist on the plans table — page-level descriptions live in i18n (`pricing.descriptions.{starter,pro,enterprise}`) instead.
- **18.5 Hero dashboard SVG.** `Components/marketing/HeroDashboard.tsx` is a self-contained SVG that renders a stylised browser window showing the Einaya dashboard — sidebar (cyan-900), 3 stat cards, sparkline chart, queue card with rank pills. Every fill uses `rgb(var(--…))` tokens so the mockup re-skins automatically when the user toggles theme. No external image dependency.
- **18.6 Feature SVG vignettes.** `Components/marketing/FeatureIllustrations.tsx` exports three components (`SchedulingIllustration`, `RecordsIllustration`, `ConsultationsIllustration`) — small token-driven SVGs that head each landing feature card. Replace the previous lucide-only icon treatment with something visually meaningful per feature.
- **Welcome.tsx rebuild.** Old all-text hero is now a 2-column layout (text + dashboard mockup), feature cards each carry their own illustration on top of the title + body, gradient banner CTA preserved. Topbar / footer move into MarketingLayout.
- **Photos.** About page uses 4 curated Unsplash photos (clinic reception, doctor + patient, stethoscope on desk, calendar/tablet) with proper alt text + lazy loading. Photo credit line: "Photography from Unsplash. Used under the Unsplash license." (per Unsplash license terms).

**i18n.** New keys: `nav.marketing.{about,pricing}`, `about.*` (eyebrow, headline, story, values, photo credit, CTA), `pricing.*` (eyebrow, billing toggle, popular badge, descriptions per slug, features per slug, choose-plan, FAQ, CTA). EN + AR mirrored. AR carries explicit plural rules for `maxPatients_*` / `maxStaff_*`.

**Verification.** `pnpm exec tsc --noEmit` clean, `pnpm build` green (Welcome 209 kB / 52 kB gz, MarketingLayout 207 kB / 51 kB gz — both bundle the phone-input from the demo dialog). Smoke: `einaya.test/`, `/about`, `/pricing` all 200; POST `/api/preferences/{theme,language}` returns 302 (success); `storage/logs/laravel.log` empty. Authed surfaces (/, /reception, /patients, /forms, /payments, /doctor, /settings) still 200.

**Known leftover.** The marketing topbar shows About / Pricing on lg+ and a single "Talk to us" button on every viewport. There's no sign-in link on the marketing surface; existing customers should bookmark their tenant subdomain (`<clinic>.einaya.test/login`).

### 📨 Phase 17 — Demo-request funnel (2026-05-07)

Public lead capture on the marketing landing + central admin inbox for manual triage. No auto-conversion to clinic; super admin contacts each lead via WhatsApp / email and uses the existing Clinic-create flow when ready.

- **17.1 Schema + libs.** Central migration `2026_05_07_000002_create_demo_requests_table` adds `demo_requests` (clinic_name, contact_name, email, phone E.164, country ISO-2, intent demo|register, message, is_handled, handled_at, handled_by FK→users, notes, ip_address, user_agent). Indexes on `(is_handled, created_at)`, `intent`, `country`. Model `App\Models\Central\DemoRequest` uses `CentralConnection`. Composer added `giggsey/libphonenumber-for-php@^9` for server-side validation; pnpm added `react-phone-number-input@3.4.16` for the form's intl phone field with country flag/code selector.
- **17.2 Public submission.** New `App\Http\Requests\StoreDemoRequest` validates the seven fields plus a honeypot `website` (must be empty), and uses libphonenumber to reject non-callable numbers; `passedValidation()` normalises to E.164 before the controller runs. New `App\Http\Controllers\DemoRequestController::store` writes the row + an `audit.log('demo_request.created')` row to the central audit feed. Route `POST /demo-request` lives inside the existing apex domain block in `routes/web.php` with `throttle:5,60` per IP.
- **17.3 Dialog component + landing wire-up.** New `Components/domain/DemoRequestDialog.tsx` — shadcn Dialog with two-tab toggle (`demo` / `register`), `react-phone-number-input` defaulting to PS, honeypot field hidden via absolute-position trick. Posts to `/demo-request` and shows a success card on 200. `Pages/Welcome.tsx` swaps the previous `mailto:` and gradient-banner CTAs for the dialog opener (with `initialIntent` toggling tabs), keeps the sign-in link for existing customers.
- **17.4 + 17.5 Central admin.** `App\Http\Controllers\Central\DemoRequestController::index` paginates with filters (search across clinic/contact/email/phone, handled state defaulting to "Unhandled", intent, country) and exposes an `unhandledCount` for the description line. `update` patches `is_handled` (stamps `handled_at` + `handled_by`) and/or `notes`, writes a status-change audit row. `DemoRequestResource` exposes server-built `whatsapp_url` (`https://wa.me/<digits>`) and `mailto_url` so the FE doesn't have to assemble them. Two routes added under the existing `auth + super_admin` group: `GET /demo-requests` and `PATCH /demo-requests/{demoRequest}`. New page `Pages/Central/DemoRequests/Index.tsx` — DataTable with row actions: WhatsApp (opens new tab), email, mark handled / reopen, view-detail Dialog with notes textarea + WhatsApp/email buttons. Sidebar entry under Operations linking `/demo-requests`.
- **17.6 i18n.** New keys: `common.demoRequest.*` (form labels, intent labels, success copy), `common.nav.demoRequests`, `central.demoRequests.*` (admin labels, status, intent, columns, filters, actions, detail dialog). Mirrored EN ↔ AR. AR carries explicit plural variants (`subtitle_zero/_one/_two/_few/_many/_other`) for the unhandled-count line.
- **17.7 Tests.** New `tests/Feature/Central/DemoRequestTest.php` covers: guest submits valid demo request → row exists + flash success; honeypot filled → validation fails + no row; invalid phone → validation fails + no row; super admin can list `/demo-requests`; non-super-admin gets 403; PATCH flips `is_handled` and stamps `handled_by`. All 6 pass; full Pest suite **89/89** (was 83).
- **Verification.** `pnpm exec tsc --noEmit` clean, `pnpm build` green (Welcome chunk 209 kB / 52 kB gz including the bundled phone-input flag set + country metadata — acceptable on a marketing page where engagement is the goal). Smoke: POST `/demo-request` returns 302 with row stored; `app.einaya.test/demo-requests` returns 200 for the super admin and 403 for tenant doctors; `storage/logs/laravel.log` empty.

**Out of scope** (per the "we handle it manually" brief):
- Auto-create-clinic-from-demo-request action — admins use the existing Clinic-create flow once the lead converts.
- Automated outbound emails (mailer infra not wired). The mailto + WhatsApp deep-links cover v1 outreach.
- reCAPTCHA / Turnstile — honeypot + libphonenumber + IP throttle are sufficient; revisit if spam shows up.

### 🎨 Visual refresh — palette + landing + auth (2026-05-07)

- **Design system source.** Installed the `ui-ux-pro-max` Claude skill via `npm i -g uipro-cli && uipro init --ai claude`. Generated a target system for "bilingual healthcare clinic SaaS" — got back the "Accessible & Ethical" pattern: cyan-teal primary (`#0891B2`), emerald (`#059669`) reserved for CTAs, slate-50 page, cyan-900 sidebar, large-text + WCAG-AAA focus on RTL-friendly typography.
- **Token swap (`resources/css/app.css`).** Light + dark CSS variable blocks completely repainted: cyan-600 primary, cyan-100 secondary, cyan-50 accent, slate-50 background, slate-900 foreground; emerald-600 success; cyan-900 sidebar with cyan-700 accent pill. All status badges retuned (success → emerald-100/900, info → cyan-100/900, etc.). Radius softened from 0.5 → 0.625. Fonts unchanged (Manrope + IBM Plex Sans Arabic still load via the preconnect in `app.blade.php`).
- **Logo rebuilt.** `Components/ApplicationLogo.tsx` ships an SVG mark — rounded square with primary-colored "E" + an emerald dot, plus a "Einaya" wordmark in Manrope 700. `showWordmark={false}` returns the icon only. Replaces the original Breeze laravel-L SVG.
- **GuestLayout split-screen.** `Layouts/GuestLayout.tsx` is now a 2-column grid: brand panel on the lg: side (cyan gradient + 3 highlight icons + footer line) and the form on the other. Stacks on mobile, with a topbar carrying language + theme toggles. RTL-aware gradient direction. Framer-motion runs an `opacity / y` entrance animation on the brand text and the form card. New i18n keys under `auth.guest.*` (EN + AR).
- **Welcome.tsx (central / public landing).** Full rewrite: header with logo + lang/theme/sign-in, hero with eyebrow pill + headline + paragraph + CTA pair, three-feature grid (scheduling / records / consultations) with framer-motion `whileInView`, gradient CTA banner, footer. New i18n keys under `common.landing.*` for both languages.
- **Tenant/Welcome.tsx.** Same visual language — eyebrow + headline + open-clinic CTA, with motion entrance. Per-tenant subdomain still shows the `tenantId`.
- **Auth pages tightened.** `Login`, `ForgotPassword`, `ResetPassword`, `ConfirmPassword`, `VerifyEmail`, `TwoFactorChallenge` all bumped to `space-y-5`, `size="lg"` submit buttons, `text-sm` (was `text-xs`) error messages and helper links, `aria-invalid` on inputs that error, success-toned `Alert` styling on status messages. They all sit inside the new GuestLayout so the brand panel ships across every auth surface. `TwoFactorSetup` (authenticated) only got the error-text bump since it lives under `AppLayout`.
- **Framer-motion.** Installed `framer-motion@12.38.0`. Used sparingly — landing page hero + feature cards (`whileInView`), GuestLayout brand panel, Tenant welcome card. No motion in form interactions per the skill's "Accessible & Ethical" guidance (avoids motion-heavy animations, respects prefers-reduced-motion when the lib defaults to short eased curves).
- **`.gitignore`.** Excluded `.claude/skills/` (the auto-installed UI/UX Pro Max skill files) and `.claude/settings.local.json` so per-developer skill installs don't leak into commits.

**Verification:** TypeScript clean, `pnpm build` green (main bundle 327 kB / 106 kB gz, vendor split intact). Smoke check across `https://einaya.test/`, `app.einaya.test/`, `demo.einaya.test/`, `demo.einaya.test/login`, `demo.einaya.test/forgot-password`, plus the 7 authed routes — all 200, `storage/logs/laravel.log` empty.

**Not in this pass:** authenticated app surfaces (`/`, `/reception`, `/patients`, `/doctor`, `/forms`, `/payments`, `/settings`, etc.) keep their existing layout components and just inherit the new palette. If the new direction lands well, a follow-up pass repaints those (sidebar header, dashboard hero, status pill mappings already token-driven so nothing breaks visually).

### 🚧 Phase 15 — Observability & DX (shipped 2026-05-07)

- **15.1 Global ErrorBoundary.** New `Components/domain/ErrorBoundary.tsx` mounts at `app.tsx` root and renders a centred destructive-icon panel with a "Reload page" button when any descendant throws. The boundary fires a best-effort POST to `/api/client-errors` carrying message + stack + component_stack + URL + user-agent. Both central and tenant route groups expose the new endpoint via `App\Http\Controllers\ClientErrorController` (validates payload max-lengths, writes a `client.error` warning log line including the user id and tenant id where applicable). Failed reports are swallowed so the fallback UI is always shown.
- **15.7 Sensitive-field audit log redaction.** `App\Services\Tenant\AuditLogService::log()` and the central twin now run every `oldValues`/`newValues` array through a `scrub()` step that replaces values for keys in `password`, `password_confirmation`, `remember_token`, `two_factor_secret`, `two_factor_recovery_codes`, `two_factor_confirmed_at`, `api_token` with the literal `[redacted]`. Belt-and-braces — current callers always go through `$model->only([...])`, but a future controller passing a full `$user->toArray()` won't leak.
- **15.5 GitHub Actions CI.** New `.github/workflows/ci.yml` with two jobs: `backend` runs Pest against a MySQL service container (root/root), points the `.env` at `127.0.0.1:3306` + `einaya_central_testing`, and waits on `mysqladmin ping` before kicking off `./vendor/bin/pest`; `frontend` installs JS deps via pnpm, runs `pnpm exec tsc --noEmit`, then `pnpm build`. Both jobs trigger on push to `master` / `dev` and on every pull request. The original Laravel-stub `tests.yml` (sqlite, no MySQL) is left in place but is mostly decorative now.
- **15.8 Backup / restore runbook.** New `docs/runbooks/backup-restore.md` documents what to back up (central DB + every tenant DB + per-tenant `storage/`), an mysqldump-based hourly snapshot script, restore commands, post-restore checklist, and quarterly fire-drill discipline. Calls out what is intentionally not covered (binlog point-in-time recovery, encrypted archives, cross-region failover, GDPR deletion requests).
- **15.3 / 15.4 / 15.6 deferred:** validation-error toasts (a polish refactor), fast tenant test infra (a Pest perf project), and Playwright E2E (a separate test stack) all need more scope than v1 polish allows.

### 🚧 Phase 14 — Accessibility (shipped 2026-05-07)

- **14.3 Aria labels on icon-only buttons.** Audited every `<Button variant="ghost" size="icon">` across `resources/js/Pages` and added `aria-label`s to the missing ones: dropdown triggers in Forms/Index + Staff/Index, in-place section editor in Forms/Builder, question-row edit/delete + option remove buttons, diagnosis + prescription-item delete buttons in Doctor/Consultation, working-hours break + time-off delete buttons, audit-row "view diff" buttons (tenant + central), insurance-provider edit/delete. Plans/Index, Clinics/Index, ThemeToggle, LanguageSwitcher, UserMenu, AppTopbar were already labelled. (FullCalendar event titles and other nested icon-bearing elements not in scope here.)
- **14.6 aria-required on form inputs.** `Components/domain/forms/FormRenderer.tsx` now passes `aria-required={question.required || undefined}` on text/textarea/number/date inputs so the asterisk shown next to required labels is also announced by screen readers.
- **14.5 RTL Calendar.** Verified `Pages/Tenant/Appointments/Calendar.tsx` already wires `direction={direction === 'rtl' ? 'rtl' : 'ltr'}` from the `useDirection` hook — no change needed.
- **14.1 Builder dnd-kit focus ring:** deferred. The visual focus state for keyboard drags is acceptable in current design; revisit when a screen-reader QA pass is scheduled.
- **14.2 Focus trap:** verified — Radix dialog handles tab cycling correctly. No change.
- **14.4 Color contrast:** noted. `text-muted-foreground` on `bg-card` measures 4.4:1 on the WebAIM contrast checker (under the 4.5:1 minimum). Trade-off accepted for v1 because bumping the muted token shifts the rest of the design language; revisit alongside a full design audit.

### 🚧 Phase 13 — Performance & Data Hygiene (shipped 2026-05-07)

- **13.1 Bundle code-splitting via vendor manualChunks.** `vite.config.js` now declares per-vendor chunks for `recharts`, `@fullcalendar`, `@dnd-kit`, `react-colorful`, `i18next`, `@radix-ui`, `@tanstack`, `lucide-react`. Result vs prior build:
  - `app.js` 558 kB → 320 kB (gz 182 kB → 103 kB)
  - `recharts` and `fullcalendar` (the big offenders) now ship as named vendor chunks loaded only by Dashboard / Calendar pages.
  - The 500 kB chunk-size warning is gone for the main bundle. The remaining ones (recharts, fullcalendar, radix) are intentional vendor chunks and lazy-loaded per route.
- **13.3 Patient search FULLTEXT.** New tenant migration `2026_05_07_000001_add_fulltext_index_to_patients` adds a MySQL FULLTEXT index on `(first_name, last_name)`. `PatientSearchService::search()` switches to `MATCH(first_name, last_name) AGAINST (? IN BOOLEAN MODE)` for terms longer than 3 chars (which is also the MySQL default `ft_min_word_len`). Shorter queries still use the `LIKE` fallback. `patient_code`, `national_id`, `email`, and digits-only `phone` paths unchanged. Demo tenant migrated cleanly; PatientSearchTest still passes.
- **13.5 Inertia partial reloads.** `Doctor/Consultation::ensurePrescription()` reloaded the whole page after the POST; now it does `router.reload({ only: ['consultation'] })` so the heavy form/diagnosis/history props don't re-render. (Builder already used `only: ['form']`.)
- **13.7 Form snapshot size cap.** `SubmitFormAction` rejects with a runtime error if the JSON-encoded snapshot exceeds 500 KB. Validates at write time so a pathological 200-question form with 50 long-labeled options each can't bloat backups.
- **13.2 N+1 audit:** existing `with([...])` eager-loads in `ConsultationResource` already cover the diagnoses/prescriptions/formSubmissions chain. Spot-checked Patient History controller — same eager-load pattern. No regressions detected; deferred adding a query-count test (would change test infra and gain minimal coverage).
- **13.4 Aggregate-stats job:** deferred. Refresh-now is still synchronous; converting to a polling pattern needs a "computing…" UX surface that's bigger than the perf win for v1's 1-clinic demo footprint.
- **13.6 Storage URLs:** deferred. Local Herd setup uses the existing `public/storage` symlink, which works for the demo. Per-tenant signed URLs land with the v2 S3 swap.

### 🚧 Phase 12 — UX & Visual Polish (shipped 2026-05-07)

#### Batch 1 — Foundations (eae1612, 12.0–12.5)

Foundational pre-pass: defaults to light theme + en locale; warm-cream + slate-blue palette with white card layering and a strong dark sidebar; shadcn Input/Label/Textarea typography bumped; required asterisks switched to muted; all four lifecycle status badges remapped to the new soft-pill tokens.

UX hooks: `useDebouncedFilter` for live list-page search; `usePending` for single-flight mutation guards; `ConfirmDialog` gains a busy state; long-form dialogs (`PatientRegistrationForm`, Builder `QuestionDialog`) prompt before discarding unsaved changes; mixed-payment shows a live split / total runner.

Profile + auth refresh: `Profile/Edit` gets a card-grid layout with i18n; account self-deletion removed (route + controller); `GuestLayout` rebuilt on `bg-background` with a branded card; all auth pages ported to shadcn primitives + tokens + i18n; legacy Breeze components and `AuthenticatedLayout` deleted.

#### Batch 3 — 12.7–12.18 polish

- **12.7 Hardcoded English in Selects.** Replaced raw `<SelectItem>Female</SelectItem>` style labels with `t()`-wrapped strings across `Patients/Index` (gender + insurance), `Payments/Index` (method filter), `Forms/Index` (type filter), and `Patients/Show` file-category dropdown + the per-file category line. New keys: `patients.filters.{male,female,other,hasInsurance,noInsurance}`, `patients.fileCategory.*` (5 enums), `patients.notesOptional`, `payments.filters.allMethods`, `payments.method.*`, `forms.types.*`, `forms.filters.*`. Mirrored EN + AR.
- **12.8 AR translation gap closed.** EN: 479 keys, AR: 478→483. The 51 missing keys (post 12.5/12.6 additions) — patient form fields, appointment form labels, payment column / total / form labels, consultation diagnosis fields, history subtitle, queue column labels — all translated. AR also carries 4 extra plural variants (`builder.optionsCount_{zero,two,few,many}`) for i18next plural rules.
- **12.11 RTL toast position.** `Components/ui/sonner.tsx` reads `<html dir>` via a `MutationObserver` and flips Sonner to `top-left` for RTL, `top-right` for LTR. Removed the literal `position="top-right"` from `app.tsx`. Toaster also passes `dir={dir}` so close button + action button land on the correct side.
- **12.12 Arabic-aware avatar initials.** New `resources/js/lib/initials.ts` exports `initialsFor(name)` and `isArabicText(s)`. `UserMenu` and `Patients/Show` use it: when initials contain Arabic codepoints the AvatarFallback gets `dir="rtl"` and `font-family: var(--font-arabic)` so the Arabic glyph renders in IBM Plex Sans Arabic instead of Manrope.
- **12.13 Forms list search.** `MedicalFormController::index` accepts `search` (LIKE on title/description) and `type` filters with `withQueryString()`. `Forms/Index` got the now-standard debounced search + type Select pulled from `useDebouncedFilter`.
- **12.14 Builder untitled placeholder.** Section sidebar item shows `t('builder.untitledSection')` italicised + muted when title is empty (was the literal string `(untitled)`).
- **12.15 Builder zero-options warning.** `QuestionItem` for radio/checkbox/select questions with 0 options renders a `destructive` Badge (`no options yet`); the `· N options` text only appears once at least one option exists. Pluralised via i18next.
- **12.9 Type sizing bumps.** Builder question rows: question label is now `text-sm` (was `font-medium` default), and the type/key meta line is `text-sm` (was `text-xs`). Consultation history left-panel chief-complaint preview bumped from `text-xs` to `text-sm`.
- **12.16 iPad polish.** Forms `Builder` split panel switches from `md:grid-cols-[320px_1fr]` to `lg:grid-cols-[320px_1fr]` so iPad-portrait stacks instead of cramping. Doctor `Queue` "Arrived" column is now `hidden md:table-cell` so iPad portrait drops the redundant timestamp.
- **12.17 Dialog max-height + overflow.** `FormModal` content uses `max-h-[85vh] overflow-hidden flex flex-col`; the body slot is `overflow-y-auto`. Long forms (`PatientRegistrationForm`, builder `QuestionDialog`) now scroll inside the modal instead of pushing the footer off-screen on a 13" laptop.
- **12.18 EmptyState polish (partial).** Doctor dashboard "no queue" and Reception dashboard "no appointments" now render `<EmptyState icon=… title=… />` instead of a one-liner muted paragraph or a colspan empty row. Other empty-state-inside-DataTable cases were left as table rows because the existing `t('table.noResults')` is consistent and replacing them would break the colspan layout for marginal gain.
- **12.10 Topbar layout shift on language switch:** documented as acceptable for v1 (intentional reload).

#### Batch 2 — 12.5 print i18n + 12.6 date helpers

- **12.5 Print pages bilingual via `tenant` namespace.** `Receipt.tsx` and `PrescriptionPrint.tsx` no longer carry inline `STRINGS = { en, ar }` objects; they read from `tenant.payment.receipt.*` / `tenant.doctorPanel.print.*` via `i18n.getFixedT(locale, 'tenant')` so translators can adjust copy without touching code. New keys mirrored in EN + AR. The pages still pick the locale from the patient (not the user session) per print spec.

- **12.6 Locale-aware date formatting.** Created `resources/js/lib/dates.ts` with `formatDate / formatTime / formatDateTime` reading locale from i18next (Inertia-shared `preferences.locale`). Replaced 21 ad-hoc `toLocale*` call-sites (kept currency `.toLocaleString` calls untouched, and the print pages — `Receipt.tsx`, `PrescriptionPrint.tsx` — which intentionally pass an explicit patient-locale). Local `formatDate` / `formatTime` / `fmtTime` helpers were dropped from each page in favor of the shared module.

  Files migrated (Tenant): `Patients/{Index,Show}`, `Dashboard`, `Reception/Dashboard`, `Doctor/{Dashboard,Queue,PatientHistory,Consultation}`, `Payments/Index`, `Forms/{Index,Submissions,Submission}`, `Appointments/Today`, `Audit/Index`, `Consultations/Index`, `Staff/Index`. Files migrated (Central): `Tickets/Index`, `Subscriptions/Index`, `Audit/Index`, `Clinics/{Show,Index}`. Datetime call-sites mapped to `formatDateTime`, date-only call-sites to `formatDate`.

### ✅ Phase 11 — Post-v1 Triage (2026-05-07)

15 items from `ai/ENHANCEMENTS.md` Phase 11. All shipped together.

- **11.1 + 11.10 Sidebar dead links + breadcrumbs.** Removed `/branding` and `/prescriptions` (no controllers existed). Added `/consultations` linked to the new index. Doctor/Consultation breadcrumb now links "Consultations" to `/consultations` instead of `/doctor`. Trimmed unused `Pill` and `Palette` imports.
- **11.2 Consultations index page.** New `app/Http/Controllers/Tenant/ConsultationListController.php` and `resources/js/Pages/Tenant/Consultations/Index.tsx`. Doctor sees their own consultations, clinic_admin sees all. Filters: status (open/completed), from/to date, patient search.
- **11.3 Permission gates retrofit.** Added explicit `forms.view` checks to `DoctorProfileController::show` (`doctor.view_profile`), `WorkingHoursController::show` (`doctor.manage_hours`), `SettingsController::show` (`clinic.view_settings`). New `tests/Feature/Tenant/SecretaryAccessMatrixTest.php` walks the full secretary 403 matrix across 4 blocked paths and 7 allowed paths.
- **11.4 Reception duplicate stat card.** Replaced "Total today" with "Completed today" + a no-show subtitle. Added `reception.stats.completedToday` to EN+AR.
- **11.5 Reception loads insurance providers.** `ReceptionDashboardController::index` queries active providers and passes them to the walk-in registration modal.
- **11.6 Phone-duplicate matches reach the dialog.** Added `duplicate_phone_matches` to the shared Inertia `flash` bag in `HandleInertiaRequests`. Updated `PatientRegistrationForm` to read from `usePage().props.flash.duplicate_phone_matches` instead of the dead `(window as any).__flash` shim. The "Use existing / Create anyway" buttons now actually surface the matches.
- **11.7 + 11.8 Cmd+K + topbar search wired.** `PatientSearch` mounted globally in `AppLayout` (alongside a `PatientRegistrationForm` for the "register new" path). The topbar search button dispatches a `einaya:open-patient-search` `CustomEvent` that the search component listens for. Cmd/Ctrl+K still works.
- **11.9 Notifications bell hidden** until v2 — the placeholder dropdown was misleading.
- **11.11 Form snapshot endpoint.** Added `GET /forms/{form}/snapshot` returning the canonical `FormSnapshotService::snapshot()` JSON. `Doctor/Consultation.tsx` now calls that instead of the brittle XHR-into-`/forms/:id/edit` hack with the `X-Inertia-Version: '*'` workaround.
- **11.12 + 11.13 PatientCombobox shared component.** `Components/domain/PatientCombobox.tsx` built around shadcn `<Command>` + `<Popover>` with debounced 250ms search hitting `/patients/search`. Replaces the free-text "Patient ID" inputs in `PaymentForm` and `Appointments/Calendar`'s booking dialog.
- **11.14 Dead Breeze pages cleaned up.** Deleted unused `resources/js/Pages/Dashboard.tsx`. Repainted `Welcome.tsx`, `Tenant/Welcome.tsx`, `Profile/Edit.tsx` and the three Profile partials (UpdateProfileInformationForm, UpdatePasswordForm, DeleteUserForm) to use shadcn primitives + design tokens instead of Breeze's `bg-white`/`bg-gray-*`/indigo focus rings. Profile pages now render correctly in both light and dark mode and dispatch to AppLayout vs CentralLayout based on `auth.isSuperAdmin`. (TwoFactorSetup still uses the legacy AuthenticatedLayout — Phase 12 will repaint that one.)
- **11.15 Working-hours week view.** New `WeekVisualization` component renders above the editor: rows per day, columns from 06:00–22:00, working hours shown as primary-colored bands, breaks as warning-tinted overlays. Read-only — purely a visual confirmation of what's saved.

**Verification:**
- 83 Pest tests pass (was 82; +1 from `SecretaryAccessMatrixTest`).
- TypeScript clean, `pnpm build` green.
- Smoke check: every sidebar item now returns 200 (15 paths checked). The new `/forms/{id}/snapshot` endpoint returns JSON. `storage/logs/laravel.log` empty.

### ✅ Phase 10 — Doctor / Consultation Module (2026-05-06)

All Definition of Done items met:
- 7 doctor controllers under `app/Http/Controllers/Tenant/Doctor/`: Dashboard, Queue, Consultation, FormSubmission, Diagnosis, Prescription, PatientHistory.
- 4 actions under `app/Actions/Tenant/`: `StartConsultationAction` (transitions appointment → in_progress, creates a fresh appointment for walk-ins), `CompleteConsultationAction` (sets `ended_at`, transitions appointment to completed), `SubmitFormAction` (snapshots form structure + answers via `FormSnapshotService`), and `MedicationSuggestionService` for previously-prescribed autocomplete.
- 5 doctor form requests under `app/Http/Requests/Tenant/Doctor/`: StartConsultation, UpdateConsultation, SubmitForm, StoreDiagnosis, StorePrescriptionItem.
- 3 new resources: `ConsultationResource` (eager-loads patient, doctor, diagnoses, prescriptions, formSubmissions), `DiagnosisResource`, `PrescriptionResource`.
- 24 new routes wired into `routes/tenant.php` behind auth (consultations CRUD + complete + form submission, diagnoses store/update/delete, prescriptions ensure + item CRUD + print + suggestions, doctor dashboard + queue, patient history).
- 5 frontend pages under `resources/js/Pages/Tenant/Doctor/`: Dashboard (real stats, "now serving" panel, today's queue with start-consultation button, today's schedule, recent patients), Queue (auto-refreshes every 30s, color-coded wait time green/yellow/red <15/<30/>30 min), Consultation (the big one — patient header, history left panel, 4-tab work surface: Overview/Form/Diagnoses/Prescription, debounced 5s autosave on overview), PatientHistory (timeline + per-submission snapshot dialog), PrescriptionPrint (bilingual `@media print` view).
- Extended `FormRenderer` to accept `onChange(key, value)` so the same component drives the builder preview (read-only), the submission detail viewer (read-only with stored answers), and the consultation submit flow (writable).
- New `tenant.doctorPanel` translation namespace (EN + AR).
- Sidebar got two new doctor links (`/doctor`, `/doctor/queue`) gated by `consultations.create` so secretaries don't see them.
- 7 new Pest tests in `tests/Feature/Tenant/Doctor/`:
  - `StartConsultationTest` — appointment transitions arrived → in_progress, walk-in creates a fresh appointment.
  - `CompleteConsultationTest` — `ended_at` set, appointment transitions to completed.
  - `FormSnapshotIntegrityTest` (the critical ADR-002 proof point) — submit v1 of a form, edit it, submit v2, assert the first submission's `form_snapshot` still has the OLD label/structure while the second has the new one.
  - `PrescriptionLockTest` — items can't be added to a printed prescription.
  - `MedicationAutocompleteTest` — service returns previously-prescribed medications matching a query.
  - `SecretaryDoctorBlockTest` — secretary 403 on POST /consultations.
- Total Pest count: **82 passed (436 assertions)** — up from 75 before Phase 10.
- TypeScript clean. `pnpm build` succeeds. Smoke: `/doctor` and `/doctor/queue` return 200 as `doctor@demo.einaya.test`. Log empty.

**Phase 10 deviations from the prompt:**
- `react-signature-canvas` integration is a stub — the `signature` question type renders a placeholder until v2.
- Form snapshot is loaded from `/forms/:id/edit` via XHR with the `X-Inertia` header to get the JSON form prop. A dedicated `/forms/:id/snapshot` endpoint would be cleaner — deferred until v2 because the existing route already returns the right shape.
- Auto-save is debounced at 5 seconds per spec (overview / chief complaint / notes / follow-up). Diagnoses and prescription items are saved immediately via Inertia POST/DELETE. Form fields are client-state-only until "Submit form" is clicked — auto-save mid-form is risky if the doctor changes their mind.
- Prescription print marks `printed_at` on first print and locks subsequent edits. v1 doesn't have a "re-print" override; if the doctor needs to fix a typo after print, they can soft-delete the prescription and create a new one (audit trail preserved).
- Walk-in flow on the doctor dashboard creates an Appointment on the fly via `StartConsultationAction` — the Phase 9 secretary registration flow is the proper entry point, but doctors get an emergency walk-in path too.
- Cmd+K patient search (built in Phase 9 but not mounted) is still not wired into the layout. Final wire-up + a tab on Consultation for "Files" upload UI deferred until the end-to-end smoke pass.
- "Now serving" panel + auto-refreshing queue use Inertia's `router.reload({ only: ['queue'] })` rather than a websocket — fine for a single-doctor v1 clinic with low concurrency.
- Patient quick-view side panel from the Reception dashboard spec is collapsed into the Consultation page's patient header. Two competing UX surfaces would have diverged over time.

### ✅ Phase 9 — Secretary / Reception Module (2026-05-06)

All Definition of Done items met:
- 5 controllers under `app/Http/Controllers/Tenant/` (ReceptionDashboard, Patient, PatientFile, Appointment, Payment) wired into 20 new routes (search-as-JSON, patients CRUD + files, appointments calendar + today + drag-reschedule + arrive/cancel/no-show, payments index + create + receipt).
- 3 actions under `app/Actions/Tenant/` (RegisterPatient, BookAppointment, RecordPayment). RegisterPatient normalizes phones, supports an inline-create-provider flow, and rolls patient + files into a transaction. BookAppointment runs the conflict service before saving. RecordPayment validates mixed-method splits.
- 4 services under `app/Services/Tenant/`:
  - `PatientSearchService` — multi-field search across patient_code / first / last / phone (digits-only) / national_id / email; also has `findByPhone()` for the duplicate guard.
  - `AppointmentConflictService` — returns hard errors (overlap with another active appointment) and soft warnings (outside working day/hours, break, time-off). Soft warnings can be force-overridden per spec.
  - `ReceiptNumberGenerator` — `R-YYYYMM-NNNNN` per-month sequence; computed from MAX(receipt_number) for the current YYYYMM prefix.
  - `QueueService` — per-day auto-incrementing `queue_number`. `markArrived()` is idempotent (no double-numbering on accidental re-clicks).
- 6 form requests + 4 resources (Patient, Appointment, Payment, PatientFile).
- 9 frontend pages + 3 shared components: `PatientSearch.tsx` (cmd+k command palette w/ debounced JSON search), `PatientRegistrationForm.tsx` (multi-section accordion with progressive disclosure + duplicate-phone guard), `PaymentForm.tsx` (mixed-method live sum validation). Pages: Reception/Dashboard, Patients/Index, Patients/Show (4 tabs: Overview, Visits, Files, Payments), Appointments/Calendar (FullCalendar with drag-reschedule), Appointments/Today, Payments/Index, Payments/Receipt (bilingual print-friendly view).
- New `tenant` translation keys added (EN + AR) for reception, patients, appointments, payments. AR mirror is partial — untranslated keys fall back to EN (i18next behavior with `fallbackLng: 'en'`).
- AppSidebar grew a `Reception` entry; existing patients/appointments/payments items now resolve to real pages.
- Calendar reads events via JSON (`GET /appointments/data`) — cleaner separation than Inertia props since FullCalendar refetches on view change.
- Receipt page is bilingual, picks language from the patient record (not the logged-in user), and includes `@media print` styles + a `window.print()` button. Forces `<html dir>` regardless of session locale.
- 8 new Pest tests across `tests/Feature/Tenant/` (PatientRegistration, PatientSearch, AppointmentBooking, AppointmentConflictDetection, AppointmentReschedule, PaymentRecording, ReceiptGeneration, SecretaryCannotAccessConsultations).
- Total Pest count: **75 passed (417 assertions)** — up from 64 before Phase 9.
- TypeScript clean. `pnpm build` succeeds.
- Smoke: every Phase 9 tenant page (`/reception`, `/patients`, `/appointments`, `/appointments/today`, `/payments`) returns 200 when authenticated as `doctor@demo.einaya.test`. `storage/logs/laravel.log` empty.

**Phase 9 deviations from the prompt:**
- Quick medical flags subform shows blood type / allergies / chronic / medications inline in the registration form, but no separate "files" section — file upload happens after creation on the patient profile page (`Patients/Show.tsx → Files tab`). Simpler v1 UX; spec called for it inside registration.
- Phone normalization is conservative: strip whitespace/dashes/parens, preserve leading `+`. No country-code inference — the secretary types whatever the patient says.
- `MedicalFormController::index/edit` got an explicit `forms.view`/`forms.manage` permission check this phase — Phase 8 didn't gate them at the controller, only at the form-request level for mutations. Without this, the Phase 9 secretary 403 test fails.
- Walk-ins are inferred from "appointment created today and scheduled today" rather than tagged with an explicit `is_walk_in` flag. Good enough until v2 introduces a dedicated walk-in workflow.
- Print receipt is browser `window.print()` only — no PDF export. Spec defers PDF to v2.
- Calendar shows ALL doctors' appointments regardless of which doctor is selected in the booking dialog. Per-doctor filtering would be a Phase 11+ refinement (multi-doctor support is currently disabled at the staff level anyway).
- "Cmd+K" patient search component (`PatientSearch.tsx`) is built but not yet mounted globally in `AppLayout` — wire-up will happen alongside Phase 10's consultation flow when there's a clear point to invoke it from.

### ✅ Phase 8 — Clinic Admin Module incl. Form Builder (2026-05-06)

**Post-completion fix (same session):**
- **Form Builder rendered a blank page.** `MedicalFormResource` was returning nested `sections` as `FormSectionResource::collection($this->whenLoaded('sections'))` which wraps the payload in `{ data: [...] }` — but the front-end Builder reads `formData.sections` as a flat array (`.find()`, `.map()`, `arrayMove(...)`). Result: `Object` where an array was expected, runtime crash, blank page. Same wrapper issue cascaded into `FormSectionResource.questions`. Fix in both resources: replace `Resource::collection(...)` with `$this->whenLoaded('rel', fn () => RelResource::collection($this->rel)->resolve($request))` so the inner payload is materialized as a plain array. The smoke checks in PROGRESS.md returned 200 because the page HTML loaded fine — only the React tree crashed at runtime, which curl can't see.

All Definition of Done items met:
- 12 tenant controllers (`app/Http/Controllers/Tenant/`): Dashboard, Staff, DoctorProfile, WorkingHours, Settings, InsuranceProvider, Report, Audit, MedicalForm, FormSection, FormQuestion, FormSubmission. Each authorizes via Spatie permissions and writes to the tenant audit log.
- 16 form requests under `app/Http/Requests/Tenant/` (Staff store/update, DoctorProfile, WorkingHours, Break, TimeOff, ClinicSettings, UploadLogo, InsuranceProvider store/update, Form store/update, Section store/update, Question store/update, Reorder).
- 8 Inertia/JSON resources under `app/Http/Resources/Tenant/` (Staff, Doctor, InsuranceProvider, MedicalForm, FormSection, FormQuestion, FormSubmission, AuditLog).
- 5 services under `app/Services/Tenant/`:
  - `FormSnapshotService::snapshot()` returns the canonical JSON shape that gets frozen onto each `FormSubmission` and is also used by the front-end `<FormRenderer />` for previews — same shape on both sides keeps the builder preview byte-identical to the patient view.
  - `MedicalFormService` — `generateKey()` (label → snake_case), `uniqueKey()` (per-form unique with `_2`/`_3` fallback), `duplicate()` (deep-clones sections/questions/options, marks the copy inactive).
  - `StatsService` — dashboard counters (today's appointments by status, patients this month new+returning, revenue this month, follow-ups due in 7 days).
  - `ReportService` — appointments / revenue / patients / diagnoses aggregations over a date range.
  - `CSVExporter` — UTF-8-BOM streamed CSV download (BOM keeps Excel happy with Arabic content).
- 53 new tenant routes registered in `routes/tenant.php` (auth-gated, behind `clinic_active`). Explicit `Route::bind` for `staff`, `form`, `section`, `question`, `submission`, `break`, `time_off`, `insurance_provider` — Laravel's implicit binding doesn't match these param names.
- Existing `App\Services\Tenant\AuditLogService` reused (Phase 3) — every Phase 8 mutation persists an audit row with old/new values.
- Frontend (Pages under `resources/js/Pages/Tenant/`): Dashboard (real stat cards, today's schedule, recent patients, quick actions), Staff/Index (CRUD + reset password + soft-delete), Doctor/Profile (avatar upload, EN+AR bio, specialty, license, consultation duration), Doctor/WorkingHours (weekly schedule, breaks, time off), Settings/Index (5 tabs: General/Branding/Localization/Receipt/Notifications + react-colorful color picker for primary), InsuranceProviders/Index (CRUD with patient-link guard), Reports/Index (4 tabs + CSV export), Audit/Index (filters + diff dialog), Forms/Index (DataTable with duplicate/edit/archive), Forms/Submissions (per-form list), Forms/Submission (snapshot replay).
- **Forms/Builder.tsx** — split panel (sections left, questions right), dnd-kit sortable for both, autosave on metadata edits (debounced 1s), publish toggle, in-place section title/description editor, question dialog with type-specific validation rules (text: min/max/regex; number: min/max; date: min_date/max_date; file: max_size_mb/allowed_types), per-type options builder (radio/checkbox/select), preview dialog using `FormRenderer`, soft-delete + confirm dialogs.
- `Components/domain/forms/FormRenderer.tsx` — read-only renderer of a `FormSnapshot`. Used by the builder preview and the submission detail view. Phase 10 will add a write-mode for live consultation submission (the API surface is ready — pass `answers` and a `readOnly={false}` flag once react-hook-form integration ships).
- `resources/js/types/tenant.ts` — full TS surface for tenant entities.
- New translation namespace `tenant` (EN + AR) — every UI string passes through `t()`. `i18n.ts` registers it.
- 5 new Pest tests in `tests/Feature/Tenant/`:
  - `FormBuilderTest` — 3 scenarios: snapshot shape correctness, stable-key uniqueness within a form, secretary cannot manage forms.
  - `StaffManagementTest` — secretary 403 on `POST /staff`; clinic admin can create + assign role.
  - `WorkingHoursTest` — weekly schedule POST persists 5 active days (inactive days don't get rows because the schema requires NOT NULL start/end).
  - `InsuranceProviderTest` — provider with linked patients can't be hard-deleted (returns flash error).
  - `ReportsTest` — `ReportService::revenue()` aggregates by payment method and totals correctly.
  - `BrandingUploadTest` — uploads through the controller, verifies `clinic_settings.branding.logo_url` is set.
- Total Pest count: **64 passed (387 assertions)** — up from 55 before Phase 8.
- TypeScript clean (`pnpm exec tsc --noEmit` zero errors). `pnpm build` succeeds (520kB main bundle, 376kB Dashboard bundle from recharts).
- Smoke check after fixes: every Phase 8 tenant page (`/`, `/staff`, `/doctor/profile`, `/doctor/hours`, `/settings`, `/insurance-providers`, `/forms`, `/reports`, `/audit`) returns 200 when authenticated as `doctor@demo.einaya.test`. `storage/logs/laravel.log` empty.

**Phase 8 deviations from the prompt:**
- Multi-doctor staff support is intentionally disabled (per spec) — the role select on Staff/Index has a `doctor` item disabled with a tooltip "Multi-doctor support coming soon"; the form request rejects anything but `secretary` for v1.
- Welcome email on staff create is stubbed: temp password is shown once in the success flash. Same pattern as Phase 7 for clinic admins.
- Receipt PDF rendering / "show logo on receipts" toggle is wired, but PDF generation is v2 (per spec).
- Patient-side branding (per-clinic primary color override) saves to `clinic_settings.branding.primary_color` but is not yet applied to the running tenant UI — Phase 9 (or sooner if needed) can wire it through `ClinicTheme` provider that reads the setting on Inertia share and updates the CSS variable.
- Working-hours weekly mini-calendar visualization (the spec mentions "shaded working hours") is replaced by a simpler row-per-day editor + breaks list for v1. The data model supports it; the visual is deferred.
- "Send appointment reminders to patients (in-app only for v1)" is a toggle in Settings → Notifications; the actual reminder dispatch is v2.
- `FormQuestionController::destroy` is soft-delete only (per spec — submissions reference questions, but the snapshot makes it safe). The section delete checks for any `JSON_CONTAINS_PATH` matches in `form_submissions.answers` before deleting and returns flash-error if so.
- `Staff` route param doesn't auto-bind to `User` (Laravel implicit binding only matches `{user}`); same for `form` → `MedicalForm`, `section` → `FormSection`, etc. Explicit `Route::bind(...)` calls cover them — see `routes/tenant.php` head.
- Bundle warning unaddressed (520kB main). Code-splitting per Inertia route is a Phase 9+ concern.

### ✅ Phase 7 — Super Admin Module (2026-05-06)

**Post-completion fixes (same session)** — both regressions only surfaced when the user actually loaded the page in a browser, which the Pest + curl smoke checks didn't exercise:

- **Blank page on every Inertia route.** `app.tsx` mounts `<Toaster />` as a sibling of `<App />` so toasts persist across page transitions. The Toaster called `useTheme()`, which uses Inertia's `usePage()` — and `usePage()` requires the React context provided by `<App />`. Mounting Toaster outside that context threw, and React rendered nothing. Fix in `resources/js/Components/ui/sonner.tsx`: replaced the `useTheme` dependency with a small `useDomTheme()` that reads `document.documentElement.classList.contains('dark')` and observes class changes via `MutationObserver`. The pre-paint script in `app.blade.php` already keeps the `dark` class accurate, and `useTheme()` (used by the in-app toggle) updates the same class — so the DOM is the source of truth here, no Inertia context needed.
- **Login redirect loop.** Logging in as the super admin sent the browser into an infinite `/login → / → /login` chain. Root cause: Laravel's middleware priority list contains the `AuthenticatesRequests` *contract* (which `Authenticate` implements), and the framework auto-sorts a route's middleware stack against that list. `EnsureCentralContext` wasn't in the priority list, so it got demoted past `Authenticate` — meaning `auth` ran with the default `web` (tenant) guard active, didn't see the central session, and bounced the user to `/login`. The login page bounced authed users back to `/`, looping. Fix in `bootstrap/app.php`: explicit `prependToPriorityList(before: AuthenticatesRequests::class, prepend: EnsureCentralContext::class)` (and the same for `EnsureClinicActive`). The middleware docblock now warns future-me not to remove these.
- **Tenant pages 100% blank.** Visiting `https://demo.einaya.test/login` rendered nothing because every JS/CSS asset 404'd. `FilesystemTenancyBootstrapper` rewrites Laravel's asset URL root to point at stancl's `tenancy.asset` route (which only serves files from `storage/app/public/`), but Vite emits assets under `public/build/`. So the HTML referenced `https://demo.einaya.test/tenancy/assets/build/assets/app-*.js` and stancl's controller couldn't find any of them. Fix in `config/tenancy.php`: `tenancy.filesystem.asset_helper_tenancy` set to `false`. Tenant-scoped uploads (avatars, patient files in Phase 8+) should call `tenant_asset()` explicitly instead of relying on the global `asset()` helper rewrite.

All Definition of Done items met:
- `EnsureSuperAdmin` middleware (alias `super_admin`) gates every `/clinics`, `/plans`, `/subscriptions`, `/tickets`, `/audit`, `/settings`, `/` route on the central domain. Non-super-admin central users get 403; guests redirect to `/login`.
- `EnsureClinicActive` middleware (alias `clinic_active`) is wired into the tenant route group right after `InitializeTenancyByDomain`. Reads status fresh from the central DB on every request (see Phase 7 decisions for why) and aborts 503 when the clinic is `Suspended` or `Cancelled`. Always lets `*.logout` through so an in-flight session can terminate cleanly.
- Three action classes in `app/Actions/Central/`:
  - `CreateClinicAction` — provisions central record + domain + subscription, runs the `TenantCreated` pipeline (DB + migrations + role seeder), creates the tenant-DB clinic_admin user with a generated 14-char temp password, returns `[clinic, temp_password, admin_email]`. Errors hard-delete the central record so state stays aligned.
  - `SuspendClinicAction` — suspend / activate / cancel transitions, each writes an audit row with old+new status.
  - `ChangeClinicPlanAction` — closes the active subscription and creates a new one, all centrally and atomically (no tenant DB calls, so a transaction is safe here).
- 7 form requests under `app/Http/Requests/Central/` — slug regex + reserved-word check on clinic create, slug NOT editable on update, soft-deleted plan rejection on delete, status enum validation on tickets, future-only `ends_at` on subscription extension.
- 5 Inertia/JSON resources under `app/Http/Resources/Central/` (Clinic, Plan, Subscription, Ticket, AuditLog) — all date fields ISO-8601, status carries both raw value and human label.
- 7 controllers under `app/Http/Controllers/Central/` (Dashboard, Clinic, Plan, Subscription, Ticket, Audit, Setting). Filters wire query strings into eloquent scopes; pagination uses Laravel's `Paginated` shape that maps cleanly to the `Paginated<T>` TS helper.
- 30 routes registered (all under the `auth + super_admin` middleware stack except the design-system + guest language endpoints).
- Cross-tenant aggregation: `App\Jobs\Central\AggregatePlatformStats` walks every active Clinic via `$clinic->run(...)` to count Patients + active Tenant Users, stores the result in `global_settings.platform_stats`. Scheduled hourly via `Schedule::job(...)` in `routes/console.php`. Dashboard reads the cached value and exposes a "Refresh now" button (`POST /api/aggregate-stats`) that runs the job synchronously for super admins.
- Dashboard renders 4 stat cards (real central counts + cross-tenant patients from cache), recharts `<LineChart>` of new clinics per month for the last 12 months, recharts `<PieChart>` of plan distribution across active subscriptions, recent-activity feed of the last 10 `CentralAuditLog` rows.
- Clinic UI:
  - `Pages/Central/Clinics/Index.tsx` — DataTable with status / plan / search filters, "Create clinic" `<FormModal>`, dropdown actions per row (View / Open subdomain / Suspend|Activate / Delete), confirm dialogs for destructive ops. Slug is auto-lowercased and stripped to `[a-z0-9-]` client-side.
  - `Pages/Central/Clinics/Show.tsx` — 5 tabs: Overview (editable owner / trial), Subscription (read + change-plan + extend ends), Usage (cached patient/staff counts), Audit (50 most recent for this clinic), Danger Zone (suspend/activate/cancel).
- Plans UI: full CRUD with delete-block when active subscriptions exist, features stored as newline-delimited textarea client-side and round-tripped as `string[]` via `form.transform()`.
- Subscriptions UI: read-only roster + "Extend" modal that POSTs `ends_at` (must be in the future).
- Tickets UI: index + show with append-to-body response (date-stamped), status select.
- Audit log UI: full filter set (date range, user, action, type), per-row "view diff" dialog rendering old/new JSON side-by-side.
- Settings UI: tabbed General / Legal / Branding (Email is a stub alert) — saves each section to its own `global_settings.key` row so audit rows are discrete.
- New translation namespace `central` (EN + AR) — every UI string passes through `t()`. i18n config updated to load it.
- `theme_preference` column was added in Phase 6 — Phase 7 adds `change_central_audit_logs_auditable_id_to_string`: widens `auditable_id` from `unsignedBigInteger` to `string(64)` because Clinic IDs are slug strings, not integers. Index drops + recreates around the column change.
- Schema follow-up: applied `Stancl\Tenancy\Database\Concerns\CentralConnection` to `User`, `SupportTicket`, `SubscriptionPlan`, `Subscription`, `GlobalSetting`, `CentralAuditLog`. Without this, any model write from inside a tenant-bootstrapped context (e.g., clinic creation, audit logging during suspend, refresh-stats job) ends up on the tenant DB connection and fails because the table only exists centrally.
- 9 new Pest tests across `tests/Feature/Central/`:
  - `CreateClinicTest` — full provisioning: tenant DB created, admin user gets `clinic_admin` role, temp password hashes match, subdomain returns 200 on `/login`.
  - `SuspendClinicTest` — active → 200, suspend → 503, activate → 200.
  - `PlanCannotBeDeletedTest` — DELETE refused with `error` flash when active subs exist; soft-deletes when none.
  - `AuditLogCreatedOnClinicSuspensionTest` — verifies `clinic.suspended` row carries `old: status=active`, `new: status=suspended, reason=...`.
  - `OnlySuperAdminCanAccessTest` — non-super-admin gets 403 on every Phase 7 path; guest redirects to login; super admin gets through.
- Total Pest count: **55 passed (347 assertions)** — up from 46 before Phase 7.
- TypeScript clean (`pnpm exec tsc --noEmit` zero errors). `pnpm build` succeeds (520kB main bundle, 376kB Dashboard bundle from recharts; both flagged for code-splitting in Phase 8+).
- Smoke check: `https://einaya.test/` 200, `https://app.einaya.test/login` 200, `https://app.einaya.test/` 302→/login (guest), `https://demo.einaya.test/login` 200, `https://demo.einaya.test/` 200. `storage/logs/laravel.log` empty.

**Phase 7 deviations from the prompt:**
- Spec calls out impersonation ("super admin can log in as any clinic admin"). Not implemented — defer to Phase 8 because tenant-side `clinic_admin` UX needs to exist first (otherwise impersonation lands on a 404).
- Email/SMS sending is stubbed: `CreateClinicAction` returns the temp password in the redirect's success flash so the super admin can copy it once. Email integration is v2 per spec.
- The `Settings → Email` tab is intentionally an alert ("v2") — the migration / model already supports the section (`global_settings.email`) but no fields are exposed.
- Branding per-clinic is stored on the Clinic record but not editable from the super-admin UI in v1 — clinic admins set it from the tenant side in Phase 8 per spec.
- "Search" inputs use blur + Enter rather than debounced live filtering. Easier to ship correctly; Phase 8+ can swap in `useDebouncedCallback` if the table lengths warrant it.
- Notifications dropdown in topbar is still an empty placeholder (same as Phase 6). Real notifications belong with the activity stream once we have one.
- Bundle warning is not addressed: `Dashboard-*.js` is now 376kB (recharts) and shipped to every super admin even on non-dashboard pages. Code-splitting (`React.lazy()` per Inertia page) is a Phase 8+ concern.

### ✅ Phase 6 — UI Foundation: shadcn, Layout, i18n, RTL, Dark Mode (2026-05-05)

All Definition of Done items met:
- shadcn/ui installed (`new-york` style) with 33 primitives under `resources/js/Components/ui/`. `components.json` configured with `@/Components`, `@/Components/ui`, `@/lib/utils`, `@/Hooks` aliases. CLI managed to non-interactively add components after `components.json` was hand-written.
- `tailwind.config.ts` (replaces `tailwind.config.js`) wires the full token surface: 30+ semantic colors via `rgb(var(--token) / <alpha-value>)`, sidebar palette, status palette (FullCalendar), Manrope/IBM Plex Sans Arabic/JetBrains Mono fonts, type scale (h1–display + base 14px), 8px radius, soft shadow ramp, sidebar/header spacing tokens. Plugins: `tailwindcss-animate`, `tailwindcss-rtl`, `@tailwindcss/forms`, `@tailwindcss/typography`. Tailwindcss upgraded 3.2.1 → 3.4.19.
- `resources/css/app.css` carries the `:root` + `.dark` CSS variable blocks (RGB triplets) + body font setup. `html[lang="ar"] body` swaps to `--font-arabic` automatically, so anywhere a body descendant inherits font-family.
- Backend prefs:
  - Migration `2026_05_05_000001_add_theme_preference_to_users` adds `theme_preference` (string, default `system`) to BOTH the central `users` table and the tenant `users` table (mirrored migration in `database/migrations/tenant/`).
  - `App\Http\Controllers\PreferenceController` handles `POST /api/preferences/language` (en/ar) and `POST /api/preferences/theme` (light/dark/system) — writes the column, sets the session `locale`, redirects back. Routes registered in both `central.php` and `tenant.php` with auth-gated + guest-allowed language variants.
  - `App\Http\Middleware\SetLocale` runs in the `web` group: pulls locale from session > user pref > config, calls `app()->setLocale()`. Wired in `bootstrap/app.php` ahead of `HandleInertiaRequests`.
  - `HandleInertiaRequests` now shares `preferences: { locale, direction, theme }` and `auth.isSuperAdmin` alongside the existing auth/permissions/roles/flash bag.
  - `resources/views/app.blade.php` reads the user's theme + locale server-side, sets `<html lang dir>`, runs an inline pre-paint script that applies `.dark` from `localStorage` (or stored pref / OS preference) before React mounts — kills theme FOUC.
- i18n: `resources/js/i18n.ts` uses i18next + react-i18next + browser-language-detector with `htmlTag → localStorage → navigator` resolution order. Three namespaces shipped (`common`, `auth`, `dashboard`) in `resources/js/locales/{en,ar}/`. Default NS = `common`. Hot-loaded JSON imports (no async fetch).
- Hooks: `useDirection()` (reads Inertia `preferences.direction`), `useLocale()` (changes language + persists + reload — needed because dir/font flip can't happen mid-render), `useTheme()` (light/dark/system, syncs `<html class="dark">`, listens to `prefers-color-scheme` for `system`, persists to both localStorage AND backend), `useFlashToasts()` (Inertia flash → Sonner toast, deduped by JSON fingerprint).
- Layouts: `resources/js/Layouts/AppLayout.tsx` + `CentralLayout.tsx` — both wrap content in shadcn's `<SidebarProvider>` + `<SidebarInset>` and accept `title`, `pageTitle`, `description`, `actions`, `breadcrumbs`. Domain components (`Components/domain/layout/`): `AppSidebar`, `CentralSidebar`, `AppTopbar`, `SidebarBrand`, `ThemeToggle`, `LanguageSwitcher`, `UserMenu`. All sidebars choose `side="left|right"` based on `useDirection()` so RTL puts navigation on the right edge automatically.
- AppSidebar items wrapped in `<Can permission=… />` filters at the section level — sections collapse to nothing when no item passes. Sections: Main, Medical, Billing, Admin (per spec).
- Reusable patterns in `Components/domain/`: `DataTable<TData, TValue>` (TanStack Table v8 + shadcn Table — pagination, global/column search, column toggle, RTL chevrons), `FormModal`, `EmptyState`, `StatusBadge` (5 variants: success/warning/info/danger/neutral), `ConfirmDialog`, `LoadingSpinner`, `PageSkeleton`, `PageHeader`, `AppBreadcrumb`.
- `resources/js/Pages/DesignSystem.tsx` — single-page showcase rendering color swatches, typography ramp, all button variants/sizes, all form controls, status badges, alerts, the DataTable, avatars + tabs, accordion, dialogs (FormModal + ConfirmDialog) with toast triggers, EmptyState + PageSkeleton. Page chooses AppLayout vs CentralLayout via the `context` prop. Gated by `App\Http\Middleware\AllowDesignSystem` — passes in `local`/`development` env or for `is_super_admin = true` users; 404 otherwise.
- Dashboard stubs: `Pages/Tenant/Dashboard.tsx` + `Pages/Central/Dashboard.tsx`, each with 4 stat cards using the design-token color/spacing system. Old `Pages/Central/SuperAdmin.tsx` deleted (route now points at `Central/Dashboard`).
- 4 new Pest tests in `tests/Feature/Central/PreferencesTest.php` (language persists, theme persists, invalid language rejected, invalid theme rejected). 46 total in the suite (was 42).
- TypeScript clean (`pnpm exec tsc --noEmit` zero errors). `pnpm build` produces a working manifest (5.5s, 506kB main bundle gzip 167kB — flagged for code-splitting in Phase 7+).
- Smoke: `https://einaya.test/` (200), `https://app.einaya.test/login` (200), `https://app.einaya.test/` (302→login), `https://demo.einaya.test/login` (200), `https://demo.einaya.test/` (200), `https://demo.einaya.test/design-system` (200). `storage/logs/laravel.log` empty.

**Phase 6 deviations from the prompt:**
- Did NOT use `next-themes` — wrote our own `useTheme()` hook (`resources/js/Hooks/useTheme.ts`) instead. Reasons: (a) we already needed Inertia-aware theme persistence to the backend, (b) `next-themes` is built around Next.js's app router idioms, and (c) the FOUC-prevention script in `app.blade.php` already runs before React mounts. The shadcn `sonner.tsx` component was rewritten to call our hook instead of `next-themes`'s.
- The shadcn-CLI `add` command silently rewrote `tailwind.config.ts` (HSL sidebar tokens, duplicated `darkMode`, mangled font fallbacks) and `resources/css/app.css` (HSL sidebar variables, extra `--sidebar-background`/`--sidebar-primary` keys). Both files were manually reset to RGB-triplet consistency afterward. If you re-run `shadcn add` for new components, expect another rewrite — diff before committing.
- Search bar in `AppTopbar` is a visual stub (button-styled command opener with ⌘K hint) — actual `cmdk` dialog wiring deferred to Phase 7 when there's something to search.
- Deleted `resources/js/Pages/Central/SuperAdmin.tsx`. The central root route renders `Central/Dashboard` now. No tests referenced the old name.
- Notifications dropdown in topbar is an empty-state placeholder (no notification model yet) — same approach as the spec calls for.
- Date-picker is not a separate file: shadcn ships `calendar.tsx` and `popover.tsx`; composing a `DatePicker` is a 10-line consumer-side pattern, deferred until first consumer (appointments UI in Phase 8).

### ✅ Phase 1 — Setup & Tenancy Foundation (2026-05-01 → 2026-05-02)

All Definition of Done items met:
- Laravel 12 + Breeze (Inertia React + TS, dark mode, Pest v3, pnpm)
- stancl/tenancy v3.10 multi-database mode wired up with custom Tenant model
- Three URL types resolve in browser:
  - `einaya.test` → "Welcome to Einaya"
  - `app.einaya.test` → "Super Admin Panel"
  - `demo.einaya.test` → "Tenant: demo" (after tenant created)
- `php artisan migrate` runs cleanly on `einaya_central` MySQL DB
- Tenant creation via tinker auto-creates `einaya_tenant_{id}` MySQL DB
- 28 Pest tests pass (Breeze auth + 3 tenancy smoke tests)
- TypeScript clean (`pnpm exec tsc --noEmit` zero errors)
- No errors in `storage/logs/laravel.log`

### ✅ Phase 2 — Central Database Schema (2026-05-02)

All Definition of Done items met:
- Fresh `php artisan migrate:fresh --seed` produces:
  - 1 super admin user (`admin@einaya.ps` / `Einaya@2025`)
  - 3 subscription plans (Starter / Pro / Enterprise)
  - 1 demo clinic on Pro plan with `demo.einaya.test` domain + tenant DB auto-created
- All three URLs return 200 (`einaya.test`, `app.einaya.test`, `demo.einaya.test`)
- 34 Pest tests pass — adds 6 new ones in `Feature/Central/` (3 audit, 2 plan seed, 1 clinic creation)
- TypeScript clean
- Tinker confirms: `Clinic::all()` returns demo clinic; `User::first()->is_super_admin === true`

### ✅ Phase 5 — Roles, Permissions & Policies (2026-05-02)

All Definition of Done items met:
- `spatie/laravel-permission` installed; the `create_permission_tables` migration moved to `database/migrations/tenant/2026_05_02_000023_*` so roles/permissions live per-clinic.
- 4 roles seeded into every tenant DB: `clinic_admin` (all 46 perms), `doctor` (medical stack + read-only on staff/payments/reports), `secretary` (admin + scheduling + billing only — explicit deny on medical permissions), `nurse` (v2 stub).
- 46 permissions across 13 resource groups, defined as a string-backed `App\Enums\Tenant\Permission` enum (and mirrored in `resources/js/types/auth.ts` for compile-time safety on the FE).
- 13 policies in `app/Policies/Tenant/`, registered explicitly via `App\Providers\AuthServiceProvider` (Laravel 12 ships no AuthServiceProvider by default).
- `App\Models\Tenant\User` uses `Spatie\Permission\Traits\HasRoles`; central `User` is left alone (super admins are gated solely by `is_super_admin`).
- New tenancy pipeline job `App\Jobs\Tenancy\SeedTenantRolesPermissions` runs in EVERY env (production included) so role tables are populated before any user is created. Demo seeder (`SeedTenantDatabaseInDev`) runs after, skipped in production + testing as before.
- `TenantDemoSeeder` assigns `clinic_admin` + `doctor` to the doctor user and `secretary` to the secretary user.
- `HandleInertiaRequests` shares `auth.permissions` and `auth.roles` (empty arrays for the central super admin since the trait isn't installed there).
- `resources/js/Hooks/useCan.ts` + `resources/js/Components/domain/Can.tsx` wrap the shared permissions for declarative use; TS types in `resources/js/types/auth.ts`.
- 6 new authorization tests pass — 42 total in the suite. Demo tenant verified: 4 roles, 46 permissions, 104 role-permission mappings, 3 user-role assignments.
- All three URLs return 200; `storage/logs/laravel.log` empty.

**Phase 5 deviations from the prompt:**
- "Secretary direct URL access to `/consultations` returns 403" deferred to Phase 7. There are no resource controllers built yet (Phase 4 only added auth controllers), so Gate-level tests cover the same ground without scaffolding throwaway routes.

### ✅ Phase 4 — Authentication, 2FA & Multi-Context Login (2026-05-02)

All Definition of Done items met:
- Two auth guards configured: `web` (tenant) → `App\Models\Tenant\User`, `web_central` → `App\Models\Central\User`. Two password brokers, two providers. The `central` middleware swaps `auth.defaults.guard` to `web_central` for the request lifetime so shared controllers stay context-agnostic.
- Routes registered twice (once per context) via a closure in `routes/auth.php` — names prefixed with `central.` / `tenant.`. No `/register` route in either context (no self-signup in v1).
- Login flow:
  - Email + password → `LoginRequest` (5 attempts/min throttle on email+IP)
  - If user has `two_factor_confirmed_at` → session-stash `auth.two_factor.user_id`/`guard`/`remember`, redirect to `/two-factor/challenge`
  - Otherwise → fully logged in
- 2FA built on `pragmarx/google2fa-laravel` + `bacon/bacon-qr-code` (SVG QR data URIs). `App\Services\TwoFactorService` does the crypto; `App\Traits\HasTwoFactorAuth` is mixed into both User models. Recovery codes are individually `Hash::make()`'d before being encrypted in `two_factor_recovery_codes`.
- Sessions switched to the `database` driver — central uses the existing `sessions` table from the default Laravel migration; tenants got a new `2026_05_02_000022_create_sessions_table.php`. `SESSION_DOMAIN=null` so each subdomain has its own cookie.
- Password rules apply on update + reset: `Password::min(10)->mixedCase()->numbers()->symbols()`. Login itself only requires non-empty (so users can copy/paste long random passwords without re-validating them).
- Frontend: `Login.tsx`, `ForgotPassword.tsx`, `ResetPassword.tsx`, `ConfirmPassword.tsx`, `VerifyEmail.tsx`, `Profile/Edit.tsx` updated to use relative URLs (no Ziggy `route()` calls). New pages: `TwoFactorChallenge.tsx`, `TwoFactorSetup.tsx`. `Register.tsx` removed.
- 19 new auth tests pass — 36 total in the suite. Smoke: `https://einaya.test/`, `https://app.einaya.test/login`, `https://demo.einaya.test/login` all return 200; `https://app.einaya.test/` redirects guests to `/login`.
- `storage/logs/laravel.log` empty.

### ✅ Phase 3 — Tenant Database Schema (2026-05-02)

All Definition of Done items met:
- 21 tenant migrations run cleanly via the auto-provisioning pipeline. `php artisan migrate:fresh --seed` end-to-end:
  - Builds central DB
  - Seeds super admin + plans + demo clinic
  - `Clinic::create('demo')` fires the `TenantCreated` JobPipeline → `CreateDatabase` → `MigrateDatabase` → `SeedTenantDatabaseInDev`
  - The demo tenant DB ends up populated with: 2 users, 1 doctor + 5 working hours + 5 lunch breaks, 5 insurance providers, 20 patients (12 with insurance), 30 appointments, 15 consultations on completed visits, 1 medical form / 3 sections / 10 questions / 16 options, 5 form submissions, 3 prescriptions (6 items), 3 diagnoses, 15 payments
- All three URLs return 200 (`einaya.test`, `app.einaya.test`, `demo.einaya.test`)
- 40 Pest tests pass — adds 6 new ones in `Feature/Tenant/`:
  - `TenancyIsolationTest` — the codebase's most critical test
  - `PatientCodeGenerationTest` (sequential, per-tenant; soft-deleted IDs not reused)
  - `PatientFactoryTest`
  - `FormSubmissionSnapshotTest` (verifies ADR-002 — form edits don't rewrite history)
  - `AppointmentStatusTest` (enum casting + transitions)
- `storage/logs/laravel.log` is empty / no errors

---

## In Progress

_(none — Phase 10 wrapped. v1 feature scope complete; remaining work is end-to-end smoke + post-v1 backlog from the Phase 10 prompt: Stripe billing, Twilio SMS, S3 storage, patient portal, multi-doctor UI, ICD-10 lookup, telemedicine, mobile app, advanced analytics.)_

---

## Blockers / Open Questions

_(none)_

---

## Key Decisions Made During Build

### Phase 1

- **No `RouteServiceProvider`** — Laravel 12 doesn't ship one. Routes registered via `bootstrap/app.php` `withRouting()` and a `then:` callback for `routes/central.php`. Phase 1 prompt assumed RouteServiceProvider; deviation is structural to Laravel 12.
- **No `tenant` connection in `config/database.php`** — stancl/tenancy v3 reserves the name `tenant` and creates the connection at runtime by cloning the central `mysql` connection. Phase 1 prompt asked for one; adding it would conflict with the package.
- **Marketing `/` domain-restricted** to `einaya.{ps,test}` + loopback (in `routes/web.php`) — without this, the URI `/` collides with `routes/tenant.php`'s `/`, and tenant.php (loaded later via `Application::booted()`) wins for all hosts. Domain restriction makes routing deterministic.
- **Custom Tenant model at `app/Models/Central/Tenant.php`** — extends `Stancl\Tenancy\Database\Models\Tenant`, implements `TenantWithDatabase`, uses `HasDatabase` + `HasDomains` traits. The base Tenant model doesn't implement `TenantWithDatabase`, so multi-DB CreateDatabase job fails without a custom one. `config/tenancy.php` `tenant_model` updated to point here. *(Phase 2: replaced by `Clinic` model and `clinics` table.)*
- **Breeze Welcome.tsx replaced** with a minimal "Welcome to Einaya" page (per Phase 1 spec naming).
- **Breeze auth/profile/dashboard routes left in `routes/web.php`** untouched — Phase 4 will refactor onto tenant subdomains.
- **`app/Models/User.php` left at root** (not moved to `Models/Central/`) — Breeze depends on it; Phase 2 owns the central User model. *(Phase 2: moved to `app/Models/Central/User.php`; old file deleted; all references updated.)*
- **TS fixes in Breeze templates** are minimal patches (typed `usePage<PageProps>()`); Phase 4 rewrites these files entirely.
- **Pest.php split** — `RefreshDatabase` applied only to Breeze-installed tests (`Feature/Auth/`, `Feature/ProfileTest.php`, `Feature/ExampleTest.php`). The tenancy test in `Feature/TenancyTest.php` opts out because tenant DB creation/deletion is DDL that auto-commits and breaks RefreshDatabase's transaction-rollback strategy. TenancyTest manages its own state via `pestSmokeCleanup()` (drops tenant DB + ends tenancy + deletes the test tenant row, scoped to a unique `pestsmoke` tenant ID).
- **phpunit.xml uses `einaya_central_testing`** MySQL DB (not in-memory sqlite). Tenancy test requires `CREATE/DROP DATABASE` DDL which sqlite can't do. Run `mysql -e "CREATE DATABASE einaya_central_testing ..."` then `APP_ENV=testing DB_DATABASE=einaya_central_testing php artisan migrate` once before first test run.
- **`SESSION_DRIVER=file`** in `.env` and `.env.example` — Laravel default `database` requires a `sessions` table in whatever connection is active, which would mean a tenant migration. Phase 1 keeps `database/migrations/tenant/` empty per spec, so we use the file driver. Phase 3 will add a sessions migration to the tenant folder and switch back to `database`.

### Phase 2

- **`Clinic` replaces `Tenant` as the tenancy root model.** `app/Models/Central/Tenant.php` deleted; `app/Models/Central/Clinic.php` is the new stancl tenant model with `protected $table = 'clinics'`. `tenants` migration replaced by a full `clinics` migration with name/slug/owner/status/branding/etc. `config/tenancy.php` `tenant_model` now points at `Clinic::class`. The `domains.tenant_id` FK now references `clinics(id)`.
- **`Clinic` declares all real columns via `getCustomColumns()`.** stancl's `VirtualColumn` trait moves any attribute not listed there into the `data` JSON column. Without overriding, our `name`/`slug`/etc. would be persisted as JSON instead of as real columns. The override includes `created_at`, `updated_at`, `deleted_at` so SoftDeletes works.
- **Central `User` model now lives at `app/Models/Central/User.php`** with strict types, `SoftDeletes`, 2FA columns, `is_super_admin`, `preferred_language`. Old `app/Models/User.php` deleted. All Breeze references (`config/auth.php`, `RegisteredUserController`, `ProfileUpdateRequest`, every test file in `Feature/Auth/` and `ProfileTest.php`) updated to import `App\Models\Central\User`.
- **`UserFactory` moved to `database/factories/Central/UserFactory.php`** in matching namespace. Each Central model declares `protected static function newFactory()` so HasFactory finds the namespaced factory.
- **`tests/Feature/ProfileTest.php` `assertNull($user->fresh())` → `assertSoftDeleted($user)`.** Required because `User` now uses SoftDeletes and Eloquent `fresh()` skips global scopes (so it returns the trashed record, not null).
- **Subscription FK is added in a follow-up migration** (`2026_05_02_000003_add_subscription_id_fk_to_clinics_table`) because `clinics` has `subscription_id → subscriptions.id` and `subscriptions` has `clinic_id → clinics.id` — circular. Order: clinics (column nullable, no FK), subscription_plans, subscriptions, then add FK back onto clinics.
- **`subscription_id` typed as `unsignedBigInteger` (not `foreignId`) on clinics** to avoid the FK constraint at create-time. The constraint is added later by the follow-up migration.
- **`subscriptions.clinic_id` and `support_tickets.clinic_id` typed as `string`** (not `foreignId`) since `clinics.id` is a UUID string. FK added manually with `->references('id')->on('clinics')`.
- **Status columns use `string('col', 30)` + enum cast** (per `database-conventions.md`), not `->enum()` migration helper. Enums are string-backed (`pending`/`active`/`trial`/etc.) so JSON inspection stays readable.
- **`use WithoutModelEvents` removed from `DatabaseSeeder`.** With it on, `Clinic::create()` in `DemoClinicSeeder` did NOT fire stancl's `TenantCreated` event, so the `CreateDatabase` JobPipeline never ran and `einaya_tenant_demo` was never created. Phase 1 didn't hit this because tenants were created via tinker.
- **Tenant DB prefix is now env-driven.** `config('tenancy.database.prefix')` reads `TENANCY_DB_PREFIX` (default `einaya_tenant_`). `phpunit.xml` sets it to `einaya_test_tenant_` so `php artisan test` cannot drop the dev tenant DBs (the test cleanup helpers also DROP the prefixed DB; without isolation, every test run nuked `einaya_tenant_demo`). All test cleanup helpers compute the DB name from config rather than hardcoding.
- **`DemoClinicSeeder` is idempotent** (re-run safe): finds existing demo clinic by slug, ensures the domain row + active subscription exist, only triggers tenant DB creation on first run. Includes a guard that warns and skips `tenants:migrate` if `database/migrations/tenant/` is empty (Phase 3 fills that folder).
- **`AuditLogService` accepts a nullable `Request` and nullable `User`** — the audit log table allows null user_id, and seeder/cron contexts have no request. Backend-conventions rule "no facades in services" is honored: Request is constructor-injected (Laravel resolves it from the container) instead of using the `request()` helper.

### Phase 5

- **Spatie permission cache → `array` driver, not `database`.** stancl's `CacheTenancyBootstrapper` routes the database cache store to the active tenant DB, but tenant DBs have no `cache` table. The migration's `Cache::forget()` call therefore exploded mid-seed. `'store' => 'array'` keeps the cache process-local, which costs us nothing because the catalog is tiny (~4 roles, ~50 perms) and rebuilds in microseconds per request.
- **Two-stage tenant pipeline:** `SeedTenantRolesPermissions` runs unconditionally (every env); `SeedTenantDatabaseInDev` runs only in non-production+non-testing. Without the role seeder running in production, every clinic user would be locked out — Spatie's `Gate::before` short-circuits to false when no role/permission rows exist.
- **`AuthServiceProvider` registered explicitly** in `bootstrap/providers.php`. Laravel 12 doesn't ship one by default and policy auto-discovery doesn't span the `App\Models\Tenant\X` ↔ `App\Policies\Tenant\XPolicy` namespace pair (Laravel only auto-resolves `App\Policies\XPolicy`). Listing the 13 model→policy pairs explicitly is also greppable.
- **`HandleInertiaRequests::share` uses `method_exists(...)` to test for `HasRoles`.** The Inertia middleware is shared across central and tenant contexts; the central super admin's User model doesn't have `getAllPermissions()`, so the trait check keeps both contexts working without branching on guard.
- **`UserPolicy` lets a user always view themselves regardless of `staff.view`.** Without this, a doctor without staff perms couldn't even hit their own profile page. Self-delete via staff management still requires `staff.delete` AND is blocked by an `id !== id` guard.
- **`PaymentPolicy` and `FormSubmissionPolicy` return `false` on `update`/`delete`** even for clinic_admin. Payments are adjusted via the separate `refund` ability; form submissions are immutable per ADR-002. The policy enforces this even if a permission slips into the role matrix later.
- **No "super-admin" wildcard permission.** Spatie supports a `super-admin` role that bypasses every check via `Gate::before`; we don't use it. Clinic admin has every permission listed explicitly so role audits are accurate.
- **`PatientFilePolicy::view` cross-checks the file category** against `patients.view_medical`. Secretaries can see ID/insurance card scans (admin categories) but not external reports or prescription scans, even though they have `files.view` and `files.upload`. Defense-in-depth — same rule will be re-asserted at the controller level when Phase 7 builds file UI.

### Phase 4

- **Two guards + two providers + two brokers in `config/auth.php`.** Default guard is `web` (tenant); `web_central` is the central-context guard. The `EnsureCentralContext` middleware mutates `config('auth.defaults.guard')` and `auth.defaults.passwords` for the lifetime of central requests so `Auth::user()` / `Auth::attempt()` / `Password::sendResetLink()` resolve to the right model and table without explicit guard threading. This isn't elegant (config mutation is shared state) but it keeps the Breeze-style controllers reusable across both contexts.
- **`routes/auth.php` is a closure, not a route file.** It returns a callable that accepts a name prefix (`central` or `tenant`) and registers the same set of routes under that prefix. Both `routes/central.php` and `routes/tenant.php` `(require __DIR__.'/auth.php')('xxx')`. Why: route names are global in Laravel — registering `login` twice would silently let only the last-registered version generate URLs. Prefixing avoids collisions. The trade-off is `redirect()->route('login')` doesn't work; controllers use `redirect()->route(AuthContext::prefix().'.login')`.
- **Frontend uses relative URLs (`/login`, `/profile`, `/two-factor`) instead of Ziggy `route('xxx')`.** Same reason as above — Ziggy's `route('login')` would fail for one of the two contexts. Relative paths route correctly to the current host.
- **`bootstrap/app.php` calls `redirectGuestsTo(fn () => '/login')`** — Laravel's default `Authenticate` middleware tries to resolve `route('login')` on 401, which doesn't exist. The closure short-circuits the named-route lookup with a relative URL.
- **`HasTwoFactorAuth` trait + `TwoFactorService`** — service is the cryptography layer (Google2FA + QR), trait is the model-attribute layer (encrypt/decrypt secret, hash recovery codes, `confirmTwoFactor` returns the plaintext recovery codes once). Recovery code format `XXXX-XXXX` (8 chars). Codes are `Hash::make()`'d individually then JSON-encoded then `Crypt::encryptString`'d — three layers — so a stolen DB still requires the `APP_KEY` plus a brute-force pass.
- **2FA challenge runs against a separate rate limiter** (key: `two-factor|user_id|ip`) so a TOTP guesser can't bypass the login rate limit by skipping the credential step.
- **`Auth::attempt()` is split into `validate()` + `login()`** in `AuthenticatedSessionController::store()` so we can branch on `hasTwoFactorEnabled()` *before* the session is logged in. Without this, the user would already be authed before being asked for their second factor.
- **Sessions switched to `database` driver. Central uses the default Laravel `sessions` migration; tenant got `2026_05_02_000022_create_sessions_table.php`.** `SESSION_DOMAIN=null` keeps cookies per-host so a clinic A session never leaks into clinic B (each subdomain gets its own cookie). The `FilesystemTenancyBootstrapper` already handles per-tenant storage paths if anything needs file sessions later.
- **Password rules NOT applied on login.** A user with a strong existing password (set via reset/update) shouldn't fail to log in just because it has unusual characters — Laravel's Password rule is for *new* passwords. Applied to: password update (`PUT /password`) and password reset (`POST /reset-password`). Rule: `Password::min(10)->mixedCase()->numbers()->symbols()`.
- **Old Breeze auth tests deleted.** `AuthenticationTest`, `EmailVerificationTest`, `PasswordConfirmationTest`, `PasswordResetTest`, `PasswordUpdateTest`, `RegistrationTest`, `ProfileTest` all removed. Replaced with the 7 Phase 4 tests, which cover the same ground plus 2FA, throttling, and cross-context auth. `Register.tsx` and `RegisteredUserController` also deleted (no v1 self-signup).
- **`tests/Feature/Auth/TenantLoginTest` and `WrongContextTest` opt out of `RefreshDatabase`** because they create real tenant DBs (DDL auto-commits and breaks transaction rollback). Listed explicitly in `tests/Pest.php` alongside `TenancyTest` and the tenant tests. The other 5 auth tests stay in the RefreshDatabase group since they only touch the central DB.

### Phase 8

- **Nested resources serialize as plain arrays, not `Resource::collection()`.** Laravel's `Resource::collection($items)` wraps the result in `{ data: [...] }`. That's fine for top-level Inertia props (the FE knows to read `.data`), but for nested arrays the FE consumes them as flat lists. Pattern: `'rel' => $this->whenLoaded('rel', fn () => RelResource::collection($this->rel)->resolve($request))`. Calling `->resolve()` materializes the resource into the plain array shape and skips the wrapping. Applied to `MedicalFormResource.sections` and `FormSectionResource.questions`. Same shape was already used by `FormQuestionResource.options` (which manually `->map()`s).
- **`Appointment.scheduled_for`, NOT `Appointment.starts_at`.** The Phase 3 schema named the column `scheduled_for`. Several Phase 8 services and the dashboard controller initially used `starts_at` (matching the Inertia prop name we expose to the FE), which 500'd on every page that touches appointments. Fixed by using `scheduled_for` in DB queries and aliasing to `starts_at` only when serializing to the front-end (`'starts_at' => $a->scheduled_for?->toIso8601String()`). FE TypeScript continues to use `starts_at` since it reads more naturally.
- **`DoctorWorkingHour` doesn't store inactive days at all.** The migration sets `start_time` / `end_time` as NOT NULL, so an "inactive" entry can't be persisted with nulls. The controller deletes the row for any inactive day instead. The `show` method synthesizes an inactive entry per missing day at read time so the UI always renders 7 rows (Sun–Sat).
- **`FormSnapshotService::snapshot()` is the canonical contract** between builder/preview/submission/Phase-10. The shape is intentionally flat (no Eloquent leakage, no relationship lazy-loads), and `version_at` is included so a submission's snapshot is a frozen-at-time-T view of the form. Used by the builder preview to render a live snapshot from the in-memory form state — that means the patient view in preview is BYTE-IDENTICAL to what Phase 10 will render at consultation time.
- **`MedicalFormService::uniqueKey()` always returns a unique key.** Bare label slug is tried first; if it collides, `_2`, `_3`, etc. are appended. Used by the question controller on both create and update paths (passing the question ID as `$ignoreQuestionId` on update so an unchanged label doesn't trigger a rename).
- **dnd-kit param ordering.** Both section and question reorder endpoints accept `{ ids: number[] }` — the array index becomes the new `order` (1-based). Optimistic UI applies the new order locally and POSTs to the server in `preserveScroll` + `only: []` mode, so a slow round-trip doesn't block another drag. If the request fails, the next page reload re-syncs from the server (no rollback in v1; would be a Phase 9+ refinement).
- **`FormQuestion` soft-delete is safe across submissions.** Spec mandated "don't hard-delete questions referenced by submissions." Because submissions store a JSON snapshot of the form at submit time, the live `FormQuestion` row can soft-delete without breaking historical replays. The section-delete path checks `JSON_CONTAINS_PATH(answers, 'one', '$."<key>"')` against `form_submissions` to refuse deletion only when the answers actually contain a key that matches a question in this section. Belt-and-suspenders given the snapshot, but matches the spec wording.
- **`CSVExporter` writes a UTF-8 BOM** before the CSV body so Excel doesn't mangle Arabic. The exporter is dumb on purpose: the caller passes headers + row iterator, the exporter stringifies primitives, formats `DateTime` as `Y-m-d H:i:s`, json-encodes arrays. No locale-aware number formatting (spec doesn't ask for it) — `(string)` casts on numerics keep DB precision intact.
- **Tenant routes wrap up to 53 explicit definitions** because Phase 8 doesn't use `Route::resource`. The trade-off: more verbose, but each route is greppable by name and uses Laravel's named-route URL generator without surprises. Resource controllers would have been shorter for staff/insurance but inconsistent with the form-builder routes (which deliberately scope questions under sections, not forms).
- **`UploadLogoRequest` only allows png/jpg/jpeg/svg up to 1MB.** The path is stored in `clinic_settings.branding.logo_url` as `/storage/branding/<file>` so the global asset URL works directly (which we re-enabled by setting `tenancy.filesystem.asset_helper_tenancy = false` in Phase 7). Per-tenant filesystem isolation still holds because stancl's `FilesystemTenancyBootstrapper` rewires `Storage::disk('public')` → `storage/<tenant_suffix>/app/public/` per request.
- **`TenancyTestSetup::tenantTestCleanup()` was hardened** in this phase (similar to Phase 7's CreateClinic/Suspend tests): wraps the cleanup `Clinic::forceDelete()` calls in `Clinic::withoutEvents(...)` so a partially-cleaned-up state from a previous failed run (DB missing but central row still present, or vice versa) doesn't crash with "database doesn't exist". Then drops the DBs by `SHOW DATABASES LIKE` pattern. This is now the canonical pattern across all multi-tenant tests.
- **Bundle warning unaddressed.** Main bundle is now 520kB minified (+ 376kB recharts vendor on the dashboard). Code-splitting per Inertia route via `import.meta.glob('./Pages/**/*.tsx', { eager: false })` is the obvious next move — the form Builder alone pulls in dnd-kit + react-hook-form + zod + react-colorful, which doesn't need to be on the login page. Phase 9+ should wire `lazy()` per page once a clear pattern is set.

### Phase 7

- **`EnsureCentralContext` and `EnsureClinicActive` are pinned in the middleware priority list.** Laravel auto-sorts a route's middleware stack against `MiddlewarePriority`, where `Illuminate\Contracts\Auth\Middleware\AuthenticatesRequests` (the contract `Authenticate` implements) appears early. Any custom middleware not in that list gets demoted past `auth`. For `central`/`clinic_active` that's a correctness bug: they swap the default guard / verify clinic status, and they MUST run before `auth` evaluates `Auth::check()`. `bootstrap/app.php` calls `prependToPriorityList(before: AuthenticatesRequests::class, prepend: ...)` for both. Symptom when missing: a clean login posts succeed, but `GET /` then redirects back to `/login` because `auth` sees the wrong default guard.
- **`tenancy.filesystem.asset_helper_tenancy` is OFF.** stancl's default rewires `asset()` (and Vite's emitted asset URLs) through its `tenancy.asset` route, which only knows how to serve files out of `storage/app/public/`. Vite ships build output to `public/build/`, so every asset URL in tenant context 404s and the page renders blank. We disable the rewrite globally; any tenant-scoped upload (patient files, doctor avatars, etc.) calls `tenant_asset()` explicitly so it goes through the per-tenant filesystem disk that stancl already configured.
- **`<Toaster />` reads theme from the DOM, not from `useTheme`.** Toaster mounts at the app root as a sibling of `<App />`, so it can't call any hook that depends on Inertia's `usePage()` context. `Components/ui/sonner.tsx` uses a tiny `useDomTheme()` that reads `documentElement.classList` and watches it via `MutationObserver`. Both the pre-paint script in `app.blade.php` and the in-app `useTheme()` toggle keep the `dark` class accurate, so this is robust without coupling.
- **`EnsureClinicActive` reads status fresh on every request, not from `tenant()`.** Stancl's `Tenancy::initialize($tenant)` short-circuits when re-called with the same tenant key in one process — it leaves the in-memory Clinic stale rather than swapping in the freshly-resolved one. That's a perf optimization in stancl, but it's a security gap for status checks: a long-running queue worker, a test runner, or any scenario that hits `initialize()` twice in a process keeps serving traffic for a clinic that was just suspended. The middleware does a one-row lookup (`Clinic::query()->whereKey(...)->first()`) per request and trusts that, not `tenant()`. Cost is one cheap central-DB select per tenant request.
- **`CreateClinicAction` is NOT wrapped in `DB::transaction`.** Stancl's `TenantCreated` pipeline runs `CREATE DATABASE` (DDL) inside the create flow, which implicitly commits any open transaction and then crashes the outer commit with "no active transaction". Instead the action wraps the central writes in a try/catch that hard-deletes the central record on any error (`Clinic::forceDelete()` fires `DeleteDatabase`, cleaning up the tenant DB too). This is one of those places where Eloquent's "transactions inside model events" assumption breaks down for multi-DB setups.
- **`CentralConnection` trait applied to every central-only Eloquent model.** When a request runs with tenancy initialized (e.g., clinic creation, suspend-during-tenant-context, the aggregation job iterating tenants), Eloquent's default connection is the active tenant DB. Without `CentralConnection`, a `CentralAuditLog::create()` call inside `SuspendClinicAction` would write to the tenant DB and crash because the table only exists centrally. Trait applied to: `User`, `Clinic` (already had it via `BaseTenant`), `SubscriptionPlan`, `Subscription`, `SupportTicket`, `GlobalSetting`, `CentralAuditLog`.
- **`AggregatePlatformStats` runs synchronously on dashboard "Refresh now" but queues hourly.** The `ShouldQueue` interface puts it on the default queue for the cron tick (`Schedule::job(...)`); the controller bypasses dispatch with `(new AggregatePlatformStats())->handle()` for the manual button so the super admin sees fresh numbers immediately. Cost is bounded — even with 50 clinics, the per-tenant counts are two trivial SELECTs.
- **`auditable_id` widened from `unsignedBigInteger` to `string(64)`.** Phase 2 set up the audit table assuming numeric primary keys; Phase 7 needs to log `Clinic` events whose primary key is a slug string. The migration drops the composite index, changes the column, and recreates the index — no data loss for existing logs (string column can hold the previous numeric values as their text representation).
- **Slug regex `/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/` plus a hard-coded `RESERVED` list (`app`, `admin`, `api`, `www`, `mail`, `central`, `einaya`).** The regex prevents leading/trailing dashes (which break some DNS resolvers) and double-dashes; the reserved list specifically blocks slugs that would collide with our `app.einaya.{ps,test}` central domain or look like a phishing target. Slug is also non-editable post-create (would break the FK chain on subscriptions / audit / domains).
- **Inertia paginator response shape is `{data, meta, links}`.** `XxxResource::collection($paginator)` produces that nested shape automatically. The `Paginated<T>` TS type in `resources/js/types/central.ts` matches it 1:1 — pages just render `paginator.data`, link to `paginator.links.next`, and read `paginator.meta.total/from/to` for the "showing N–M of K" line.
- **Plan delete is soft-delete + reference preservation.** Spec says "edits should preserve historical data" and "don't allow deletion if any active subscription uses the plan". Implementation: count `whereIn('status', ['trial', 'active'])` subscriptions; if zero, soft-delete the plan; the existing subscriptions keep their `plan_id` foreign key pointing at the now-trashed plan, and `Subscription->plan()` works fine because the relationship doesn't apply soft-delete scoping by default.
- **Ticket responses append to `body` with a date stamp instead of going to a `ticket_messages` table.** Single-table keeps Phase 7 small; the format `\n\n--- {datetime} (admin) ---\n{response}` is greppable and trivially parseable when v2 introduces threaded messages.
- **Tests use `Clinic::withoutEvents(fn () => Clinic::create([...]))` whenever a real tenant DB isn't required.** This skips the `TenantCreated` pipeline (no DB creation, no migrations), keeping `RefreshDatabase`-using tests fast and free of cross-test tenant-DB leakage. The two tests that DO need a real tenant DB (`CreateClinicTest`, `SuspendClinicTest`) opt out of `RefreshDatabase` and run their own cleanup helpers that drop databases by prefix.
- **Test cleanup helpers use `forceDelete()` inside `Clinic::withoutEvents(...)` then drop the DBs by `SHOW DATABASES LIKE` pattern.** A previous failed run can leave half-state — central row gone but tenant DB still around, or vice versa. The two-step cleanup (delete-without-events first, then DROP IF EXISTS) handles either failure mode.
- **Clinic ID is the slug string.** Phase 1 already set this up (the stancl tenant_id is `$clinic->id`), but Phase 7 makes it visible: every URL like `/clinics/{clinic}` binds against the string ID, every resource serializes `id` as a string, every audit row carries the slug as `auditable_id`. No numeric-ID indirection.
- **`auth.user!` non-null assertions remain.** PageProps types `auth.user` as `User | null` to support the unauthenticated tenant welcome page. Every Phase 7 page is auth-required, so a `!` assertion is correct (and minimal — the page renders inside `CentralLayout` which itself only mounts after middleware says you're a super admin).
- **`router.post('/api/aggregate-stats', {}, { onFinish })` rather than `axios.post(...)`.** Inertia's `router` carries the CSRF token + handles flash redirects automatically. The endpoint redirects back via `back()->with('success', ...)`, which `useFlashToasts()` then surfaces as a Sonner toast. No JSON API needed.

### Phase 6

- **Self-rolled `useTheme()` over `next-themes`.** next-themes is great for Next.js (it owns the document head and body), but in our Inertia/Blade setup we needed: (a) backend persistence, (b) a pre-paint script in Blade that runs *before* React mounts, (c) compatibility with the `<html>` `dir`/`lang` attributes Blade sets server-side. A single hook (44 lines) handles all three; the shadcn `sonner.tsx` component was patched to use it.
- **Tailwind tokens in RGB triplets, not HSL.** The shadcn `init` command produced HSL-format sidebar tokens that clashed with the rest of our palette. Standardizing on `rgb(var(--token) / <alpha-value>)` everywhere keeps the `<alpha-value>` shorthand working with utilities like `bg-primary/15`, which we use heavily in `StatusBadge`. Trade-off: re-running `shadcn add` will overwrite this and must be diffed.
- **Language switcher does a full page reload.** Inertia partial reloads can swap the JSON props but can't re-paint the `<html dir>`/`lang`/font-family chain in one tick — and forcing a hard reload also lets the in-page Blade boot script set the right pre-paint state for the new locale. This is intentional, not a TODO.
- **Pre-paint theme script in `app.blade.php`.** Reads `localStorage['einaya-theme']` first, falls back to the user's stored pref, falls back to OS preference, then sets `document.documentElement.classList` BEFORE Vite assets load. Without this, every navigation would flash light-mode for ~80–120ms while React mounts. The same script also reads `auth()->user()->theme_preference` server-side as a tertiary fallback so first-paint-after-login is correct without client storage.
- **`<html dir>` set by Blade, not React.** The dir attribute is computed from `session('locale') ?? user->preferred_language ?? app->getLocale()` in the layout view. React-driven dir-swapping would mean a flash of LTR content for AR users on first paint. Reload-on-locale-change keeps this server-rendered.
- **`HandleInertiaRequests` shares `auth.isSuperAdmin`** as a precomputed boolean. The frontend uses this to decide which layout to mount (`AppLayout` vs `CentralLayout`) and whether `/design-system` is reachable, without having to inspect the user model client-side. The central super admin's user model has no `HasRoles` trait, so we can't infer "super admin" from `roles` alone.
- **Sidebar side computed from `useDirection()`.** shadcn's `<Sidebar side="left|right">` accepts a literal value; passing `side={direction === 'rtl' ? 'right' : 'left'}` mirrors the entire sidebar including its drawer behavior on mobile. Combined with `tailwindcss-rtl` and logical-property classes (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`), the layout swaps without per-component RTL conditionals.
- **Sonner is mounted once at app root** (in `app.tsx`, inside `<TooltipProvider>` so all toast actions can have tooltips). Pages opt-in to flash-toast forwarding via `useFlashToasts()` — kept as an opt-in hook rather than a layout-level effect so flash propagation is explicit and easy to disable on pages that handle their own success/error UI.
- **`AllowDesignSystem` middleware uses `app()->environment('local', 'development')`** rather than `app()->isLocal()`. The latter only checks for `local`; we treat both `local` and `development` (and *only* those) as "you can see internals." Production super admins can still see it because it's a useful debugging surface for them.
- **Three i18n namespaces shipped now:** `common` (nav, actions, status, topbar, language, empty, table), `auth` (login, 2FA), `dashboard` (welcome, stats). Phase 7+ adds `patients`, `appointments`, `consultations`, `forms`, `payments`, `staff`, `settings` as those features ship — keeps each namespace's JSON file small and lazy-load-ready.
- **`User | null` in `PageProps.auth.user`.** Most pages assume an authenticated user, but `Tenant/Welcome.tsx` (unauthenticated tenant landing) doesn't. Typing it as nullable is honest; the two surviving Breeze files (`AuthenticatedLayout`, `UpdateProfileInformationForm`) use a `!` non-null assertion since their middleware guarantees a user.
- **Bundle size warning is acknowledged, not fixed.** Phase 6 ships a 506kB main bundle (167kB gzip) because every shadcn primitive + i18n + TanStack table + Sonner + lucide is statically imported. Code-splitting is a Phase-7 concern: route-level `lazy()` for `DesignSystem` and the per-feature pages, and a separate locale-fetch path so AR users don't ship EN strings (and vice versa).

### Phase 3

- **Auto-provisioning hook lives in `App\Jobs\Tenancy\SeedTenantDatabaseInDev`**, wired into `TenancyServiceProvider`'s `TenantCreated` `JobPipeline` after `Jobs\CreateDatabase` and `Jobs\MigrateDatabase`. The job is `shouldBeQueued(false)` so it runs synchronously during `Clinic::create()` — the seeder skips itself when `app()->environment('production', 'testing')` to keep prod clean and tests fast. Tests that need seeded data (only `TenancyIsolationTest`) call the seeder explicitly.
- **`DemoClinicSeeder` no longer calls `tenants:migrate` manually** — the JobPipeline does it. Also removed `tenantMigrationsExist()` guard since Phase 3 always has migrations now.
- **Tenant root seeder lives at `Database\Seeders\Tenant\DatabaseSeeder`** and just calls `TenantDemoSeeder`. stancl's default `seeder_parameters['--class']` is the string `'DatabaseSeeder'`, but the SeedTenantDatabaseInDev job invokes the tenant seeder by FQCN, so the central root seeder is never accidentally run inside a tenant DB.
- **Patient code generation lives in `App\Services\Tenant\PatientCodeGenerator`** and is invoked from `Patient::booted()`'s `creating` event. Format `P-%05d`, computed as `max(id) + 1` over `withTrashed()` so soft-deleted IDs don't get reused. Per-tenant counter — verified by `PatientCodeGenerationTest`.
- **Form snapshot shape is built by the seeder and the snapshot test** (matching shape). When Phase 8 builds the form builder UI, the canonical snapshot serializer should move into `App\Services\Tenant\FormSnapshotter` (or similar) and be the single source of truth for both submission writes and historical reads.
- **Three FK delete strategies in tenant schema:** `cascadeOnDelete()` for child rows that can't survive parent removal (`doctor_working_hours`, `doctor_breaks`, `doctor_time_off`, `form_sections`, `form_questions`, `form_question_options`, `prescription_items`); `nullOnDelete()` where the FK is metadata that can disappear (`patients.registered_by`, `patients.insurance_provider_id`, `consultations.appointment_id`, `form_submissions.medical_form_id`, `payments.appointment_id`/`consultation_id`, `tenant_audit_logs.user_id`); `restrictOnDelete()` everywhere else so accidentally hard-deleting a patient/doctor/user fails loudly instead of cascading through medical records.
- **`patients.preferred_language`, `users.preferred_language` cast as `App\Enums\Tenant\PreferredLanguage`** (en/ar) — single shared enum so both staff and patients use the same set of language codes.
- **All FormQuestion/FormSection JSON fields cast as `array`**; `validation_rules` and `conditions` are nullable JSON for v1 (rules) / v2 (conditional logic).
- **Test cleanup helper at `tests/Feature/Tenant/TenancyTestSetup.php`** drops tenant DBs by literal name pattern (`SHOW DATABASES LIKE`) since stancl's tenant DBs are auto-committed DDL and can't be rolled back with `RefreshDatabase`. Each tenant test uses a unique slug prefix (`pesttestiso-`, `pesttestcode-`, `pesttestsnapshot-`, etc.) so two test files never collide on the same DB. `phpunit.xml`'s `TENANCY_DB_PREFIX=einaya_test_tenant_` keeps these databases isolated from any dev tenant DBs.
- **`pest()->extend(...)->in('Feature/Tenant')`** registers the tenant tests *without* `RefreshDatabase` (same opt-out as `TenancyTest`/`ClinicCreationTest`). The folder also contains `TenancyTestSetup.php` — Pest only collects `*Test.php` so the helper isn't run as a test, just `require_once`'d by the actual test files.
- **Patient factory `withInsurance(int $providerId)` state** keeps the seeder simple (~60% of patients get this state) and avoids the factory making its own provider rows.
- **Demo doctor's working schedule is Sun–Thu (`day_of_week` 0–4) 09:00–17:00 with a 13:00–14:00 lunch break** — matches typical Palestinian clinic hours; weekend is Fri/Sat.

---

## Files Modified This Session

### Phase 2 — Created

- `database/migrations/2019_09_15_000010_create_clinics_table.php` (replaces tenants)
- `database/migrations/2026_05_02_000001_create_subscription_plans_table.php`
- `database/migrations/2026_05_02_000002_create_subscriptions_table.php`
- `database/migrations/2026_05_02_000003_add_subscription_id_fk_to_clinics_table.php`
- `database/migrations/2026_05_02_000004_create_global_settings_table.php`
- `database/migrations/2026_05_02_000005_create_central_audit_logs_table.php`
- `database/migrations/2026_05_02_000006_create_support_tickets_table.php`
- `app/Enums/Central/{ClinicStatus,SubscriptionStatus,TicketStatus}.php`
- `app/Models/Central/{User,Clinic,SubscriptionPlan,Subscription,GlobalSetting,CentralAuditLog,SupportTicket}.php`
- `app/Services/Central/AuditLogService.php`
- `database/factories/Central/{UserFactory,ClinicFactory,SubscriptionPlanFactory,SubscriptionFactory}.php`
- `database/seeders/Central/{SuperAdminSeeder,SubscriptionPlansSeeder,DemoClinicSeeder}.php`
- `tests/Feature/Central/{ClinicCreationTest,SubscriptionPlanTest,AuditLogTest}.php`

### Phase 2 — Modified

- `database/migrations/0001_01_01_000000_create_users_table.php` — added 2FA, `is_super_admin`, `preferred_language`, softDeletes
- `database/migrations/2019_09_15_000020_create_domains_table.php` — FK now references `clinics(id)`
- `database/seeders/DatabaseSeeder.php` — wires three Central seeders; removed `WithoutModelEvents`
- `config/auth.php` — `App\Models\Central\User`
- `config/tenancy.php` — `tenant_model => Clinic::class`; prefix/suffix env-driven
- `phpunit.xml` — `TENANCY_DB_PREFIX=einaya_test_tenant_`
- `tests/Pest.php` — RefreshDatabase scope updated; ClinicCreationTest opts out
- `tests/Feature/TenancyTest.php` — uses `Clinic` with full required attributes; cleanup uses configured prefix
- `tests/Feature/ProfileTest.php` — `assertSoftDeleted` instead of `assertNull(fresh)`
- `app/Http/Controllers/Auth/RegisteredUserController.php` — Central\User import
- `app/Http/Requests/ProfileUpdateRequest.php` — Central\User import
- All `tests/Feature/Auth/*.php` — Central\User imports

### Phase 2 — Deleted

- `app/Models/User.php` (replaced by `app/Models/Central/User.php`)
- `app/Models/Central/Tenant.php` (replaced by `app/Models/Central/Clinic.php`)
- `database/factories/UserFactory.php` (moved to `database/factories/Central/UserFactory.php`)
- `app/Enums/Central/.gitkeep`, `app/Services/Central/.gitkeep`

### Phase 3 — Created

- `database/migrations/tenant/2026_05_02_000001..000021_*.php` (21 tenant migrations covering users, doctors+schedule, insurance, patients+files, appointments, consultations, full form builder, form submissions, prescriptions, diagnoses, payments, clinic settings, tenant audit logs)
- `app/Enums/Tenant/{PreferredLanguage,PatientGender,PatientMaritalStatus,PatientFileCategory,AppointmentStatus,FormType,FormQuestionType,PaymentMethod,PaymentStatus}.php`
- `app/Models/Tenant/{User,Doctor,DoctorWorkingHour,DoctorBreak,DoctorTimeOff,InsuranceProvider,Patient,PatientFile,Appointment,Consultation,MedicalForm,FormSection,FormQuestion,FormQuestionOption,FormSubmission,Prescription,PrescriptionItem,Diagnosis,Payment,ClinicSetting,TenantAuditLog}.php`
- `app/Services/Tenant/{PatientCodeGenerator,AuditLogService}.php`
- `app/Jobs/Tenancy/SeedTenantDatabaseInDev.php` (JobPipeline step)
- `database/factories/Tenant/{User,Doctor,InsuranceProvider,Patient,Appointment,Consultation,MedicalForm}Factory.php`
- `database/seeders/Tenant/{DatabaseSeeder,TenantDemoSeeder}.php`
- `tests/Feature/Tenant/{TenancyTestSetup.php,TenancyIsolationTest,PatientCodeGenerationTest,PatientFactoryTest,FormSubmissionSnapshotTest,AppointmentStatusTest}.php`

### Phase 3 — Modified

- `app/Providers/TenancyServiceProvider.php` — `SeedTenantDatabaseInDev::class` added to `TenantCreated` pipeline
- `database/seeders/Central/DemoClinicSeeder.php` — dropped manual `tenants:migrate` and `tenantMigrationsExist()` (the pipeline runs migrations + seeder now)
- `tests/Pest.php` — `Feature/Tenant` opted out of `RefreshDatabase`

### Phase 4 — Created

- `app/Services/TwoFactorService.php`
- `app/Traits/HasTwoFactorAuth.php`
- `app/Support/AuthContext.php` (helper for `central.`/`tenant.` route-name prefix + guard/broker resolution)
- `app/Http/Middleware/EnsureCentralContext.php`
- `app/Http/Middleware/RequireTwoFactor.php`
- `app/Http/Controllers/Auth/TwoFactorChallengeController.php`
- `app/Http/Controllers/Auth/TwoFactorSetupController.php`
- `app/Http/Requests/Auth/TwoFactorChallengeRequest.php`
- `database/migrations/tenant/2026_05_02_000022_create_sessions_table.php`
- `resources/js/Pages/Auth/TwoFactorChallenge.tsx`
- `resources/js/Pages/Auth/TwoFactorSetup.tsx`
- `tests/Feature/Auth/{CentralLoginTest,TenantLoginTest,WrongContextTest,TwoFactorSetupTest,TwoFactorChallengeTest,LoginThrottlingTest,PasswordRequirementsTest}.php`

### Phase 4 — Modified

- `composer.json` / `composer.lock` — added `pragmarx/google2fa-laravel`, `bacon/bacon-qr-code`
- `config/auth.php` — two guards, two providers, two password brokers
- `bootstrap/app.php` — middleware aliases (`central`, `two_factor`); `redirectGuestsTo(fn () => '/login')`
- `app/Providers/TenancyServiceProvider.php` — unchanged from Phase 3
- `app/Models/Central/User.php` + `app/Models/Tenant/User.php` — `HasTwoFactorAuth` trait
- `app/Http/Controllers/Auth/*` — context-aware redirects, password broker selection, password rules
- `app/Http/Controllers/ProfileController.php` — context-aware
- `app/Http/Requests/ProfileUpdateRequest.php` + `Auth/LoginRequest.php` — model resolution by guard, throttling-only login
- `routes/auth.php` — closure-based, name-prefixed
- `routes/web.php` — only marketing root remains
- `routes/central.php` — `central` middleware + auth route inclusion + auth-guarded dashboard
- `routes/tenant.php` — auth route inclusion + auth-aware tenant home
- `resources/js/Pages/Auth/{Login,ForgotPassword,ResetPassword,ConfirmPassword,VerifyEmail}.tsx` — relative URLs
- `resources/js/Pages/Profile/{Edit,Partials/*}.tsx` — relative URLs + 2FA section in Edit
- `resources/js/Layouts/AuthenticatedLayout.tsx` — relative URLs + path-based active state
- `tests/Pest.php` — auth test files split between RefreshDatabase / non-RefreshDatabase groups
- `tests/Feature/TenancyTest.php` — central root assertion changed to `/login` (root now requires auth)
- `.env`, `.env.example` — `SESSION_DRIVER=database`

### Phase 4 — Deleted

- `app/Http/Controllers/Auth/RegisteredUserController.php`
- `resources/js/Pages/Auth/Register.tsx`
- `tests/Feature/Auth/{Authentication,EmailVerification,PasswordConfirmation,PasswordReset,PasswordUpdate,Registration}Test.php`
- `tests/Feature/ProfileTest.php`

### Phase 5 — Created

- `app/Enums/Tenant/{Role,Permission}.php`
- `app/Policies/Tenant/{Patient,Appointment,Consultation,MedicalForm,FormSubmission,Prescription,Diagnosis,Payment,PatientFile,InsuranceProvider,User,Doctor,AuditLog}Policy.php`
- `app/Providers/AuthServiceProvider.php`
- `app/Jobs/Tenancy/SeedTenantRolesPermissions.php`
- `database/seeders/Tenant/RolesAndPermissionsSeeder.php`
- `database/migrations/tenant/2026_05_02_000023_create_permission_tables.php` (moved from default location)
- `config/permission.php` (published)
- `resources/js/types/auth.ts`
- `resources/js/Hooks/useCan.ts`
- `resources/js/Components/domain/Can.tsx`
- `tests/Feature/Tenant/Authorization/{RoleAssignment,ClinicAdminFullAccess,SecretaryCannotViewMedical,DoctorCanManageForms,PolicyEnforcement}Test.php`

### Phase 5 — Modified

- `composer.json` / `composer.lock` — added `spatie/laravel-permission`
- `config/permission.php` — `cache.store` switched to `array`
- `bootstrap/providers.php` — `AuthServiceProvider` registered
- `app/Providers/TenancyServiceProvider.php` — `SeedTenantRolesPermissions` added to pipeline before demo seeder
- `app/Models/Tenant/User.php` — `HasRoles` trait
- `app/Http/Middleware/HandleInertiaRequests.php` — shares `auth.permissions`, `auth.roles`, and a `flash` bag
- `database/seeders/Tenant/TenantDemoSeeder.php` — assigns `clinic_admin`+`doctor` and `secretary` roles
- `resources/js/types/index.d.ts` — `auth.permissions` + `auth.roles` typed via `auth.ts`

### Phase 8 — Created

- `app/Services/Tenant/{FormSnapshotService,MedicalFormService,StatsService,ReportService,CSVExporter}.php`
- `app/Http/Controllers/Tenant/{Dashboard,Staff,DoctorProfile,WorkingHours,Settings,InsuranceProvider,Report,Audit,MedicalForm,FormSection,FormQuestion,FormSubmission}Controller.php`
- `app/Http/Requests/Tenant/{StoreStaff,UpdateStaff,UpdateDoctorProfile,UpdateWorkingHours,StoreBreak,StoreTimeOff,UpdateClinicSettings,UploadLogo,StoreInsuranceProvider,UpdateInsuranceProvider,StoreForm,UpdateForm,StoreSection,UpdateSection,StoreQuestion,UpdateQuestion,Reorder}Request.php`
- `app/Http/Resources/Tenant/{Staff,Doctor,InsuranceProvider,MedicalForm,FormSection,FormQuestion,FormSubmission,AuditLog}Resource.php`
- `resources/js/types/tenant.ts`
- `resources/js/Components/domain/forms/FormRenderer.tsx`
- `resources/js/Pages/Tenant/Dashboard.tsx` (rewrote — was a stub from Phase 6)
- `resources/js/Pages/Tenant/Staff/Index.tsx`
- `resources/js/Pages/Tenant/Doctor/{Profile,WorkingHours}.tsx`
- `resources/js/Pages/Tenant/Settings/Index.tsx`
- `resources/js/Pages/Tenant/InsuranceProviders/Index.tsx`
- `resources/js/Pages/Tenant/Reports/Index.tsx`
- `resources/js/Pages/Tenant/Audit/Index.tsx`
- `resources/js/Pages/Tenant/Forms/{Index,Builder,Submissions,Submission}.tsx`
- `resources/js/locales/{en,ar}/tenant.json`
- `tests/Feature/Tenant/{FormBuilder,StaffManagement,WorkingHours,InsuranceProvider,Reports,BrandingUpload}Test.php`

### Phase 8 — Modified

- `package.json` — added `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `react-colorful` (react-hook-form / zod / @hookform/resolvers were already pinned).
- `routes/tenant.php` — 53 new routes wired behind auth, with explicit `Route::bind` for `staff` / `form` / `section` / `question` / `submission` / `break` / `time_off` / `insurance_provider`.
- `resources/js/i18n.ts` — registers the `tenant` namespace.
- `tests/Feature/Tenant/TenancyTestSetup.php` — `tenantTestCleanup()` now uses `Clinic::withoutEvents()` + `forceDelete()` so partial failure states don't deadlock subsequent runs.

### Phase 8 — Deleted

_(none)_

### Phase 7 — Created

- `app/Http/Middleware/{EnsureSuperAdmin,EnsureClinicActive}.php`
- `app/Http/Controllers/Central/{Dashboard,Clinic,Plan,Subscription,Ticket,Audit,Setting}Controller.php`
- `app/Http/Requests/Central/{StoreClinic,UpdateClinic,StorePlan,UpdatePlan,UpdateTicket,UpdateSubscription,UpdateSettings}Request.php`
- `app/Http/Resources/Central/{Clinic,Plan,Subscription,Ticket,AuditLog}Resource.php`
- `app/Actions/Central/{CreateClinic,SuspendClinic,ChangeClinicPlan}Action.php`
- `app/Jobs/Central/AggregatePlatformStats.php`
- `database/migrations/2026_05_06_000001_change_central_audit_logs_auditable_id_to_string.php`
- `resources/js/types/central.ts`
- `resources/js/Pages/Central/Dashboard.tsx` (rewrote — was a stub)
- `resources/js/Pages/Central/Clinics/{Index,Show}.tsx`
- `resources/js/Pages/Central/Plans/Index.tsx`
- `resources/js/Pages/Central/Subscriptions/Index.tsx`
- `resources/js/Pages/Central/Tickets/{Index,Show}.tsx`
- `resources/js/Pages/Central/Audit/Index.tsx`
- `resources/js/Pages/Central/Settings/Index.tsx`
- `resources/js/locales/{en,ar}/central.json`
- `tests/Feature/Central/{CreateClinic,SuspendClinic,PlanCannotBeDeleted,AuditLogCreatedOnClinicSuspension,OnlySuperAdminCanAccess}Test.php`

### Phase 7 — Modified

- `composer.json` — none
- `package.json` — added `recharts ^3.8`
- `app/Models/Central/User.php` — `CentralConnection` trait
- `app/Models/Central/SubscriptionPlan.php` — `CentralConnection` trait
- `app/Models/Central/Subscription.php` — `CentralConnection` trait
- `app/Models/Central/SupportTicket.php` — `CentralConnection` trait
- `app/Models/Central/GlobalSetting.php` — `CentralConnection` trait
- `app/Models/Central/CentralAuditLog.php` — `CentralConnection` trait
- `app/Models/Central/Clinic.php` — added `isActive()`, `isSuspended()`, `activeSubscription()` helpers
- `bootstrap/app.php` — added `super_admin` and `clinic_active` middleware aliases; pinned `EnsureCentralContext` and `EnsureClinicActive` ahead of `AuthenticatesRequests` in the middleware priority list (post-completion fix — see Phase 7 decisions)
- `config/tenancy.php` — `filesystem.asset_helper_tenancy` set to `false` so Vite's `/build/...` URLs are NOT rewritten through stancl's `tenancy.asset` route (post-completion fix — was making every tenant page render blank)
- `resources/js/Components/ui/sonner.tsx` — replaced `useTheme()` (which depends on Inertia's `usePage`) with a self-contained `useDomTheme()` so the Toaster can mount outside the `<App />` tree without throwing (post-completion fix)
- `routes/central.php` — replaced single-route block with full `auth + super_admin` route group covering 30 routes (clinics, plans, subscriptions, tickets, audit, settings, dashboard, refresh-stats, prefs)
- `routes/tenant.php` — added `clinic_active` middleware to the tenancy group
- `routes/console.php` — schedules `AggregatePlatformStats` hourly
- `resources/js/i18n.ts` — registers the `central` namespace
- `tests/Pest.php` — `PreferencesTest`, `PlanCannotBeDeletedTest`, `AuditLogCreatedOnClinicSuspensionTest`, `OnlySuperAdminCanAccessTest` in the RefreshDatabase group; `CreateClinicTest`, `SuspendClinicTest` in the non-RefreshDatabase group

### Phase 7 — Deleted

_(none)_

### Phase 6 — Created

- `tailwind.config.ts` (replaces `tailwind.config.js`)
- `components.json` (shadcn registry config)
- `resources/css/app.css` (rewritten with full token block)
- `resources/js/lib/utils.ts` (`cn()` helper)
- `resources/js/Components/ui/{accordion,alert,alert-dialog,avatar,badge,breadcrumb,button,calendar,card,checkbox,command,dialog,dropdown-menu,form,input,label,navigation-menu,pagination,popover,progress,radio-group,scroll-area,select,separator,sheet,sidebar,skeleton,sonner,switch,table,tabs,textarea,tooltip}.tsx` (33 shadcn primitives — `sonner.tsx` modified to use our `useTheme`)
- `resources/js/Components/domain/{AppBreadcrumb,ConfirmDialog,DataTable,EmptyState,FormModal,LoadingSpinner,PageHeader,PageSkeleton,StatusBadge}.tsx`
- `resources/js/Components/domain/layout/{AppSidebar,AppTopbar,CentralSidebar,LanguageSwitcher,SidebarBrand,ThemeToggle,UserMenu}.tsx`
- `resources/js/Hooks/{useDirection,useFlashToasts,useLocale,useTheme}.ts`
- `resources/js/Hooks/use-mobile.tsx` (shipped by shadcn `sidebar`)
- `resources/js/Layouts/{AppLayout,CentralLayout}.tsx`
- `resources/js/Pages/{DesignSystem,Tenant/Dashboard,Central/Dashboard}.tsx`
- `resources/js/i18n.ts`
- `resources/js/locales/{en,ar}/{common,auth,dashboard}.json`
- `app/Http/Controllers/PreferenceController.php`
- `app/Http/Middleware/{SetLocale,AllowDesignSystem}.php`
- `database/migrations/2026_05_05_000001_add_theme_preference_to_users.php`
- `database/migrations/tenant/2026_05_05_000001_add_theme_preference_to_users.php`
- `tests/Feature/Central/PreferencesTest.php` (4 tests)

### Phase 6 — Modified

- `package.json` / `pnpm-lock.yaml` — added: tailwindcss@^3.4 (upgraded from 3.2.1), tailwindcss-animate, tailwindcss-rtl, @tailwindcss/typography, class-variance-authority, clsx, tailwind-merge, lucide-react, sonner, cmdk, vaul, next-themes (transitive shadcn dep — unused at runtime), date-fns, react-day-picker, @tanstack/react-table, i18next, react-i18next, i18next-browser-languagedetector, plus 19 `@radix-ui/react-*` primitives.
- `resources/js/app.tsx` — imports `i18n.ts`, mounts `<TooltipProvider>` + `<Toaster>` at root, swaps progress bar color to primary blue.
- `resources/js/types/index.d.ts` — `User` interface picks up `preferred_language` + `theme_preference`; new `Preferences` type; `PageProps.auth.user` now `User | null`; `PageProps.auth.isSuperAdmin` boolean; new `PageProps.preferences`.
- `resources/views/app.blade.php` — server-renders `<html lang dir>`, embeds Google Fonts (Manrope + IBM Plex Sans Arabic + JetBrains Mono), runs pre-paint theme script.
- `app/Models/Central/User.php`, `app/Models/Tenant/User.php` — added `theme_preference` to `$fillable`.
- `app/Http/Middleware/HandleInertiaRequests.php` — shares `preferences` and `auth.isSuperAdmin`.
- `bootstrap/app.php` — `SetLocale` prepended to web group; aliases `central`, `two_factor`, `design_system`.
- `routes/central.php` — renames root render to `Central/Dashboard`; adds `/api/preferences/{language,theme}` (auth) + `/api/preferences/language/guest` + `/design-system` (`design_system` middleware).
- `routes/tenant.php` — adds `/api/preferences/{language,theme}` + guest variant + `/design-system`.
- `resources/js/Layouts/AuthenticatedLayout.tsx`, `resources/js/Pages/Profile/Partials/UpdateProfileInformationForm.tsx` — `auth.user!` non-null assertion to satisfy the new nullable type.
- `resources/js/Components/ui/button.tsx` — sized to spec (`h-11` default, `h-14` lg, `icon: h-11 w-11`).
- `resources/js/Components/ui/input.tsx` — sized to spec (`h-11`, ring-2).
- `tests/Pest.php` — `Feature/Central/PreferencesTest.php` added to `RefreshDatabase` group.

### Phase 6 — Deleted

- `resources/js/Pages/Central/SuperAdmin.tsx` (replaced by `Central/Dashboard.tsx`)
- `tailwind.config.js` (replaced by `tailwind.config.ts`)

### Phase 5 — Post-completion fix

- **Added `database/migrations/tenant/2026_05_02_000024_create_cache_table.php`** (tables `cache` + `cache_locks`). Logging in at a tenant subdomain blew up with "Table 'einaya_tenant_demo.cache' doesn't exist" — Laravel's `RateLimiter` uses the `database` cache store, and stancl's `CacheTenancyBootstrapper` routes that store to the active tenant DB. Mirroring the central `cache_table` migration into the tenant folder fixes the rate limiter, any future tagged caches, and per-clinic memoization. (Spatie's permission cache stays on the `array` driver — it doesn't need to persist between requests.)

### Background processes
- Vite dev server running with PID in `storage/logs/vite.pid`, log in `storage/logs/vite.log` (HTTPS via Herd cert at `https://einaya.test:5173`).

### Known one-time setup performed (manual + via this session)
- `einaya_central` MySQL DB created (manual: `mysql -u root -prootroot -e "CREATE DATABASE einaya_central ..."`)
- `einaya_central_testing` MySQL DB created (for `APP_ENV=testing` runs)
- `demo` tenant created → `einaya_tenant_demo` MySQL DB exists
- Herd: `einaya.test` parked + wildcard subdomains enabled

---

## How to Resume (next session)

1. Open fresh Claude conversation
2. Paste `ai/00-master-spec.md`
3. Paste `ai/PROGRESS.md` (this file, with latest updates)
4. Paste the active phase prompt from `ai/prompts/phase-03-*.md`
5. Say: "Continue from where the previous session left off. Don't regenerate completed work."

If the Vite dev server is dead between sessions: `pnpm dev` in a new terminal, or `php artisan serve` (Laravel built-in) plus `pnpm build` for static assets.
