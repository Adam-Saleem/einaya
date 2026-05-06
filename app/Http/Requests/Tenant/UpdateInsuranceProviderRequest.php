<?php

declare(strict_types=1);

namespace App\Http\Requests\Tenant;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateInsuranceProviderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('insurance.manage') ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $id = $this->route('insurance_provider');

        return [
            'name' => [
                'required',
                'string',
                'max:120',
                Rule::unique('insurance_providers', 'name')
                    ->ignore(is_object($id) ? $id->id : $id)
                    ->whereNull('deleted_at'),
            ],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
