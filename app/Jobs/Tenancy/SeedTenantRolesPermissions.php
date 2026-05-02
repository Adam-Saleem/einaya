<?php

declare(strict_types=1);

namespace App\Jobs\Tenancy;

use Database\Seeders\Tenant\RolesAndPermissionsSeeder;
use Illuminate\Bus\Queueable;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Stancl\Tenancy\Contracts\TenantWithDatabase;

/**
 * Seeds the spatie roles + permissions catalog into a freshly-migrated tenant
 * DB. Runs in EVERY environment (production included) — without these rows
 * spatie's `Gate::before` short-circuit returns false for every check, which
 * effectively locks every tenant user out.
 *
 * Distinct from SeedTenantDatabaseInDev (the demo data seeder, which is
 * skipped in production + testing).
 */
class SeedTenantRolesPermissions
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(public TenantWithDatabase $tenant) {}

    public function handle(): void
    {
        $this->tenant->run(function (): void {
            (new RolesAndPermissionsSeeder())->setContainer(app())->run();
        });
    }
}
