# Phase 5 — Roles, Permissions & Policies

> **Prerequisite:** Paste `00-master-spec.md` above this prompt. Phases 1-4 must be complete.

## Goal

Wire up `spatie/laravel-permission` in tenant context, define all roles and permissions, write policies for every model, and ensure authorization is enforced throughout the app.

## Requirements

### 1. Spatie Permission Setup

- Install: `composer require spatie/laravel-permission`
- Publish migrations and config
- **Important:** the package's tables (`roles`, `permissions`, `model_has_roles`, `model_has_permissions`, `role_has_permissions`) live in the **tenant DB**, not central. Move the migrations to `database/migrations/tenant/`.
- Configure the package to use the tenant's database connection.
- Add `HasRoles` trait to `app/Models/Tenant/User.php`.

For super admins (central), do NOT use Spatie. They have a single `is_super_admin` boolean flag — that's enough for v1.

### 2. Roles

Define these roles, seeded into every new tenant:

- **clinic_admin** — full access within clinic
- **doctor** — access to consultations, patients, forms (in v1, same user as clinic_admin)
- **secretary** — patient registration, appointments, billing
- **nurse** *(v2)* — defined but not assigned in v1

### 3. Permissions

Define a comprehensive set of permissions, grouped by resource:

**Patients**
- `patients.view`
- `patients.create`
- `patients.update`
- `patients.delete`
- `patients.view_medical` *(separate from view — only doctors see medical summary)*

**Appointments**
- `appointments.view`
- `appointments.create`
- `appointments.update`
- `appointments.cancel`
- `appointments.delete`

**Consultations**
- `consultations.view`
- `consultations.create`
- `consultations.update`
- `consultations.delete`

**Medical Forms**
- `forms.view`
- `forms.manage`     *(create/edit/delete forms — doctor only)*
- `forms.submit`     *(submit a form during consultation — doctor only)*

**Prescriptions**
- `prescriptions.view`
- `prescriptions.create`
- `prescriptions.update`
- `prescriptions.delete`

**Diagnoses**
- `diagnoses.view`
- `diagnoses.create`
- `diagnoses.update`
- `diagnoses.delete`

**Payments**
- `payments.view`
- `payments.create`
- `payments.refund`

**Patient Files**
- `files.view`
- `files.upload`
- `files.delete`

**Insurance Providers**
- `insurance.view`
- `insurance.manage`

**Staff Management**
- `staff.view`
- `staff.create`
- `staff.update`
- `staff.delete`

**Doctor Settings**
- `doctor.view_profile`
- `doctor.update_profile`
- `doctor.manage_hours`

**Clinic Settings**
- `clinic.view_settings`
- `clinic.update_settings`
- `clinic.update_branding`

**Reports**
- `reports.view`
- `reports.export`

**Audit Logs**
- `audit.view`

### 4. Role → Permission Mapping

**clinic_admin** — ALL permissions

**doctor** — same as clinic_admin in v1, but conceptually:
- All patient permissions including `patients.view_medical`
- All consultations, forms, prescriptions, diagnoses
- Read-only on staff, payments, reports
- Cannot manage clinic settings or branding (those are admin-only conceptually, even if same person)

**secretary**
- patients: view, create, update (NOT view_medical, NOT delete)
- appointments: all
- payments: view, create
- files: view, upload (NOT delete)
- insurance: view, manage
- patients files of category `id_card`, `insurance_card`: full
- patients files of category `external_report`, `prescription_scan`: view only
- consultations: view (read-only — sees if appointment was completed)
- prescriptions, diagnoses, forms: NO permissions
- reports: view
- staff: view (cannot create or modify)
- audit: NO permission

**nurse** *(v2)* — defined as: patients view + view_medical, files view+upload, appointments view, no editing of medical records

### 5. Policies

Write a policy for every model that needs authorization:

- `PatientPolicy`
- `AppointmentPolicy`
- `ConsultationPolicy`
- `MedicalFormPolicy`
- `FormSubmissionPolicy`
- `PrescriptionPolicy`
- `DiagnosisPolicy`
- `PaymentPolicy`
- `PatientFilePolicy`
- `InsuranceProviderPolicy`
- `UserPolicy` (for staff management)
- `DoctorPolicy`
- `AuditLogPolicy`

