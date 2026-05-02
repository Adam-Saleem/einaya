<?php

declare(strict_types=1);

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class TwoFactorChallengeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->session()->has('auth.two_factor.user_id');
    }

    /**
     * Either `code` (6 TOTP digits) or `recovery_code` (XXXX-XXXX) — at least
     * one must be supplied. Length constraints stay loose so a user typing
     * spaces in the code field still validates.
     *
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'code' => ['nullable', 'string', 'min:4', 'max:10'],
            'recovery_code' => ['nullable', 'string', 'min:4', 'max:30'],
        ];
    }
}
