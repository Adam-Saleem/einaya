<?php

declare(strict_types=1);

namespace App\Http\Resources\Tenant;

use App\Models\Tenant\FormSubmission;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin FormSubmission */
class FormSubmissionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'medical_form_id' => $this->medical_form_id,
            'consultation_id' => $this->consultation_id,
            'patient_id' => $this->patient_id,
            'doctor_id' => $this->doctor_id,
            'form_snapshot' => $this->form_snapshot,
            'answers' => $this->answers_snapshot,
            'submitted_at' => $this->submitted_at?->toIso8601String(),
            'patient' => $this->whenLoaded('patient', fn () => [
                'id' => $this->patient->id,
                'name' => $this->patient->first_name.' '.$this->patient->last_name,
                'patient_code' => $this->patient->patient_code,
            ]),
            'doctor' => $this->whenLoaded('doctor', fn () => [
                'id' => $this->doctor->id,
                'name' => $this->doctor->user?->name,
            ]),
        ];
    }
}
