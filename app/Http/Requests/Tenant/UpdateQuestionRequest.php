<?php

declare(strict_types=1);

namespace App\Http\Requests\Tenant;

use App\Enums\Tenant\FormQuestionType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class UpdateQuestionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('forms.manage') ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'label' => ['required', 'string', 'max:300'],
            'key' => ['nullable', 'string', 'max:120', 'regex:/^[a-z0-9_]+$/'],
            'help_text' => ['nullable', 'string', 'max:500'],
            'type' => ['required', new Enum(FormQuestionType::class)],
            'is_required' => ['sometimes', 'boolean'],
            'validation_rules' => ['nullable', 'array'],
            'options' => ['nullable', 'array'],
            'options.*.value' => ['required_with:options', 'string', 'max:120'],
            'options.*.label' => ['required_with:options', 'string', 'max:300'],
        ];
    }
}
