<?php

declare(strict_types=1);

namespace App\Http\Requests\Central;

use Illuminate\Foundation\Http\FormRequest;

class UpdateClinicRequest extends FormRequest
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
        // Slug is intentionally not editable — it owns the subdomain and the
        // FK chain on subscriptions/tickets/audit.
        return [
            'name' => ['required', 'string', 'max:120'],
            'owner_name' => ['required', 'string', 'max:120'],
            'owner_email' => ['required', 'email', 'max:191'],
            'owner_phone' => ['nullable', 'string', 'max:30'],
            'trial_ends_at' => ['nullable', 'date'],
        ];
    }
}
