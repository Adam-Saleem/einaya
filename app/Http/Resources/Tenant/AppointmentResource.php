<?php

declare(strict_types=1);

namespace App\Http\Resources\Tenant;

use App\Models\Tenant\Appointment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Appointment */
class AppointmentResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'patient_id' => $this->patient_id,
            'doctor_id' => $this->doctor_id,
            'scheduled_for' => $this->scheduled_for?->toIso8601String(),
            'duration_minutes' => $this->duration_minutes,
            'status' => is_object($this->status) ? $this->status->value : (string) $this->status,
            'status_label' => is_object($this->status) ? $this->status->label() : (string) $this->status,
            'reason' => $this->reason,
            'notes' => $this->notes,
            'arrived_at' => $this->arrived_at?->toIso8601String(),
            'queue_number' => $this->queue_number,
            'cancelled_at' => $this->cancelled_at?->toIso8601String(),
            'cancellation_reason' => $this->cancellation_reason,
            'patient' => $this->whenLoaded('patient', fn () => [
                'id' => $this->patient->id,
                'patient_code' => $this->patient->patient_code,
                'name' => trim($this->patient->first_name.' '.$this->patient->last_name),
                'phone' => $this->patient->phone,
            ]),
            'doctor' => $this->whenLoaded('doctor', fn () => [
                'id' => $this->doctor->id,
                'name' => $this->doctor->user?->name,
            ]),
        ];
    }
}
