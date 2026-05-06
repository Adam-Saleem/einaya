<?php

declare(strict_types=1);

namespace App\Models\Central;

use App\Enums\Central\TicketStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Stancl\Tenancy\Database\Concerns\CentralConnection;

class SupportTicket extends Model
{
    use CentralConnection;
    use SoftDeletes;

    protected $fillable = [
        'clinic_id',
        'opened_by_email',
        'subject',
        'body',
        'status',
    ];

    protected $casts = [
        'status' => TicketStatus::class,
    ];

    public function clinic(): BelongsTo
    {
        return $this->belongsTo(Clinic::class);
    }
}
