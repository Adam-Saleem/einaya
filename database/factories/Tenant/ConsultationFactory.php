<?php

declare(strict_types=1);

namespace Database\Factories\Tenant;

use App\Models\Tenant\Consultation;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Consultation>
 */
class ConsultationFactory extends Factory
{
    protected $model = Consultation::class;

    public function definition(): array
    {
        $started = fake()->dateTimeBetween('-60 days', '-1 day');
        $ended = (clone $started)->modify('+30 minutes');

        return [
            'started_at' => $started,
            'ended_at' => $ended,
            'chief_complaint' => fake()->randomElement([
                'Persistent dry cough for 2 weeks.',
                'Lower back pain after lifting.',
                'Fatigue and dizziness in the mornings.',
                'Routine annual check-up.',
                'Follow-up for chronic hypertension.',
            ]),
            'notes' => fake()->boolean(60) ? fake()->paragraph() : null,
            'follow_up_in_days' => fake()->boolean(50) ? fake()->randomElement([7, 14, 30, 60, 90]) : null,
        ];
    }
}
