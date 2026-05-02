<?php

declare(strict_types=1);

namespace Database\Seeders;

use Database\Seeders\Central\DemoClinicSeeder;
use Database\Seeders\Central\SubscriptionPlansSeeder;
use Database\Seeders\Central\SuperAdminSeeder;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            SuperAdminSeeder::class,
            SubscriptionPlansSeeder::class,
            DemoClinicSeeder::class,
        ]);
    }
}
