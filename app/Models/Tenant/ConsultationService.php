<?php

declare(strict_types=1);

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConsultationService extends Model
{
    protected $table = 'consultation_service';

    protected $fillable = [
        'consultation_id',
        'service_id',
        'service_name_snapshot',
        'price_at_time',
        'quantity',
    ];

    protected $casts = [
        'price_at_time' => 'integer',
        'quantity' => 'integer',
    ];

    public function consultation(): BelongsTo
    {
        return $this->belongsTo(Consultation::class);
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function lineTotal(): float
    {
        return (float) $this->price_at_time * $this->quantity;
    }
}
