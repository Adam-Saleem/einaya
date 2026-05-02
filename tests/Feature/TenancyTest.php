<?php

declare(strict_types=1);

use App\Models\Central\Tenant;

// Use a tenant ID that won't collide with anything a developer creates manually.
const PEST_TENANT_ID = 'pestsmoke';

function pestSmokeCleanup(): void
{
    if (tenancy()->initialized) {
        tenancy()->end();
    }
    Tenant::where('id', PEST_TENANT_ID)->get()->each->delete();
    \DB::connection(config('tenancy.database.central_connection'))
        ->statement('DROP DATABASE IF EXISTS `einaya_tenant_'.PEST_TENANT_ID.'`');
}

beforeEach(fn () => pestSmokeCleanup());
afterEach(fn () => pestSmokeCleanup());

it('initializes tenancy on a tenant subdomain', function () {
    $tenant = Tenant::create(['id' => PEST_TENANT_ID]);
    $tenant->domains()->create(['domain' => PEST_TENANT_ID.'.einaya.test']);

    $response = $this->get('http://'.PEST_TENANT_ID.'.einaya.test/');

    $response->assertOk();
    expect(tenancy()->initialized)->toBeTrue()
        ->and(tenant('id'))->toBe(PEST_TENANT_ID);
});

it('does not initialize tenancy on the marketing root domain', function () {
    $this->get('http://einaya.test/')->assertOk();

    expect(tenancy()->initialized)->toBeFalse();
});

it('does not initialize tenancy on the super admin domain', function () {
    $this->get('http://app.einaya.test/')->assertOk();

    expect(tenancy()->initialized)->toBeFalse();
});
