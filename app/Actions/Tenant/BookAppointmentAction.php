<?php

declare(strict_types=1);

namespace App\Actions\Tenant;

use App\Enums\Tenant\AppointmentStatus;
use App\Models\Tenant\Appointment;
use App\Models\Tenant\Doctor;
use App\Models\Tenant\User as TenantUser;
use App\Services\Tenant\AppointmentConflictService;
use App\Services\Tenant\AuditLogService;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;

class BookAppointmentAction
{
    public function __construct(
        private AuditLogService $audit,
        private AppointmentConflictService $conflicts,
    ) {
    }

    /**
     * @param  array{patient_id: int, doctor_id: int, scheduled_for: string, duration_minutes: int, reason?: string|null, notes?: string|null, status?: string, force?: bool}  $data
     */
    public function execute(array $data, ?TenantUser $actor): Appointment
    {
        $doctor = Doctor::findOrFail($data['doctor_id']);
        $startsAt = Carbon::parse($data['scheduled_for']);
        $duration = (int) ($data['duration_minutes'] ?? $doctor->consultation_duration_minutes);

        $check = $this->conflicts->check($doctor, $startsAt, $duration);

        // Hard conflicts always abort. Warnings can be overridden via
        // `force => true` (checkbox in the booking dialog).
        if (! empty($check['errors'])) {
            throw ValidationException::withMessages([
                'scheduled_for' => 'This slot overlaps another appointment.',
            ]);
        }

        if (! empty($check['warnings']) && empty($data['force'])) {
            throw ValidationException::withMessages([
                'scheduled_for' => 'warnings:'.implode('|', $check['warnings']),
            ]);
        }

        $appointment = Appointment::create([
            'patient_id' => $data['patient_id'],
            'doctor_id' => $doctor->id,
            'scheduled_for' => $startsAt,
            'duration_minutes' => $duration,
            'status' => $data['status'] ?? AppointmentStatus::Pending->value,
            'reason' => $data['reason'] ?? null,
            'notes' => $data['notes'] ?? null,
            'created_by' => $actor?->id ?? 0,
        ]);

        $this->audit->log($actor, 'appointment.created', $appointment, [], $appointment->only([
            'patient_id', 'doctor_id', 'scheduled_for', 'duration_minutes', 'status',
        ]));

        return $appointment;
    }
}
