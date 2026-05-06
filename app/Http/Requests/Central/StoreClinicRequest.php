<?php

declare(strict_types=1);

namespace App\Http\Requests\Central;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreClinicRequest extends FormRequest
{
    /**
     * Reserved subdomains that must never be used as a tenant slug — they
     * either collide with our central routes (`app`, `api`, `www`, `mail`)
     * or are common phishing targets.
     */
    private const RESERVED = ['app', 'admin', 'api', 'www', 'mail', 'central', 'einaya'];

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
            'name' => ['required', 'string', 'max:120'],
            'slug' => [
                'required',
                'string',
                'min:3',
                'max:30',
                'regex:/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/',
                Rule::notIn(self::RESERVED),
                Rule::unique('clinics', 'slug')->whereNull('deleted_at'),
            ],
            'owner_name' => ['required', 'string', 'max:120'],
            'owner_email' => ['required', 'email', 'max:191'],
            'owner_phone' => ['nullable', 'string', 'max:30'],
            'plan_id' => ['required', 'integer', 'exists:subscription_plans,id'],
            'trial_days' => ['nullable', 'integer', 'min:0', 'max:90'],
        ];
    }

    public function messages(): array
    {
        return [
            'slug.regex' => 'The slug may only contain lowercase letters, digits and dashes.',
            'slug.not_in' => 'This slug is reserved and cannot be used.',
        ];
    }
}
