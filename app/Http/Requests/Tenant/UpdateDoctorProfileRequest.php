<?php

declare(strict_types=1);

namespace App\Http\Requests\Tenant;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDoctorProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('doctor.update_profile') ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:191'],
            'phone' => ['nullable', 'string', 'max:30'],
            'avatar' => ['sometimes', 'nullable', 'image', 'max:2048'],
            'specialty' => ['required', 'string', 'max:120'],
            'license_number' => ['nullable', 'string', 'max:60'],
            'bio_en' => ['nullable', 'string', 'max:4000'],
            'bio_ar' => ['nullable', 'string', 'max:4000'],
            'consultation_duration_minutes' => ['required', 'integer', 'min:5', 'max:240'],
        ];
    }
}
