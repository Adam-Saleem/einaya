<?php

declare(strict_types=1);

namespace App\Http\Requests\Tenant;

use Illuminate\Foundation\Http\FormRequest;

class StoreBreakRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('doctor.manage_hours') ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'day_of_week' => ['required', 'integer', 'min:0', 'max:6'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
            'label' => ['nullable', 'string', 'max:60'],
        ];
    }
}
