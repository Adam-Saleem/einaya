# Phase 6 — UI Foundation: shadcn, Layout, i18n, RTL, Dark Mode

> **Prerequisite:** Paste `00-master-spec.md` above this prompt. Phases 1-5 must be complete.
> **Also reference:** `ai/design/tokens-final.md` (you must fill this from your Stitch screens BEFORE running this phase).

## Goal

Build the visual foundation of Einaya: install shadcn/ui, wire in design tokens, build the dashboard layout shell, enable English/Arabic with full RTL, add dark/light mode toggle, and create a "design system showcase" page to verify the look.

**This phase is purely visual scaffolding** — no business features.

## Prerequisites — DO BEFORE THIS PHASE

1. Generate 2-3 Stitch screens (dashboard, form, table)
2. Extract design tokens into `ai/design/tokens-final.md` using the worksheet template
3. Drop Stitch HTML/CSS exports into `ai/design/stitch-screens/`
4. Drop screenshots into `ai/design/stitch-screenshots/`
5. Have these tokens ready to paste into the prompt

## Requirements

### 1. Install shadcn/ui

- Initialize: `pnpm dlx shadcn@latest init`
- Configure paths matching our structure:
  - Components: `resources/js/Components/ui`
  - Utils: `resources/js/lib/utils`
  - Tailwind config: existing
- Choose `New York` style, base color matching primary token

### 2. Apply Design Tokens

Use the values from `ai/design/tokens-final.md` (paste them into the prompt context).

Update `resources/css/app.css` with:
- Light mode CSS variables (all tokens)
- Dark mode CSS variables (`.dark` selector)

Update `tailwind.config.ts` with:
- Custom colors mapped to CSS variables
- Custom font families: `sans` (Latin), `arabic` (Arabic), `mono`
- Custom border radius scale
- Custom spacing if specified
- Plugins: `@tailwindcss/forms`, `@tailwindcss/typography`, `tailwindcss-rtl`

### 3. Install Required shadcn Components

Run `pnpm dlx shadcn@latest add` for each:

Layout:
- `sidebar`, `sheet`, `separator`, `scroll-area`, `breadcrumb`

Navigation:
- `dropdown-menu`, `navigation-menu`, `tabs`

Forms:
- `button`, `input`, `textarea`, `label`, `checkbox`, `radio-group`, `select`, `switch`, `form`, `combobox` (via command)

Data:
- `table`, `card`, `badge`, `avatar`, `skeleton`

Feedback:
- `alert`, `alert-dialog`, `dialog`, `toast` (sonner), `tooltip`, `popover`

Date:
- `calendar`, `popover`, `date-picker` (composed)

Other:
- `command`, `pagination`, `progress`, `accordion`

### 4. Layout Shell

Build `resources/js/Layouts/AppLayout.tsx` — used by all authenticated pages.

Structure:
```
┌────────────────────────────────────────────────┐
│  Topbar (Logo · Search · Notifications · User) │
├──────────┬─────────────────────────────────────┤
│          │  Breadcrumb                          │
│ Sidebar  │  Page Header                         │
│  (nav)   │  ─────                               │
│          │  Page Content                        │
│          │                                      │
└──────────┴─────────────────────────────────────┘
```

Components:

**`<AppSidebar />`** (in `Components/domain/layout/`)
- Logo at top
- Navigation items grouped by section:
  - Section: Main (Dashboard, Patients, Appointments)
  - Section: Medical (Consultations, Forms, Prescriptions) — only visible to doctors
  - Section: Billing (Payments, Reports)
  - Section: Admin (Staff, Settings, Branding) — only visible to admin
- Collapsible (icon-only mode for small screens)
- Active route highlighting
- Each item wrapped in `<Can permission="..." />`

**`<AppTopbar />`** (in `Components/domain/layout/`)
- Mobile menu trigger (md:hidden)
- Global search (cmd+k)
- Language switcher (EN / AR)
- Theme toggle (light / dark)
- Notifications dropdown (placeholder bell icon, no notifications yet)
- User dropdown (profile, settings, logout)

**`<PageHeader />`** (in `Components/domain/`)
- Props: `title`, `description?`, `actions?` (slot for buttons)
- Renders: large heading + description + action buttons in top-right

**`<Breadcrumb />`** integration
- Auto-generated from route, or pass items prop

### 5. Layout for Central (Super Admin)

`resources/js/Layouts/CentralLayout.tsx` — same skeleton, different sidebar:
- Section: Platform (Dashboard, Clinics, Subscriptions)
- Section: Operations (Support Tickets, Audit Logs)
- Section: Settings (Plans, Global Settings)

### 6. Theme Toggle (Dark/Light)

- Use `next-themes` adapted for Inertia, OR roll a simple solution:
  - Persist preference in `localStorage` AND on `users.theme_preference` (add column via migration in this phase)
  - Apply `class="dark"` on `<html>` based on preference
  - Default: system preference
- Component: `<ThemeToggle />` in topbar — sun/moon icon, dropdown with Light / Dark / System

### 7. Internationalization (i18n)

- Install: `pnpm add i18next react-i18next i18next-browser-languagedetector`
- Configure `resources/js/i18n.ts`:
  - Languages: `en`, `ar`
  - Default: based on user preference, fallback to browser, fallback to `ar`
  - Namespace structure: `common`, `auth`, `patients`, `appointments`, `consultations`, `forms`, `payments`, `staff`, `settings`
