<?php

declare(strict_types=1);

namespace App\Jobs\Tenancy;

use Database\Seeders\Tenant\DatabaseSeeder;
use Illuminate\Bus\Queueable;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Stancl\Tenancy\Contracts\TenantWithDatabase;

/**
 * Runs the tenant root seeder right after migrations, but only in non-production.
 *
 * Wired into the TenantCreated JobPipeline (see TenancyServiceProvider). The
 * pipeline is configured with `shouldBeQueued(false)` so this runs synchronously
 * during clinic provisioning — no separate queue worker is required.
 */
class SeedTenantDatabaseInDev
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(public TenantWithDatabase $tenant) {}

    public function handle(): void
    {
        // Skip in production (no demo data ever) and in testing (test cases
        // that need seed data invoke the seeder explicitly so the rest of the
        // test suite stays fast).
        if (app()->environment(['production', 'testing'])) {
            return;
        }

        $this->tenant->run(function (): void {
            (new DatabaseSeeder())->setContainer(app())->run();
        });
    }
}
