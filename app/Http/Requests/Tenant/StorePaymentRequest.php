<?php

declare(strict_types=1);

namespace App\Http\Requests\Tenant;

use App\Enums\Tenant\PaymentMethod;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class StorePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('payments.create') ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'patient_id' => ['required', 'integer', 'exists:patients,id'],
            'appointment_id' => ['nullable', 'integer', 'exists:appointments,id'],
            'consultation_id' => ['nullable', 'integer', 'exists:consultations,id'],
            'amount' => ['required', 'integer', 'min:1'],
            'method' => ['required', new Enum(PaymentMethod::class)],
            'cash_amount' => ['nullable', 'integer', 'min:0'],
            'card_amount' => ['nullable', 'integer', 'min:0'],
            'insurance_amount' => ['nullable', 'integer', 'min:0'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
