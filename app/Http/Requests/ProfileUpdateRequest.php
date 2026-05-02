<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProfileUpdateRequest extends FormRequest
{
    /**
     * Validates against whichever User model the active guard resolves to —
     * Central\User on app.einaya.test, Tenant\User on a clinic subdomain.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $userModel = $this->user() === null ? null : $this->user()::class;

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:191',
                $userModel !== null
                    ? Rule::unique($userModel, 'email')->ignore($this->user()->getKey())
                    : 'unique:users,email',
            ],
        ];
    }
}
