<?php

declare(strict_types=1);

namespace App\Services\Tenant;

use App\Enums\Tenant\AppointmentStatus;
use App\Models\Tenant\Appointment;
use Illuminate\Support\Carbon;

class QueueService
{
    /**
     * Allocate the next queue number for today. Numbers are 1-based and
     * scoped to the calendar day of `scheduled_for`. Called when an
     * appointment transitions to "arrived".
     */
    public function nextNumberFor(Carbon $day): int
    {
        $start = $day->copy()->startOfDay();
        $end = $day->copy()->endOfDay();

        $max = Appointment::query()
            ->whereBetween('scheduled_for', [$start, $end])
            ->max('queue_number');

        return ((int) ($max ?? 0)) + 1;
    }

    public function markArrived(Appointment $appointment): Appointment
    {
        if ($appointment->arrived_at !== null) return $appointment;

        $appointment->arrived_at = Carbon::now();
        $appointment->status = AppointmentStatus::Arrived;
        if ($appointment->queue_number === null) {
            $appointment->queue_number = $this->nextNumberFor(
                Carbon::parse($appointment->scheduled_for),
            );
        }
        $appointment->save();

        return $appointment;
    }
}