- Translation files in `resources/js/locales/{en,ar}/{namespace}.json`
- Initial translations:
  - `common.json`: navigation labels, common buttons (save, cancel, delete, edit, etc.), status labels
  - `auth.json`: login, logout, 2FA labels
  - All sidebar menu items
  - All topbar items

Hook: `const { t } = useTranslation('common');`

### 8. RTL Support

When language is `ar`:
- Set `<html dir="rtl" lang="ar">`
- Body uses `font-arabic` instead of `font-sans`
- All Tailwind logical properties used: `ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`
- Icons that have directional meaning (back arrow, forward arrow) flip automatically
- Sidebar appears on the right side in RTL

When language is `en`:
- `<html dir="ltr" lang="en">`
- `font-sans`
- Sidebar on the left

A `useDirection()` hook provides the current direction.

### 9. Language Switcher

Component `<LanguageSwitcher />` in topbar:
- Dropdown with EN / AR
- On change:
  - Update i18next instance
  - Persist to backend via Inertia POST to `/api/preferences/language` → updates `users.preferred_language`
  - Reload page to reflect dir change

### 10. Reusable Patterns

Build these as documented patterns in `Components/domain/`:

**`<DataTable />`**
- Wraps TanStack Table v8 + shadcn Table
- Built-in: pagination, sorting, column toggling, search input, row actions
- Generic typed props
- Used by every list page (patients, appointments, payments, etc.)

**`<FormModal />`**
- Wraps shadcn Dialog
- Form inside, with save/cancel buttons
- Loading state on submit
- Auto-handles Inertia errors

**`<EmptyState />`**
- Icon, heading, description, optional action button
- Used when lists are empty

**`<StatusBadge />`**
- Maps enum values to colored badges
- Variants: success (green), warning (yellow), info (blue), danger (red), neutral (gray)

**`<ConfirmDialog />`**
- Generic destructive action confirmation
- Wraps shadcn AlertDialog

**`<LoadingSpinner />`**, **`<PageSkeleton />`**

### 11. Toast / Notifications

- Sonner is shadcn's recommended toaster
- Mount `<Toaster />` once in app root
- Hook: `import { toast } from 'sonner'`
- Inertia error/success messages auto-converted to toasts via shared middleware

### 12. Design System Showcase Page

Build `resources/js/Pages/DesignSystem.tsx` (only visible in dev / with super admin role).

Renders ALL the components on one page so you can verify the visual identity:
- Color swatches (all tokens light + dark)
- Typography scale
- All button variants and sizes
- Form fields (input, textarea, select, checkbox, radio, date picker)
- Cards
- Tables
- Badges
- Alerts
- Dialogs (triggered by buttons)
- Empty states
- Loading states
- Navigation elements

Available at `/design-system` (gated by middleware: dev env OR super admin).

This page is your QA checkpoint — if it looks right here, the whole app will look right.

### 13. Dashboard Stub Pages

Just placeholder pages that use `AppLayout` so we can verify the shell works:
- `Pages/Tenant/Dashboard.tsx` — "Welcome, {user name}" + 4 stat cards (mock data)
- `Pages/Central/Dashboard.tsx` — "Super Admin Dashboard" + 4 stat cards

Real dashboards built in Phases 7-10.

## Deliverables

### Frontend
- shadcn installed and configured
- All listed components installed
- Tailwind config with tokens, fonts, RTL plugin
- `resources/css/app.css` with full token set (light + dark)
- `AppLayout.tsx`, `CentralLayout.tsx`
- All layout components (sidebar, topbar, page header, breadcrumb)
- All reusable patterns (DataTable, FormModal, EmptyState, StatusBadge, ConfirmDialog)
- i18n setup + initial EN/AR translations
- RTL support verified
- Theme toggle working
- Language switcher working
- Sonner toaster mounted
- Design System showcase page

### Backend
- Migration adding `theme_preference` column to both `users` tables
- Endpoint: `POST /api/preferences/language` and `POST /api/preferences/theme` to persist
- Updated `HandleInertiaRequests` to share locale and theme

### Tests
- Pest test: language preference persists after switch
- Pest test: theme preference persists
- Visual smoke test (manual): switch to AR, verify dir=rtl, verify sidebar on right, verify font swap

## Constraints

- All hard-coded strings forbidden — use `t('key')` for everything user-facing
- All margins/paddings use logical properties (ms/me/ps/pe), never directional (ml/mr/pl/pr)
- All component file names PascalCase, hooks camelCase prefixed with `use`
- TypeScript strict mode — no `any`
- Every reusable component in `Components/domain/` has a TypeScript interface for props
- Don't create more components than listed — this phase is foundation, not features

## Definition of Done

- [ ] Login at `demo.einaya.test` → see new `AppLayout` with sidebar + topbar
- [ ] Login at `app.einaya.test` → see `CentralLayout`
- [ ] Theme toggle switches dark/light immediately, persists across page reloads
- [ ] Language switcher swaps EN ↔ AR, dir flips, font swaps, sidebar moves side
- [ ] All sidebar items hidden/shown correctly based on permissions
- [ ] `/design-system` renders all components correctly in both light and dark modes
- [ ] `/design-system` renders correctly in both LTR and RTL
- [ ] No console errors, no TypeScript errors
- [ ] Toast appears when triggered manually
- [ ] Mobile responsive: sidebar collapses to drawer on small screens

## Notes for Future Phases

- Phases 7-10 all use `AppLayout` and `DataTable`/`FormModal` — never inline these
- New translations go into appropriate namespace files
- New components go into `Components/domain/` with typed props
- New page must be visually consistent with `/design-system` showcase
