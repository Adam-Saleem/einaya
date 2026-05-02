<?php

declare(strict_types=1);

use App\Enums\Central\ClinicStatus;
use App\Models\Central\Clinic;

// Use a tenant ID that won't collide with anything a developer creates manually.
const PEST_TENANT_ID = 'pestsmoke';

function pestSmokeCleanup(): void
{
    if (tenancy()->initialized) {
        tenancy()->end();
    }
    Clinic::where('id', PEST_TENANT_ID)->get()->each->delete();
    $dbName = config('tenancy.database.prefix').PEST_TENANT_ID.config('tenancy.database.suffix');
    \DB::connection(config('tenancy.database.central_connection'))
        ->statement("DROP DATABASE IF EXISTS `$dbName`");
}

beforeEach(fn () => pestSmokeCleanup());
afterEach(fn () => pestSmokeCleanup());

it('initializes tenancy on a tenant subdomain', function () {
    $tenant = Clinic::create([
        'id' => PEST_TENANT_ID,
        'name' => 'Pest Smoke Clinic',
        'slug' => PEST_TENANT_ID,
        'owner_name' => 'Smoke Owner',
        'owner_email' => 'smoke@example.test',
        'status' => ClinicStatus::Active,
    ]);
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
