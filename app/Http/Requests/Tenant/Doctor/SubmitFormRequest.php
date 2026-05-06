<?php

declare(strict_types=1);

namespace App\Http\Requests\Tenant\Doctor;

use Illuminate\Foundation\Http\FormRequest;

class SubmitFormRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('forms.submit') ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'medical_form_id' => ['required', 'integer', 'exists:medical_forms,id'],
            'answers' => ['required', 'array'],
        ];
    }
}
