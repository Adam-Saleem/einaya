<?php

declare(strict_types=1);

use App\Enums\Tenant\Permission as PermissionEnum;
use App\Enums\Tenant\Role as RoleEnum;
use App\Models\Tenant\User as TenantUser;

require_once __DIR__.'/../TenancyTestSetup.php';

const ADMIN_ACCESS_PREFIX = 'pesttestadmin';

beforeEach(fn () => tenantTestCleanup(ADMIN_ACCESS_PREFIX));
afterEach(fn () => tenantTestCleanup(ADMIN_ACCESS_PREFIX));

it('grants the clinic_admin role every defined permission', function () {
    $tenant = makeTestTenant('pesttestadmin-1');

    $tenant->run(function (): void {
        $admin = TenantUser::factory()->create();
        $admin->syncRoles([RoleEnum::ClinicAdmin->value]);

        foreach (PermissionEnum::cases() as $permission) {
            expect($admin->can($permission->value))
                ->toBeTrue("clinic_admin should have {$permission->value}");
        }
    });
});
