<?php

declare(strict_types=1);

use App\Enums\Tenant\Permission as PermissionEnum;
use App\Enums\Tenant\Role as RoleEnum;
use App\Models\Tenant\User as TenantUser;

require_once __DIR__.'/../TenancyTestSetup.php';

const DOCTOR_FORMS_PREFIX = 'pesttestdocforms';

beforeEach(fn () => tenantTestCleanup(DOCTOR_FORMS_PREFIX));
afterEach(fn () => tenantTestCleanup(DOCTOR_FORMS_PREFIX));

it('lets the doctor manage and submit medical forms', function () {
    $tenant = makeTestTenant('pesttestdocforms-1');

    $tenant->run(function (): void {
        $doctor = TenantUser::factory()->create();
        $doctor->syncRoles([RoleEnum::Doctor->value]);

        expect($doctor->can(PermissionEnum::FormsView->value))->toBeTrue()
            ->and($doctor->can(PermissionEnum::FormsManage->value))->toBeTrue()
            ->and($doctor->can(PermissionEnum::FormsSubmit->value))->toBeTrue();

        // Doctor sees medical data and writes consultations/prescriptions/diagnoses.
        expect($doctor->can(PermissionEnum::PatientsViewMedical->value))->toBeTrue()
            ->and($doctor->can(PermissionEnum::ConsultationsCreate->value))->toBeTrue()
            ->and($doctor->can(PermissionEnum::PrescriptionsCreate->value))->toBeTrue()
            ->and($doctor->can(PermissionEnum::DiagnosesCreate->value))->toBeTrue();

        // Doctor does NOT manage clinic settings or branding (admin-only).
        expect($doctor->can(PermissionEnum::ClinicUpdateSettings->value))->toBeFalse()
            ->and($doctor->can(PermissionEnum::ClinicUpdateBranding->value))->toBeFalse();
    });
});
