<?php

declare(strict_types=1);

namespace Database\Factories\Central;

use App\Enums\Central\ClinicStatus;
use App\Models\Central\Clinic;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Clinic>
 */
class ClinicFactory extends Factory
{
    protected $model = Clinic::class;

    public function definition(): array
    {
        $englishNames = [
            'Al-Shifa Medical Center',
            'Jerusalem Family Clinic',
            'Ramallah Care Clinic',
            'Bethlehem Pediatrics',
            'Hebron Health Hub',
            'Nablus Wellness Clinic',
        ];

        $arabicNames = [
            'مركز الشفاء الطبي',
            'عيادة القدس للعائلة',
            'عيادة رام الله للرعاية',
            'عيادة بيت لحم للأطفال',
            'مركز الخليل الصحي',
            'عيادة نابلس للعافية',
        ];

        $name = fake()->randomElement(array_merge($englishNames, $arabicNames));
        $slug = Str::slug(fake()->unique()->word()).'-'.fake()->unique()->numberBetween(1000, 9999);

        return [
            'name' => $name,
            'slug' => $slug,
            'owner_name' => 'Dr. '.fake()->name(),
            'owner_email' => fake()->unique()->safeEmail(),
            'owner_phone' => '+970-5'.fake()->numberBetween(0, 9).'-'.fake()->numerify('###-####'),
            'status' => ClinicStatus::Active,
            'branding' => null,
            'trial_ends_at' => now()->addDays(14),
            'subscription_id' => null,
        ];
    }

    public function pending(): static
    {
        return $this->state(fn () => ['status' => ClinicStatus::Pending]);
    }

    public function suspended(): static
    {
        return $this->state(fn () => ['status' => ClinicStatus::Suspended]);
    }
}
