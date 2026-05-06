<?php

declare(strict_types=1);

namespace App\Http\Requests\Central;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) ($this->user()?->is_super_admin ?? false);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'general.platform_name' => ['nullable', 'string', 'max:120'],
            'general.support_email' => ['nullable', 'email', 'max:191'],
            'general.default_language' => ['nullable', Rule::in(['en', 'ar'])],
            'legal.terms_url' => ['nullable', 'url', 'max:500'],
            'legal.privacy_url' => ['nullable', 'url', 'max:500'],
            'branding.logo_url' => ['nullable', 'url', 'max:500'],
        ];
    }
}
