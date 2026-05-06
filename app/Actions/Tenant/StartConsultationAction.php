<?php

declare(strict_types=1);

namespace App\Actions\Tenant;

use App\Enums\Tenant\AppointmentStatus;
use App\Models\Tenant\Appointment;
use App\Models\Tenant\Consultation;
use App\Models\Tenant\Doctor;
use App\Models\Tenant\Patient;
use App\Models\Tenant\User as TenantUser;
use App\Services\Tenant\AuditLogService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class StartConsultationAction
{
    public function __construct(private AuditLogService $audit)
    {
    }

    /**
     * Starts a consultation for either an arrived appointment OR a walk-in
     * patient (no appointment). When called with an existing appointment,
     * the appointment transitions to in_progress; for a walk-in we create
     * one on the fly so audit trails stay consistent.
     */
    public function execute(
        Patient $patient,
        Doctor $doctor,
        ?Appointment $appointment,
        ?TenantUser $actor,
    ): Consultation {
        return DB::transaction(function () use ($patient, $doctor, $appointment, $actor) {
            if ($appointment === null) {
                $appointment = Appointment::create([
                    'patient_id' => $patient->id,
                    'doctor_id' => $doctor->id,
                    'scheduled_for' => Carbon::now(),
                    'duration_minutes' => $doctor->consultation_duration_minutes,
                    'status' => AppointmentStatus::Arrived,
                    'arrived_at' => Carbon::now(),
                    'created_by' => $actor?->id ?? 0,
                ]);
            }

            $appointment->status = AppointmentStatus::InProgress;
            $appointment->save();

            $consultation = Consultation::create([
                'appointment_id' => $appointment->id,
                'patient_id' => $patient->id,
                'doctor_id' => $doctor->id,
                'started_at' => Carbon::now(),
            ]);

            $this->audit->log($actor, 'consultation.started', $consultation, [], [
                'patient_id' => $patient->id,
                'doctor_id' => $doctor->id,
                'appointment_id' => $appointment->id,
            ]);

            return $consultation;
        });
    }
}
