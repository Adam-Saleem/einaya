<?php

declare(strict_types=1);

namespace App\Http\Requests\Central;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCouponRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->is_super_admin === true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'code' => [
                'required',
                'string',
                'max:32',
                'regex:/^[A-Za-z0-9_\-]+$/',
                Rule::unique('coupons', 'code'),
            ],
            'plan_id' => ['required', 'integer', 'exists:subscription_plans,id'],
            'duration_days' => ['required', 'integer', 'min:1', 'max:3650'],
            'expires_at' => ['nullable', 'date', 'after:now'],
            'max_uses' => ['required', 'integer', 'min:1', 'max:1000000'],
            'description' => ['nullable', 'string', 'max:500'],
            'is_active' => ['boolean'],
        ];
    }

    /**
     * Normalise the code to upper-case so admins can't accidentally
     * register two coupons that differ only by case. Mutating before
     * validation also makes the unique check case-insensitive.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('code')) {
            $this->merge(['code' => strtoupper((string) $this->input('code'))]);
        }
    }
}
