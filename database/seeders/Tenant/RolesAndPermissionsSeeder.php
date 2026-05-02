<?php

declare(strict_types=1);

namespace Database\Seeders\Tenant;

use App\Enums\Tenant\Permission as PermissionEnum;
use App\Enums\Tenant\Role as RoleEnum;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Seeds the four tenant roles and the full permission catalog into the
 * current tenant DB. Idempotent — re-running does not duplicate rows.
 *
 * Runs as part of the tenant provisioning pipeline (see
 * App\Jobs\Tenancy\SeedTenantRolesPermissions) so EVERY tenant — production
 * or otherwise — gets the role/permission tables populated, separate from
 * the dev-only TenantDemoSeeder.
 */
class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // Ensure the spatie cache is fresh so newly-created permissions are
        // visible immediately to Gate::before() within the same request.
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $this->seedPermissions();
        $this->seedRolesWithPermissions();

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    private function seedPermissions(): void
    {
        foreach (PermissionEnum::cases() as $permission) {
            Permission::findOrCreate($permission->value, 'web');
        }
    }

    private function seedRolesWithPermissions(): void
    {
        $clinicAdmin = Role::findOrCreate(RoleEnum::ClinicAdmin->value, 'web');
        $doctor = Role::findOrCreate(RoleEnum::Doctor->value, 'web');
        $secretary = Role::findOrCreate(RoleEnum::Secretary->value, 'web');
        $nurse = Role::findOrCreate(RoleEnum::Nurse->value, 'web');

        // clinic_admin: every permission.
        $clinicAdmin->syncPermissions(PermissionEnum::values());

        // doctor: full medical + read-only on staff/payments/reports.
        $doctor->syncPermissions($this->doctorPermissions());

        // secretary: admin / scheduling / billing only.
        $secretary->syncPermissions($this->secretaryPermissions());

        // nurse (v2): patients view + view_medical, files view+upload,
        // appointments view, no editing of medical records.
        $nurse->syncPermissions($this->nursePermissions());
    }

    /**
     * @return list<string>
     */
    private function doctorPermissions(): array
    {
        $perms = [
            // Patients (full)
            PermissionEnum::PatientsView,
            PermissionEnum::PatientsCreate,
            PermissionEnum::PatientsUpdate,
            PermissionEnum::PatientsDelete,
            PermissionEnum::PatientsViewMedical,

            // Appointments (full)
            PermissionEnum::AppointmentsView,
            PermissionEnum::AppointmentsCreate,
            PermissionEnum::AppointmentsUpdate,
            PermissionEnum::AppointmentsCancel,
            PermissionEnum::AppointmentsDelete,

            // Consultations (full)
            PermissionEnum::ConsultationsView,
            PermissionEnum::ConsultationsCreate,
            PermissionEnum::ConsultationsUpdate,
            PermissionEnum::ConsultationsDelete,

            // Forms (full)
            PermissionEnum::FormsView,
            PermissionEnum::FormsManage,
            PermissionEnum::FormsSubmit,

            // Prescriptions (full)
            PermissionEnum::PrescriptionsView,
            PermissionEnum::PrescriptionsCreate,
            PermissionEnum::PrescriptionsUpdate,
            PermissionEnum::PrescriptionsDelete,

            // Diagnoses (full)
            PermissionEnum::DiagnosesView,
            PermissionEnum::DiagnosesCreate,
            PermissionEnum::DiagnosesUpdate,
            PermissionEnum::DiagnosesDelete,

            // Payments (read-only)
            PermissionEnum::PaymentsView,

            // Files (full medical access)
            PermissionEnum::FilesView,
            PermissionEnum::FilesUpload,
            PermissionEnum::FilesDelete,

            // Insurance (read-only)
            PermissionEnum::InsuranceView,

            // Staff (read-only)
            PermissionEnum::StaffView,

            // Doctor profile / hours (full self-management)
            PermissionEnum::DoctorViewProfile,
            PermissionEnum::DoctorUpdateProfile,
            PermissionEnum::DoctorManageHours,

            // Reports (read-only — admin can export)
            PermissionEnum::ReportsView,

            // Audit (view)
            PermissionEnum::AuditView,
        ];

        return array_map(fn (PermissionEnum $p) => $p->value, $perms);
    }

    /**
     * @return list<string>
     */
    private function secretaryPermissions(): array
    {
        $perms = [
            // Patients: view, create, update — no view_medical, no delete.
            PermissionEnum::PatientsView,
            PermissionEnum::PatientsCreate,
            PermissionEnum::PatientsUpdate,

            // Appointments: full.
            PermissionEnum::AppointmentsView,
            PermissionEnum::AppointmentsCreate,
            PermissionEnum::AppointmentsUpdate,
            PermissionEnum::AppointmentsCancel,
            PermissionEnum::AppointmentsDelete,

            // Consultations: read-only (sees if appointment was completed).
            PermissionEnum::ConsultationsView,

            // Payments: view + create.
            PermissionEnum::PaymentsView,
            PermissionEnum::PaymentsCreate,

            // Files: view + upload (admin/insurance categories — medical
            // categories blocked at policy level by the patients.view_medical
            // gate).
            PermissionEnum::FilesView,
            PermissionEnum::FilesUpload,

            // Insurance providers: full management (add new on the fly).
            PermissionEnum::InsuranceView,
            PermissionEnum::InsuranceManage,

            // Staff: read-only.
            PermissionEnum::StaffView,

            // Reports: read-only.
            PermissionEnum::ReportsView,
        ];

        return array_map(fn (PermissionEnum $p) => $p->value, $perms);
    }

    /**
     * @return list<string>
     */
    private function nursePermissions(): array
    {
        $perms = [
            PermissionEnum::PatientsView,
            PermissionEnum::PatientsViewMedical,
            PermissionEnum::AppointmentsView,
            PermissionEnum::FilesView,
            PermissionEnum::FilesUpload,
        ];

        return array_map(fn (PermissionEnum $p) => $p->value, $perms);
    }
}
