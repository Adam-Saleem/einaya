<?php

declare(strict_types=1);

namespace Database\Seeders\Tenant;

use Illuminate\Database\Seeder;

/**
 * Root seeder for tenant databases.
 *
 * stancl's tenants:seed command (and our auto-provisioning pipeline) calls
 * Database\Seeders\Tenant\DatabaseSeeder by default — see the
 * `seeder_parameters` block in config/tenancy.php.
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            TenantDemoSeeder::class,
        ]);
    }
}
