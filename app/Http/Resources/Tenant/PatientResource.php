<?php

declare(strict_types=1);

namespace App\Http\Resources\Tenant;

use App\Models\Tenant\Patient;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Patient */
class PatientResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'patient_code' => $this->patient_code,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'name' => trim($this->first_name.' '.$this->last_name),
            'national_id' => $this->national_id,
            'date_of_birth' => $this->date_of_birth?->toDateString(),
            'age' => $this->date_of_birth ? (int) $this->date_of_birth->age : null,
            'gender' => $this->gender?->value,
            'gender_label' => $this->gender?->label(),
            'marital_status' => $this->marital_status?->value,
            'occupation' => $this->occupation,
            'preferred_language' => $this->preferred_language?->value ?? 'ar',
            'phone' => $this->phone,
            'phone_alt' => $this->phone_alt,
            'email' => $this->email,
            'address' => $this->address,
            'city' => $this->city,
            'village' => $this->village,
            'emergency_name' => $this->emergency_name,
            'emergency_phone' => $this->emergency_phone,
            'emergency_relation' => $this->emergency_relation,
            'blood_type' => $this->blood_type,
            'allergies_summary' => $this->allergies_summary,
            'chronic_summary' => $this->chronic_summary,
            'medications_summary' => $this->medications_summary,
            'has_insurance' => (bool) $this->has_insurance,
            'insurance_provider_id' => $this->insurance_provider_id,
            'insurance_policy_number' => $this->insurance_policy_number,
            'insurance_provider' => $this->whenLoaded('insuranceProvider', fn () => $this->insuranceProvider ? [
                'id' => $this->insuranceProvider->id,
                'name' => $this->insuranceProvider->name,
            ] : null),
            'profile_photo_path' => $this->profile_photo_path,
            'profile_photo_url' => $this->profile_photo_path ? '/storage/'.$this->profile_photo_path : null,
            'notes' => $this->notes,
            'referred_by' => $this->referred_by,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
