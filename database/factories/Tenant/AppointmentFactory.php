<?php

declare(strict_types=1);

namespace Database\Factories\Tenant;

use App\Enums\Tenant\AppointmentStatus;
use App\Models\Tenant\Appointment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Appointment>
 */
class AppointmentFactory extends Factory
{
    protected $model = Appointment::class;

    public function definition(): array
    {
        return [
            'scheduled_for' => fake()->dateTimeBetween('-30 days', '+30 days'),
            'duration_minutes' => 30,
            'status' => AppointmentStatus::Pending,
            'reason' => fake()->boolean(80) ? fake()->randomElement([
                'Routine check-up',
                'Follow-up visit',
                'Persistent cough',
                'Headaches',
                'Annual physical',
                'Prescription renewal',
            ]) : null,
        ];
    }

    public function completed(): static
    {
        return $this->state(fn () => [
            'status' => AppointmentStatus::Completed,
            'arrived_at' => fake()->dateTimeBetween('-60 days', '-1 day'),
        ]);
    }

    public function cancelled(): static
    {
        return $this->state(fn () => [
            'status' => AppointmentStatus::Cancelled,
            'cancelled_at' => now(),
            'cancellation_reason' => 'Patient requested reschedule',
        ]);
    }

    public function noShow(): static
    {
        return $this->state(fn () => ['status' => AppointmentStatus::NoShow]);
    }

    public function confirmed(): static
    {
        return $this->state(fn () => ['status' => AppointmentStatus::Confirmed]);
    }
}
