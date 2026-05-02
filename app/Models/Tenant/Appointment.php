<?php

declare(strict_types=1);

namespace App\Models\Tenant;

use App\Enums\Tenant\AppointmentStatus;
use Database\Factories\Tenant\AppointmentFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Appointment extends Model
{
    /** @use HasFactory<AppointmentFactory> */
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'patient_id',
        'doctor_id',
        'scheduled_for',
        'duration_minutes',
        'status',
        'reason',
        'notes',
        'cancelled_at',
        'cancellation_reason',
        'arrived_at',
        'queue_number',
        'created_by',
    ];

    protected $casts = [
        'scheduled_for' => 'datetime',
        'cancelled_at' => 'datetime',
        'arrived_at' => 'datetime',
        'duration_minutes' => 'integer',
        'queue_number' => 'integer',
        'status' => AppointmentStatus::class,
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function consultation(): HasOne
    {
        return $this->hasOne(Consultation::class);
    }

    protected static function newFactory(): AppointmentFactory
    {
        return AppointmentFactory::new();
    }
}
