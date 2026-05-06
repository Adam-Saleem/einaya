<?php

declare(strict_types=1);

namespace App\Http\Requests\Tenant;

use Illuminate\Foundation\Http\FormRequest;

class StorePatientFileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('files.upload') ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'max:10240', 'mimes:pdf,jpg,jpeg,png,webp'],
            'category' => ['required', 'string', 'max:30'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }
}
