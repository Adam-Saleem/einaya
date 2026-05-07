<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use libphonenumber\NumberParseException;
use libphonenumber\PhoneNumberFormat;
use libphonenumber\PhoneNumberUtil;

class StoreDemoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, ValidationRule|string>>
     */
    public function rules(): array
    {
        return [
            'clinic_name' => ['required', 'string', 'max:120'],
            'contact_name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email:rfc', 'max:255'],
            // E.164: starts with "+", 8–15 digits total. libphonenumber
            // is the source of truth for whether the number is callable.
            'phone' => ['required', 'string', 'min:6', 'max:32', $this->phoneRule()],
            'country' => ['nullable', 'string', 'size:2'],
            'intent' => ['required', 'in:demo,register'],
            'message' => ['nullable', 'string', 'max:2000'],
            // Honeypot. Real users never see this; bots fill it.
            'website' => ['nullable', 'string', 'max:0'],
        ];
    }

    /**
     * Returns a closure rule that fails if libphonenumber rejects the input
     * or if it parses to an invalid number for its detected region.
     */
    private function phoneRule(): \Closure
    {
        return function (string $attribute, mixed $value, \Closure $fail): void {
            if (! is_string($value) || $value === '') {
                $fail(__('validation.required', ['attribute' => $attribute]));

                return;
            }

            try {
                $util = PhoneNumberUtil::getInstance();
                $proto = $util->parse($value, null);
                if (! $util->isValidNumber($proto)) {
                    $fail(__('Phone number is not valid.'));
                }
            } catch (NumberParseException) {
                $fail(__('Phone number could not be understood.'));
            }
        };
    }

    /**
     * Normalize the phone to E.164 before the controller stores it. Done
     * here so the controller stays thin.
     */
    protected function passedValidation(): void
    {
        try {
            $util = PhoneNumberUtil::getInstance();
            $proto = $util->parse((string) $this->input('phone'), null);
            $this->merge([
                'phone' => $util->format($proto, PhoneNumberFormat::E164),
            ]);
        } catch (NumberParseException) {
            // Validated above; if we get here something raced — leave it.
        }
    }
}
