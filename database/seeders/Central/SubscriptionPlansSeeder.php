<?php

declare(strict_types=1);

namespace Database\Seeders\Central;

use App\Models\Central\SubscriptionPlan;
use Illuminate\Database\Seeder;

class SubscriptionPlansSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'slug' => 'starter',
                'name' => 'Starter',
                'price_monthly' => 19.00,
                'price_yearly' => 190.00,
                'max_patients' => 500,
                'max_staff' => 2,
                'features' => [
                    'form_builder',
                    'appointments',
                    'basic_reports',
                ],
                'is_active' => true,
                'order' => 1,
            ],
            [
                'slug' => 'pro',
                'name' => 'Pro',
                'price_monthly' => 49.00,
                'price_yearly' => 490.00,
                'max_patients' => 5000,
                'max_staff' => 5,
                'features' => [
                    'form_builder',
                    'appointments',
                    'reports',
                    'sms',
                    'insurance_management',
                    'file_uploads',
                ],
                'is_active' => true,
                'order' => 2,
            ],
            [
                'slug' => 'enterprise',
                'name' => 'Enterprise',
                'price_monthly' => 129.00,
                'price_yearly' => 1290.00,
                'max_patients' => null,
                'max_staff' => null,
                'features' => [
                    'form_builder',
                    'appointments',
                    'reports',
                    'sms',
                    'insurance_management',
                    'file_uploads',
                    'priority_support',
                    'custom_branding',
                    'api_access',
                ],
                'is_active' => true,
                'order' => 3,
            ],
        ];

        foreach ($plans as $plan) {
            SubscriptionPlan::updateOrCreate(['slug' => $plan['slug']], $plan);
        }
    }
}
