<?php

declare(strict_types=1);

namespace App\Models\Central;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Stancl\Tenancy\Database\Concerns\CentralConnection;

class DemoRequest extends Model
{
    use CentralConnection;

    protected $fillable = [
        'clinic_name',
        'contact_name',
        'email',
        'phone',
        'country',
        'intent',
        'message',
        'is_handled',
        'handled_at',
        'handled_by',
        'notes',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'is_handled' => 'boolean',
        'handled_at' => 'datetime',
    ];

    public function handler(): BelongsTo
    {
        return $this->belongsTo(User::class, 'handled_by');
    }

    /**
     * Phone is stored E.164 with a leading "+". WhatsApp's wa.me deep-link
     * wants the digits only, no plus or punctuation.
     */
    public function whatsappDigits(): string
    {
        return preg_replace('/\D+/', '', $this->phone) ?? '';
    }
}
