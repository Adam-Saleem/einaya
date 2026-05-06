<?php

declare(strict_types=1);

use App\Actions\Central\SuspendClinicAction;
use App\Enums\Central\ClinicStatus;
use App\Models\Central\Clinic;
use App\Models\Central\User;
use Database\Seeders\Central\SubscriptionPlansSeeder;
use Illuminate\Support\Facades\DB;

const SUSPEND_TEST_PREFIX = 'pesttestsuspend';

function suspendCleanup(): void
{
    if (tenancy()->initialized) {
        tenancy()->end();
    }

    // forceDelete()-without-events deletes the central row without firing
    // stancl's DeleteDatabase job — we drop the DBs ourselves below, so
    // letting the model event run would race the manual drop and crash
    // with "database doesn't exist" on partial cleanup states.
    Clinic::withoutEvents(function () {
        Clinic::withTrashed()
            ->where('id', 'like', SUSPEND_TEST_PREFIX.'%')
            ->get()
            ->each(fn (Clinic $c) => $c->forceDelete());
    });

    $dbPrefix = config('tenancy.database.prefix');
    $dbSuffix = config('tenancy.database.suffix');
    $like = $dbPrefix.SUSPEND_TEST_PREFIX.'%'.$dbSuffix;
    foreach (DB::connection(config('tenancy.database.central_connection'))->select("SHOW DATABASES LIKE '{$like}'") as $row) {
        $arr = (array) $row;
        $db = reset($arr);
        DB::connection(config('tenancy.database.central_connection'))->statement("DROP DATABASE IF EXISTS `{$db}`");
    }
}

beforeEach(function () {
    suspendCleanup();
    DB::connection(config('tenancy.database.central_connection'))->statement('DELETE FROM subscriptions');
    DB::connection(config('tenancy.database.central_connection'))->statement('DELETE FROM subscription_plans');
    DB::connection(config('tenancy.database.central_connection'))->statement('DELETE FROM users WHERE email = "suspend-actor@einaya.test"');
});
afterEach(fn () => suspendCleanup());

it('blocks tenant access for a suspended clinic and restores it on activation', function () {
    $this->seed(SubscriptionPlansSeeder::class);
    $actor = User::factory()->create([
        'email' => 'suspend-actor@einaya.test',
        'is_super_admin' => true,
    ]);

    $slug = SUSPEND_TEST_PREFIX.'-omega';
    /** @var Clinic $clinic */
    $clinic = Clinic::create([
        'id' => $slug,
        'name' => 'Omega Clinic',
        'slug' => $slug,
        'owner_name' => 'Omega Owner',
        'owner_email' => 'omega@einaya.test',
        'status' => ClinicStatus::Active,
    ]);
    $clinic->domains()->create(['domain' => $slug.'.einaya.test']);

    // Active: tenant root reachable.
    $this->get('http://'.$slug.'.einaya.test/')->assertOk();

    app(SuspendClinicAction::class)->suspend($clinic, $actor, 'pest test');
    expect($clinic->fresh()->status)->toBe(ClinicStatus::Suspended);

    $this->get('http://'.$slug.'.einaya.test/')
        ->assertStatus(503);

    app(SuspendClinicAction::class)->activate($clinic, $actor);
    expect($clinic->fresh()->status)->toBe(ClinicStatus::Active);

    $this->get('http://'.$slug.'.einaya.test/')->assertOk();
});
