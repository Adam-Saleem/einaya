<?php

declare(strict_types=1);

namespace App\Actions\Tenant;

use App\Enums\Tenant\PaymentMethod;
use App\Enums\Tenant\PaymentStatus;
use App\Models\Tenant\Payment;
use App\Models\Tenant\User as TenantUser;
use App\Services\Tenant\AuditLogService;
use App\Services\Tenant\ReceiptNumberGenerator;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;

class RecordPaymentAction
{
    public function __construct(
        private AuditLogService $audit,
        private ReceiptNumberGenerator $receiptNumbers,
    ) {
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function execute(array $data, ?TenantUser $actor): Payment
    {
        $method = PaymentMethod::from($data['method']);
        $amount = (float) $data['amount'];

        // Mixed payment must have cash + card + insurance summing to amount.
        $cash = (float) ($data['cash_amount'] ?? 0);
        $card = (float) ($data['card_amount'] ?? 0);
        $insurance = (float) ($data['insurance_amount'] ?? 0);

        if ($method === PaymentMethod::Mixed) {
            $sum = round($cash + $card + $insurance, 2);
            if (round($amount, 2) !== $sum) {
                throw ValidationException::withMessages([
                    'amount' => 'Mixed-method totals must add up to the amount.',
                ]);
            }
        } else {
            // Single-method shortcut: split column equals amount, others 0.
            $cash = $method === PaymentMethod::Cash ? $amount : 0;
            $card = $method === PaymentMethod::Card ? $amount : 0;
            $insurance = $method === PaymentMethod::Insurance ? $amount : 0;
        }

        $payment = Payment::create([
            'patient_id' => $data['patient_id'],
            'appointment_id' => $data['appointment_id'] ?? null,
            'consultation_id' => $data['consultation_id'] ?? null,
            'amount' => $amount,
            'cash_amount' => $cash,
            'card_amount' => $card,
            'insurance_amount' => $insurance,
            'method' => $method,
            'status' => PaymentStatus::Paid,
            'paid_at' => Carbon::now(),
            'collected_by' => $actor?->id ?? 0,
            'receipt_number' => $this->receiptNumbers->next(),
            'notes' => $data['notes'] ?? null,
        ]);

        $this->audit->log($actor, 'payment.created', $payment, [], $payment->only([
            'amount', 'method', 'receipt_number', 'patient_id',
        ]));

        return $payment;
    }
}
