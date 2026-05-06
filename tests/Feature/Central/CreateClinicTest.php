<?php

declare(strict_types=1);

use App\Actions\Central\CreateClinicAction;
use App\Enums\Central\ClinicStatus;
use App\Models\Central\Clinic;
use App\Models\Central\SubscriptionPlan;
use App\Models\Central\User;
use App\Models\Tenant\User as TenantUser;
use Database\Seeders\Central\SubscriptionPlansSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

const CREATE_CLINIC_TEST_PREFIX = 'pesttestcreate';

function createClinicCleanup(): void
{
    if (tenancy()->initialized) {
        tenancy()->end();
    }

    // withoutEvents skips stancl's DeleteDatabase job; we drop the DBs
    // ourselves below so a partial state from a previous run doesn't
    // crash with "database doesn't exist".
    Clinic::withoutEvents(function () {
        Clinic::query()
            ->withTrashed()
            ->where('id', 'like', CREATE_CLINIC_TEST_PREFIX.'%')
            ->get()
            ->each(fn (Clinic $c) => $c->forceDelete());
    });

    $dbPrefix = config('tenancy.database.prefix');
    $dbSuffix = config('tenancy.database.suffix');
    $like = $dbPrefix.CREATE_CLINIC_TEST_PREFIX.'%'.$dbSuffix;
    foreach (DB::connection(config('tenancy.database.central_connection'))->select("SHOW DATABASES LIKE '{$like}'") as $row) {
        $name = (array) $row;
        $db = reset($name);
        DB::connection(config('tenancy.database.central_connection'))->statement("DROP DATABASE IF EXISTS `{$db}`");
    }
}

beforeEach(function () {
    createClinicCleanup();
    DB::connection(config('tenancy.database.central_connection'))->statement('DELETE FROM subscriptions');
    DB::connection(config('tenancy.database.central_connection'))->statement('DELETE FROM subscription_plans');
    DB::connection(config('tenancy.database.central_connection'))->statement('DELETE FROM users WHERE email = "create-clinic-actor@einaya.test"');
});
afterEach(fn () => createClinicCleanup());

it('provisions a tenant DB with a working clinic admin via CreateClinicAction', function () {
    $this->seed(SubscriptionPlansSeeder::class);

    $actor = User::factory()->create([
        'email' => 'create-clinic-actor@einaya.test',
        'is_super_admin' => true,
    ]);
    $plan = SubscriptionPlan::where('slug', 'pro')->firstOrFail();

    $slug = CREATE_CLINIC_TEST_PREFIX.'-alpha';

    $result = app(CreateClinicAction::class)->execute([
        'name' => 'Alpha Clinic',
        'slug' => $slug,
        'owner_name' => 'Owner Alpha',
        'owner_email' => 'owner-alpha@einaya.test',
        'owner_phone' => '+970-59-111-1111',
        'plan_id' => $plan->id,
        'trial_days' => 14,
    ], $actor);

    expect($result['clinic'])->toBeInstanceOf(Clinic::class)
        ->and($result['clinic']->status)->toBe(ClinicStatus::Active)
        ->and($result['clinic']->id)->toBe($slug)
        ->and($result['temp_password'])->toBeString()
        ->and(strlen($result['temp_password']))->toBeGreaterThanOrEqual(12);

    expect($result['clinic']->domains()->where('domain', $slug.'.einaya.test')->exists())->toBeTrue();

    $expectedDb = config('tenancy.database.prefix').$slug.config('tenancy.database.suffix');
    $databases = DB::connection(config('tenancy.database.central_connection'))
        ->select("SHOW DATABASES LIKE '{$expectedDb}'");
    expect($databases)->not->toBeEmpty();

    $result['clinic']->run(function () use ($result) {
        $admin = TenantUser::where('email', 'owner-alpha@einaya.test')->first();
        expect($admin)->not->toBeNull()
            ->and($admin->hasRole('clinic_admin'))->toBeTrue();
        expect(Hash::check($result['temp_password'], $admin->password))->toBeTrue();
    });

    $response = $this->get('http://'.$slug.'.einaya.test/login');
    $response->assertOk();
});
