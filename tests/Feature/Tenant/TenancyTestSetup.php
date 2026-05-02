<?php

declare(strict_types=1);

use App\Enums\Central\ClinicStatus;
use App\Models\Central\Clinic;
use Illuminate\Support\Facades\DB;

/**
 * Drop any test-tenant databases and Clinic rows whose IDs start with the test
 * prefix. Tenant DB creation/deletion is DDL that auto-commits and breaks the
 * RefreshDatabase rollback strategy, so these tests opt out of RefreshDatabase
 * (see tests/Pest.php) and manage their own state via this helper.
 */
function tenantTestCleanup(string $prefix = 'pesttest'): void
{
    if (tenancy()->initialized) {
        tenancy()->end();
    }

    $clinics = Clinic::query()->where('id', 'like', $prefix.'%')->get();

    foreach ($clinics as $clinic) {
        $clinic->delete();
    }

    // Belt-and-suspenders: even if the row delete didn't fire DeleteDatabase
    // (or ran in a separate test that crashed mid-run), drop the DBs by name.
    $dbPrefix = config('tenancy.database.prefix');
    $dbSuffix = config('tenancy.database.suffix');
    $centralConn = config('tenancy.database.central_connection');

    // SHOW DATABASES does not accept bound parameters; the pattern is built
    // from trusted config + the test-only prefix passed in, so direct
    // interpolation is safe here.
    $like = addslashes($dbPrefix.$prefix.'%'.$dbSuffix);
    $rows = DB::connection($centralConn)
        ->select("SHOW DATABASES LIKE '{$like}'");

    foreach ($rows as $row) {
        $name = array_values((array) $row)[0];
        DB::connection($centralConn)->statement('DROP DATABASE IF EXISTS `'.$name.'`');
    }
}

/**
 * Create a clean test tenant with migrations applied. Skips the demo seeder
 * (the auto-seed job already opts out of testing env). Caller is responsible
 * for invoking tenantTestCleanup() before/after.
 */
function makeTestTenant(string $id): Clinic
{
    /** @var Clinic $clinic */
    $clinic = Clinic::create([
        'id' => $id,
        'name' => 'Test Clinic '.$id,
        'slug' => $id,
        'owner_name' => 'Test Owner',
        'owner_email' => $id.'@example.test',
        'status' => ClinicStatus::Active,
    ]);
    $clinic->domains()->create(['domain' => $id.'.einaya.test']);

    return $clinic;
}
