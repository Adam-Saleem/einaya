<?php

declare(strict_types=1);

use App\Enums\Central\ClinicStatus;
use App\Models\Central\Clinic;
use App\Models\Central\Subscription;
use Database\Seeders\Central\DemoClinicSeeder;
use Database\Seeders\Central\SubscriptionPlansSeeder;

const CLINIC_TEST_ID = 'demo';

function clinicTestCleanup(): void
{
    if (tenancy()->initialized) {
        tenancy()->end();
    }
    Clinic::withTrashed()->where('id', CLINIC_TEST_ID)->get()->each->delete();
    Clinic::where('id', CLINIC_TEST_ID)->get()->each->delete();
    $dbName = config('tenancy.database.prefix').CLINIC_TEST_ID.config('tenancy.database.suffix');
    \DB::connection(config('tenancy.database.central_connection'))
        ->statement("DROP DATABASE IF EXISTS `$dbName`");
}

beforeEach(function () {
    clinicTestCleanup();
    \DB::connection(config('tenancy.database.central_connection'))
        ->statement('DELETE FROM subscriptions');
    \DB::connection(config('tenancy.database.central_connection'))
        ->statement('DELETE FROM subscription_plans');
});
afterEach(fn () => clinicTestCleanup());

it('creates a demo clinic with a working subdomain via the seeder', function () {
    $this->seed(SubscriptionPlansSeeder::class);
    $this->seed(DemoClinicSeeder::class);

    /** @var Clinic|null $clinic */
    $clinic = Clinic::where('slug', 'demo')->first();

    expect($clinic)->not->toBeNull()
        ->and($clinic->id)->toBe('demo')
        ->and($clinic->name)->toBe('Demo Clinic')
        ->and($clinic->status)->toBe(ClinicStatus::Active)
        ->and($clinic->domains()->where('domain', 'demo.einaya.test')->exists())->toBeTrue()
        ->and($clinic->subscription_id)->not->toBeNull();

    $subscription = Subscription::find($clinic->subscription_id);
    expect($subscription)->not->toBeNull()
        ->and($subscription->plan->slug)->toBe('pro');

    // Tenant DB exists.
    $expectedDb = config('tenancy.database.prefix').'demo'.config('tenancy.database.suffix');
    $databases = \DB::connection(config('tenancy.database.central_connection'))
        ->select("SHOW DATABASES LIKE '$expectedDb'");
    expect($databases)->not->toBeEmpty();

    // Subdomain resolves.
    $response = $this->get('http://demo.einaya.test/');
    $response->assertOk();
    expect(tenancy()->initialized)->toBeTrue()
        ->and(tenant('id'))->toBe('demo');
});
