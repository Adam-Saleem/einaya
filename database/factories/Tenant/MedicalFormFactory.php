<?php

declare(strict_types=1);

namespace Database\Factories\Tenant;

use App\Enums\Tenant\FormType;
use App\Models\Tenant\MedicalForm;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MedicalForm>
 */
class MedicalFormFactory extends Factory
{
    protected $model = MedicalForm::class;

    public function definition(): array
    {
        return [
            'title' => fake()->randomElement([
                'General Intake Form',
                'Cardiology Follow-up',
                'Pediatric Intake',
            ]),
            'description' => fake()->sentence(),
            'type' => FormType::Custom,
            'is_active' => true,
        ];
    }
}