Each policy implements relevant methods (`viewAny`, `view`, `create`, `update`, `delete`, etc.) by checking permissions:
```php
public function update(User $user, Patient $patient): bool
{
    return $user->can('patients.update');
}
```

Register all policies in `AuthServiceProvider`.

### 6. Authorization in Controllers

Every controller method that touches a model must authorize:
- Use `$this->authorize('action', $model)` for individual records
- Use `Gate::authorize('action', Patient::class)` for index/create
- Or use the `authorizeResource` pattern in resource controllers

### 7. Inertia Frontend Awareness

Share the current user's permissions to the frontend via Inertia middleware:

```php
// HandleInertiaRequests.php
'auth' => [
    'user' => $request->user(),
    'permissions' => $request->user()?->getAllPermissions()->pluck('name') ?? [],
    'roles' => $request->user()?->getRoleNames() ?? [],
],
```

Create a `useCan()` hook in `resources/js/Hooks/useCan.ts`:
```typescript
const can = useCan();
if (can('patients.delete')) { /* show delete button */ }
```

Create a `<Can />` component for declarative usage:
```tsx
<Can permission="patients.delete">
  <DeleteButton />
</Can>
```

### 8. Role Assignment Flow

When the **clinic admin** is created during tenant provisioning:
- Auto-assigned roles: `clinic_admin` AND `doctor`

When a **secretary** is added by clinic admin:
- Assigned role: `secretary`

When a **future doctor** is added (v2):
- Assigned role: `doctor`

### 9. Seeders

In `database/seeders/Tenant/`:

**RolesAndPermissionsSeeder** — creates all roles and permissions, syncs role-permission mappings. Runs automatically when tenant is provisioned (before TenantDemoSeeder).

Update `TenantDemoSeeder` to:
- Create the doctor user → assign roles `clinic_admin` + `doctor`
- Create the secretary user → assign role `secretary`

## Deliverables

### Backend
- Spatie config + tenant migrations
- `app/Models/Tenant/User.php` updated with `HasRoles` trait
- All policy classes in `app/Policies/Tenant/`
- `RolesAndPermissionsSeeder.php` with full role-permission matrix
- Updated `TenantDemoSeeder` to assign roles
- `app/Enums/Tenant/Permission.php` — string enum listing every permission for type safety
- `app/Enums/Tenant/Role.php` — string enum listing every role
- Hook into tenancy lifecycle: when tenant is created, run `RolesAndPermissionsSeeder` automatically (before any user creation)

### Frontend
- Updated `HandleInertiaRequests` to share permissions
- `resources/js/Hooks/useCan.ts`
- `resources/js/Components/domain/Can.tsx`
- TypeScript types in `resources/js/types/auth.ts`:
  ```typescript
  export type Permission = 'patients.view' | 'patients.create' | ...;
  export type Role = 'clinic_admin' | 'doctor' | 'secretary' | 'nurse';
  ```

### Tests
In `tests/Feature/Tenant/Authorization/`:
- `SecretaryCannotViewMedicalTest.php` — secretary gets 403 on consultation/prescription endpoints
- `DoctorCanManageFormsTest.php`
- `ClinicAdminFullAccessTest.php`
- `PolicyEnforcementTest.php` — direct policy tests for each model
- `RoleAssignmentTest.php` — roles correctly assigned during provisioning

## Constraints

- **Every controller endpoint must call authorize()** — no naked endpoints
- **Every Inertia page that renders restricted UI must check permissions** — don't rely solely on backend
- Permissions are referenced via the `Permission` enum, never hardcoded strings (in PHP). In TS, use the typed union.
- The `super-admin` permission shortcut (Spatie's wildcard) is NOT used — be explicit about every permission.

## Definition of Done

- [ ] Roles and permissions tables exist in tenant DB
- [ ] Demo tenant has 4 roles seeded with correct permissions
- [ ] Demo tenant has 2 users with correct roles
- [ ] Secretary login → cannot see "Medical Records" sidebar item
- [ ] Secretary direct URL access to `/consultations` returns 403
- [ ] Clinic admin sees full sidebar
- [ ] `useCan()` hook works in frontend (verified by hiding a button conditionally)
- [ ] All authorization tests pass
- [ ] All policies registered

## Notes for Future Phases

- Phase 6 (UI Foundation) builds the layout shell — sidebar items will use `<Can>` components
- Phases 7-10 each enforce permissions in their respective module controllers
- The audit log service (Phase 2/3) records role changes
