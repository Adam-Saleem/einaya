<?php

declare(strict_types=1);

namespace App\Http\Requests\Tenant\Doctor;

use Illuminate\Foundation\Http\FormRequest;

class StartConsultationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('consultations.create') ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'patient_id' => ['required', 'integer', 'exists:patients,id'],
            'appointment_id' => ['nullable', 'integer', 'exists:appointments,id'],
        ];
    }
}
