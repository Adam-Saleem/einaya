<?php

declare(strict_types=1);

namespace App\Http\Requests\Tenant;

use Illuminate\Foundation\Http\FormRequest;

class UpdateWorkingHoursRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('doctor.manage_hours') ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'hours' => ['required', 'array', 'size:7'],
            'hours.*.day_of_week' => ['required', 'integer', 'min:0', 'max:6'],
            'hours.*.is_active' => ['required', 'boolean'],
            'hours.*.start_time' => ['nullable', 'required_if:hours.*.is_active,true', 'date_format:H:i'],
            'hours.*.end_time' => ['nullable', 'required_if:hours.*.is_active,true', 'date_format:H:i', 'after:hours.*.start_time'],
        ];
    }
}
