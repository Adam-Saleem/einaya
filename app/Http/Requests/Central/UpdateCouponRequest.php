<?php

declare(strict_types=1);

namespace App\Http\Requests\Central;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCouponRequest extends FormRequest
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
        $couponId = $this->route('coupon')?->id;

        return [
            'code' => [
                'sometimes',
                'required',
                'string',
                'max:32',
                'regex:/^[A-Za-z0-9_\-]+$/',
                Rule::unique('coupons', 'code')->ignore($couponId),
            ],
            'plan_id' => ['sometimes', 'required', 'integer', 'exists:subscription_plans,id'],
            'duration_days' => ['sometimes', 'required', 'integer', 'min:1', 'max:3650'],
            'expires_at' => ['nullable', 'date'],
            'max_uses' => ['sometimes', 'required', 'integer', 'min:1', 'max:1000000'],
            'description' => ['nullable', 'string', 'max:500'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('code')) {
            $this->merge(['code' => strtoupper((string) $this->input('code'))]);
        }
    }
}
