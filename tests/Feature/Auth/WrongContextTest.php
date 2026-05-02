<?php

declare(strict_types=1);

use App\Models\Central\User as CentralUser;
use App\Models\Tenant\User as TenantUser;

require_once __DIR__.'/../Tenant/TenancyTestSetup.php';

const WRONG_CTX_PREFIX = 'pesttestwrongctx';

beforeEach(fn () => tenantTestCleanup(WRONG_CTX_PREFIX));
afterEach(fn () => tenantTestCleanup(WRONG_CTX_PREFIX));

it('does not let a super admin log in via a tenant subdomain', function () {
    $tenant = makeTestTenant('pesttestwrongctx-1');

    // Super admin exists in central DB only.
    CentralUser::factory()->create([
        'email' => 'admin@central.test',
        'password' => bcrypt('Test@2025!'),
        'is_super_admin' => true,
    ]);

    // No user with this email exists in the tenant DB — the tenant `web`
    // guard targets Tenant\User and won't see the central super admin.
    $this->post('http://pesttestwrongctx-1.einaya.test/login', [
        'email' => 'admin@central.test',
        'password' => 'Test@2025!',
    ])->assertSessionHasErrors('email');

    $tenant->run(function (): void {
        expect(auth('web')->check())->toBeFalse();
    });
});

it('does not let a clinic user log in via the central domain', function () {
    $tenant = makeTestTenant('pesttestwrongctx-2');

    $tenant->run(function (): void {
        TenantUser::factory()->create([
            'email' => 'doctor@clinic.test',
            'password' => bcrypt('Clinic@2025!'),
        ]);
    });

    // The central guard reads the central `users` table, so the clinic
    // doctor's credentials are invisible there.
    $this->post('http://app.einaya.test/login', [
        'email' => 'doctor@clinic.test',
        'password' => 'Clinic@2025!',
    ])->assertSessionHasErrors('email');

    expect(auth('web_central')->check())->toBeFalse();
});
