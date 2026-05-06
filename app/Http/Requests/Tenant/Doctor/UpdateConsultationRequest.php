<?php

declare(strict_types=1);

namespace App\Http\Requests\Tenant\Doctor;

use Illuminate\Foundation\Http\FormRequest;

class UpdateConsultationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('consultations.update') ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'chief_complaint' => ['nullable', 'string', 'max:2000'],
            'notes' => ['nullable', 'string', 'max:10000'],
            'follow_up_in_days' => ['nullable', 'integer', 'min:0', 'max:365'],
        ];
    }
}
