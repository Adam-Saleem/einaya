<?php

declare(strict_types=1);

use App\Enums\Tenant\Permission as PermissionEnum;
use App\Enums\Tenant\Role as RoleEnum;
use App\Models\Tenant\User as TenantUser;

require_once __DIR__.'/../TenancyTestSetup.php';

const SECRETARY_DENY_PREFIX = 'pesttestsecdeny';

beforeEach(fn () => tenantTestCleanup(SECRETARY_DENY_PREFIX));
afterEach(fn () => tenantTestCleanup(SECRETARY_DENY_PREFIX));

it('denies the secretary every medical-data permission', function () {
    $tenant = makeTestTenant('pesttestsecdeny-1');

    $tenant->run(function (): void {
        $secretary = TenantUser::factory()->create();
        $secretary->syncRoles([RoleEnum::Secretary->value]);

        $deniedMedicalPermissions = [
            PermissionEnum::PatientsViewMedical,
            PermissionEnum::PatientsDelete,
            PermissionEnum::ConsultationsCreate,
            PermissionEnum::ConsultationsUpdate,
            PermissionEnum::ConsultationsDelete,
            PermissionEnum::PrescriptionsView,
            PermissionEnum::PrescriptionsCreate,
            PermissionEnum::PrescriptionsUpdate,
            PermissionEnum::PrescriptionsDelete,
            PermissionEnum::DiagnosesView,
            PermissionEnum::DiagnosesCreate,
            PermissionEnum::DiagnosesUpdate,
            PermissionEnum::DiagnosesDelete,
            PermissionEnum::FormsManage,
            PermissionEnum::FormsSubmit,
            PermissionEnum::FilesDelete,
            PermissionEnum::AuditView,
        ];

        foreach ($deniedMedicalPermissions as $perm) {
            expect($secretary->can($perm->value))
                ->toBeFalse("secretary should NOT have {$perm->value}");
        }

        // Sanity: secretary DOES have admin-side permissions.
        expect($secretary->can(PermissionEnum::PatientsCreate->value))->toBeTrue()
            ->and($secretary->can(PermissionEnum::AppointmentsCreate->value))->toBeTrue()
            ->and($secretary->can(PermissionEnum::PaymentsCreate->value))->toBeTrue()
            ->and($secretary->can(PermissionEnum::InsuranceManage->value))->toBeTrue();
    });
});
