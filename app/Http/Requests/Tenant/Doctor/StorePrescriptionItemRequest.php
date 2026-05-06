<?php

declare(strict_types=1);

namespace App\Http\Requests\Tenant\Doctor;

use Illuminate\Foundation\Http\FormRequest;

class StorePrescriptionItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('prescriptions.create') ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'medication_name' => ['required', 'string', 'max:191'],
            'dosage' => ['nullable', 'string', 'max:120'],
            'frequency' => ['nullable', 'string', 'max:120'],
            'duration' => ['nullable', 'string', 'max:120'],
            'instructions' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
