<?php

declare(strict_types=1);

use App\Models\Central\Clinic;
use App\Models\Tenant\User as TenantUser;

require_once __DIR__.'/../Tenant/TenancyTestSetup.php';

const TENANT_LOGIN_PREFIX = 'pesttestlogin';

beforeEach(fn () => tenantTestCleanup(TENANT_LOGIN_PREFIX));
afterEach(fn () => tenantTestCleanup(TENANT_LOGIN_PREFIX));

it('renders the tenant login page on a tenant subdomain', function () {
    makeTestTenant('pesttestlogin-render');

    $this->get('http://pesttestlogin-render.einaya.test/login')->assertOk();
});

it('logs in a clinic user with valid credentials', function () {
    $tenant = makeTestTenant('pesttestlogin-ok');

    $userId = null;
    $tenant->run(function () use (&$userId): void {
        $user = TenantUser::factory()->create([
            'email' => 'doctor@clinic.test',
            'password' => bcrypt('Clinic@2025!'),
        ]);
        $userId = $user->id;
    });

    $response = $this->post('http://pesttestlogin-ok.einaya.test/login', [
        'email' => 'doctor@clinic.test',
        'password' => 'Clinic@2025!',
    ]);

    $response->assertRedirect('/');
    // The auth check has to be made inside the tenant context.
    $tenant->run(function () use ($userId): void {
        expect(auth('web')->check())->toBeTrue()
            ->and(auth('web')->id())->toBe($userId);
    });
});

it('rejects bad credentials in tenant context', function () {
    $tenant = makeTestTenant('pesttestlogin-bad');

    $tenant->run(function (): void {
        TenantUser::factory()->create([
            'email' => 'doctor@clinic.test',
            'password' => bcrypt('Clinic@2025!'),
        ]);
    });

    $this->post('http://pesttestlogin-bad.einaya.test/login', [
        'email' => 'doctor@clinic.test',
        'password' => 'wrong',
    ])->assertSessionHasErrors('email');
});
