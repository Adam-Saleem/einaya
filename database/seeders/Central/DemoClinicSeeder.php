<?php

declare(strict_types=1);

namespace Database\Seeders\Central;

use App\Enums\Central\ClinicStatus;
use App\Enums\Central\SubscriptionStatus;
use App\Models\Central\Clinic;
use App\Models\Central\Subscription;
use App\Models\Central\SubscriptionPlan;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;

class DemoClinicSeeder extends Seeder
{
    public function run(): void
    {
        $existing = Clinic::where('slug', 'demo')->first();

        if ($existing !== null) {
            $this->command?->info('Demo clinic already exists; skipping.');
            $this->ensureDomainAndSubscription($existing);

            return;
        }

        $rootDomain = config('app.env') === 'production' ? 'einaya.ps' : 'einaya.test';

        /** @var Clinic $clinic */
        $clinic = Clinic::create([
            'id' => 'demo',
            'name' => 'Demo Clinic',
            'slug' => 'demo',
            'owner_name' => 'Dr. Demo Owner',
            'owner_email' => 'owner@demo.einaya.ps',
            'owner_phone' => '+970-59-000-0000',
            'status' => ClinicStatus::Active,
            'trial_ends_at' => now()->addDays(30),
        ]);

        $clinic->domains()->create(['domain' => 'demo.'.$rootDomain]);

        $this->ensureDomainAndSubscription($clinic);

        if ($this->tenantMigrationsExist()) {
            $clinic->run(function () {
                // Tenant migrations exist; run them so the demo DB has tables.
                \Artisan::call('tenants:migrate', ['--tenants' => ['demo']]);
            });
        } else {
            $this->command?->warn(
                'Tenant migrations folder is empty — skipping tenant migration. '
                .'(Phase 3 will populate database/migrations/tenant/.)'
            );
        }
    }

    private function ensureDomainAndSubscription(Clinic $clinic): void
    {
        $rootDomain = config('app.env') === 'production' ? 'einaya.ps' : 'einaya.test';
        $expected = 'demo.'.$rootDomain;

        if (! $clinic->domains()->where('domain', $expected)->exists()) {
            $clinic->domains()->create(['domain' => $expected]);
        }

        if ($clinic->subscription_id !== null) {
            return;
        }

        $proPlan = SubscriptionPlan::where('slug', 'pro')->first();

        if ($proPlan === null) {
            return;
        }

        $subscription = Subscription::create([
            'clinic_id' => $clinic->id,
            'plan_id' => $proPlan->id,
            'status' => SubscriptionStatus::Active,
            'starts_at' => now(),
            'ends_at' => now()->addYear(),
        ]);

        $clinic->subscription_id = $subscription->id;
        $clinic->save();
    }

    private function tenantMigrationsExist(): bool
    {
        $path = database_path('migrations/tenant');

        if (! File::isDirectory($path)) {
            return false;
        }

        $files = array_filter(
            File::files($path),
            fn ($file) => str_ends_with($file->getFilename(), '.php'),
        );

        return count($files) > 0;
    }
}
