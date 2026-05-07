<?php

declare(strict_types=1);

namespace App\Models\Tenant;

use App\Enums\Tenant\PaymentMethod;
use App\Enums\Tenant\PaymentStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Payment extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'patient_id',
        'appointment_id',
        'consultation_id',
        'amount',
        'currency',
        'method',
        'insurance_amount',
        'cash_amount',
        'card_amount',
        'status',
        'receipt_number',
        'notes',
        'collected_by',
        'paid_at',
    ];

    protected $casts = [
        'amount' => 'integer',
        'insurance_amount' => 'integer',
        'cash_amount' => 'integer',
        'card_amount' => 'integer',
        'method' => PaymentMethod::class,
        'status' => PaymentStatus::class,
        'paid_at' => 'datetime',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    public function consultation(): BelongsTo
    {
        return $this->belongsTo(Consultation::class);
    }

    public function collector(): BelongsTo
    {
        return $this->belongsTo(User::class, 'collected_by');
    }
}
