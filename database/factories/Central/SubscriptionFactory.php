<?php

declare(strict_types=1);

namespace Database\Factories\Central;

use App\Enums\Central\SubscriptionStatus;
use App\Models\Central\Clinic;
use App\Models\Central\Subscription;
use App\Models\Central\SubscriptionPlan;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Subscription>
 */
class SubscriptionFactory extends Factory
{
    protected $model = Subscription::class;

    public function definition(): array
    {
        return [
            'clinic_id' => Clinic::factory(),
            'plan_id' => SubscriptionPlan::factory(),
            'status' => SubscriptionStatus::Active,
            'starts_at' => now(),
            'ends_at' => now()->addYear(),
            'trial_ends_at' => null,
        ];
    }

    public function trial(): static
    {
        return $this->state(fn () => [
            'status' => SubscriptionStatus::Trial,
            'trial_ends_at' => now()->addDays(14),
        ]);
    }
}
