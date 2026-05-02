<?php

declare(strict_types=1);

use App\Enums\Tenant\Role as RoleEnum;
use App\Models\Tenant\User as TenantUser;
use Database\Seeders\Tenant\TenantDemoSeeder;

require_once __DIR__.'/../TenancyTestSetup.php';

const ROLE_ASSIGN_PREFIX = 'pesttestroles';

beforeEach(fn () => tenantTestCleanup(ROLE_ASSIGN_PREFIX));
afterEach(fn () => tenantTestCleanup(ROLE_ASSIGN_PREFIX));

it('seeds roles+permissions automatically when a tenant is created', function () {
    $tenant = makeTestTenant('pesttestroles-1');

    $tenant->run(function (): void {
        expect(\Spatie\Permission\Models\Role::count())->toBe(4)
            ->and(\Spatie\Permission\Models\Permission::count())->toBeGreaterThanOrEqual(40);

        $names = \Spatie\Permission\Models\Role::pluck('name')->all();
        sort($names);
        expect($names)->toBe(['clinic_admin', 'doctor', 'nurse', 'secretary']);
    });
});

it('assigns clinic_admin + doctor to the doctor user and secretary to the secretary user', function () {
    $tenant = makeTestTenant('pesttestroles-2');

    $tenant->run(function (): void {
        (new TenantDemoSeeder())->setContainer(app())->run();

        $doctor = TenantUser::where('email', 'like', 'doctor@%')->first();
        $secretary = TenantUser::where('email', 'like', 'secretary@%')->first();

        expect($doctor)->not->toBeNull()
            ->and($doctor->hasRole(RoleEnum::ClinicAdmin->value))->toBeTrue()
            ->and($doctor->hasRole(RoleEnum::Doctor->value))->toBeTrue();

        expect($secretary)->not->toBeNull()
            ->and($secretary->hasRole(RoleEnum::Secretary->value))->toBeTrue()
            ->and($secretary->hasRole(RoleEnum::ClinicAdmin->value))->toBeFalse();
    });
});
