<?php

declare(strict_types=1);

namespace App\Http\Requests\Tenant;

use App\Enums\Tenant\PatientGender;
use App\Enums\Tenant\PatientMaritalStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;

class UpdatePatientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('patients.update') ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'first_name' => ['sometimes', 'required', 'string', 'max:120'],
            'last_name' => ['sometimes', 'required', 'string', 'max:120'],
            'phone' => ['sometimes', 'required', 'string', 'max:30'],
            'phone_alt' => ['nullable', 'string', 'max:30'],
            'date_of_birth' => ['nullable', 'date', 'before_or_equal:today'],
            'gender' => ['nullable', new Enum(PatientGender::class)],
            'marital_status' => ['nullable', new Enum(PatientMaritalStatus::class)],
            'occupation' => ['nullable', 'string', 'max:120'],
            'preferred_language' => ['nullable', Rule::in(['en', 'ar'])],
            'national_id' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:191'],
            'address' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:100'],
            'emergency_name' => ['nullable', 'string', 'max:120'],
            'emergency_phone' => ['nullable', 'string', 'max:30'],
            'emergency_relation' => ['nullable', 'string', 'max:60'],
            'blood_type' => ['nullable', 'string', 'max:5'],
            'allergies_summary' => ['nullable', 'string', 'max:2000'],
            'chronic_summary' => ['nullable', 'string', 'max:2000'],
            'medications_summary' => ['nullable', 'string', 'max:2000'],
            'has_insurance' => ['sometimes', 'boolean'],
            'insurance_provider_id' => ['nullable', 'integer', 'exists:insurance_providers,id'],
            'insurance_policy_number' => ['nullable', 'string', 'max:60'],
            'referred_by' => ['nullable', 'string', 'max:120'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
