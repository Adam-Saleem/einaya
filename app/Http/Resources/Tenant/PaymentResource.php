<?php

declare(strict_types=1);

namespace App\Http\Resources\Tenant;

use App\Models\Tenant\Payment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Payment */
class PaymentResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'receipt_number' => $this->receipt_number,
            'patient_id' => $this->patient_id,
            'appointment_id' => $this->appointment_id,
            'consultation_id' => $this->consultation_id,
            'amount' => (float) $this->amount,
            'cash_amount' => (float) $this->cash_amount,
            'card_amount' => (float) $this->card_amount,
            'insurance_amount' => (float) $this->insurance_amount,
            'method' => is_object($this->method) ? $this->method->value : (string) $this->method,
            'method_label' => is_object($this->method) ? $this->method->label() : null,
            'status' => is_object($this->status) ? $this->status->value : (string) $this->status,
            'paid_at' => $this->paid_at?->toIso8601String(),
            'collected_by' => $this->collected_by,
            'notes' => $this->notes,
            'patient' => $this->whenLoaded('patient', fn () => [
                'id' => $this->patient->id,
                'name' => trim($this->patient->first_name.' '.$this->patient->last_name),
                'patient_code' => $this->patient->patient_code,
            ]),
            'collector' => $this->whenLoaded('collector', fn () => $this->collector ? [
                'id' => $this->collector->id,
                'name' => $this->collector->name,
            ] : null),
        ];
    }
}
