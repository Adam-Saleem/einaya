<?php

declare(strict_types=1);

namespace App\Http\Resources\Tenant;

use App\Models\Tenant\Consultation;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Consultation */
class ConsultationResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'appointment_id' => $this->appointment_id,
            'patient_id' => $this->patient_id,
            'doctor_id' => $this->doctor_id,
            'started_at' => $this->started_at?->toIso8601String(),
            'ended_at' => $this->ended_at?->toIso8601String(),
            'is_completed' => $this->ended_at !== null,
            'chief_complaint' => $this->chief_complaint,
            'notes' => $this->notes,
            'follow_up_in_days' => $this->follow_up_in_days,
            'patient' => $this->whenLoaded('patient', fn () => [
                'id' => $this->patient->id,
                'patient_code' => $this->patient->patient_code,
                'first_name' => $this->patient->first_name,
                'last_name' => $this->patient->last_name,
                'name' => trim($this->patient->first_name.' '.$this->patient->last_name),
                'phone' => $this->patient->phone,
                'date_of_birth' => $this->patient->date_of_birth?->toDateString(),
                'age' => $this->patient->date_of_birth ? (int) $this->patient->date_of_birth->age : null,
                'gender' => $this->patient->gender?->value,
                'gender_label' => $this->patient->gender?->label(),
                'blood_type' => $this->patient->blood_type,
                'allergies_summary' => $this->patient->allergies_summary,
                'chronic_summary' => $this->patient->chronic_summary,
                'medications_summary' => $this->patient->medications_summary,
                'has_insurance' => (bool) $this->patient->has_insurance,
                'preferred_language' => $this->patient->preferred_language?->value ?? 'ar',
                'profile_photo_url' => $this->patient->profile_photo_path
                    ? '/storage/'.$this->patient->profile_photo_path
                    : null,
            ]),
            'doctor' => $this->whenLoaded('doctor', fn () => [
                'id' => $this->doctor->id,
                'name' => $this->doctor->user?->name,
                'specialty' => $this->doctor->specialty,
                'license_number' => $this->doctor->license_number,
            ]),
            // Phase 23: diagnoses field stays empty in the API surface so
            // older FE builds don't NPE; the new visit page no longer
            // renders them.
            'diagnoses' => [],
            'services' => $this->whenLoaded(
                'services',
                fn () => $this->services->map(fn ($s) => [
                    'id' => $s->id,
                    'service_id' => $s->service_id,
                    'name' => $s->service_name_snapshot,
                    'price' => (float) $s->price_at_time,
                    'quantity' => (int) $s->quantity,
                ]),
            ),
            'prescriptions' => $this->whenLoaded(
                'prescriptions',
                fn () => PrescriptionResource::collection($this->prescriptions)->resolve($request),
            ),
            'form_submissions' => $this->whenLoaded(
                'formSubmissions',
                fn () => FormSubmissionResource::collection($this->formSubmissions)->resolve($request),
            ),
        ];
    }
}
