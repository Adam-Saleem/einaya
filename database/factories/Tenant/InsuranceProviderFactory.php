<?php

declare(strict_types=1);

namespace Database\Factories\Tenant;

use App\Models\Tenant\InsuranceProvider;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<InsuranceProvider>
 */
class InsuranceProviderFactory extends Factory
{
    protected $model = InsuranceProvider::class;

    public function definition(): array
    {
        return [
            'name' => fake()->unique()->company().' Insurance',
            'is_active' => true,
        ];
    }
}
