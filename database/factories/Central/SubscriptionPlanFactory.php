<?php

declare(strict_types=1);

namespace Database\Factories\Central;

use App\Models\Central\SubscriptionPlan;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<SubscriptionPlan>
 */
class SubscriptionPlanFactory extends Factory
{
    protected $model = SubscriptionPlan::class;

    public function definition(): array
    {
        $name = fake()->unique()->words(2, true);

        return [
            'name' => ucfirst($name),
            'slug' => Str::slug($name),
            'price_monthly' => fake()->randomFloat(2, 9, 199),
            'price_yearly' => fake()->randomFloat(2, 90, 1999),
            'max_patients' => fake()->randomElement([500, 1000, 5000, null]),
            'max_staff' => fake()->randomElement([2, 5, 10, null]),
            'features' => ['form_builder', 'appointments', 'reports'],
            'is_active' => true,
            'order' => fake()->numberBetween(0, 10),
        ];
    }
}
