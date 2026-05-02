<?php

declare(strict_types=1);

namespace Database\Factories\Tenant;

use App\Models\Tenant\Doctor;
use App\Models\Tenant\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Doctor>
 */
class DoctorFactory extends Factory
{
    protected $model = Doctor::class;

    public function definition(): array
    {
        $specialties = [
            'General Medicine',
            'Family Medicine',
            'Pediatrics',
            'Internal Medicine',
            'Cardiology',
            'Dermatology',
        ];

        return [
            'user_id' => User::factory(),
            'specialty' => fake()->randomElement($specialties),
            'license_number' => 'LIC-'.fake()->unique()->numerify('######'),
            'bio_en' => fake()->paragraph(),
            'bio_ar' => 'طبيب ذو خبرة في الرعاية الصحية الأولية.',
            'consultation_duration_minutes' => 30,
            'is_active' => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn () => ['is_active' => false]);
    }
}
