<?php

declare(strict_types=1);

namespace App\Http\Requests\Tenant;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateClinicSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('clinic.update_settings') ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'general.name' => ['nullable', 'string', 'max:120'],
            'general.address' => ['nullable', 'string', 'max:500'],
            'general.phone' => ['nullable', 'string', 'max:30'],
            'general.email' => ['nullable', 'email', 'max:191'],

            'branding.primary_color' => ['nullable', 'regex:/^#([0-9a-fA-F]{6})$/'],
            'branding.logo_url' => ['nullable', 'string', 'max:500'],

            'localization.default_language' => ['nullable', Rule::in(['en', 'ar'])],

            'receipt.header' => ['nullable', 'string', 'max:500'],
            'receipt.footer' => ['nullable', 'string', 'max:500'],
            'receipt.show_logo' => ['nullable', 'boolean'],

            'notifications.appointment_reminders' => ['nullable', 'boolean'],
        ];
    }
}
