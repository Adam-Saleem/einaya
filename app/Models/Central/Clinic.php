<?php

declare(strict_types=1);

namespace App\Models\Central;

use App\Enums\Central\ClinicStatus;
use Database\Factories\Central\ClinicFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Stancl\Tenancy\Contracts\TenantWithDatabase;
use Stancl\Tenancy\Database\Concerns\HasDatabase;
use Stancl\Tenancy\Database\Concerns\HasDomains;
use Stancl\Tenancy\Database\Models\Tenant as BaseTenant;

class Clinic extends BaseTenant implements TenantWithDatabase
{
    /** @use HasFactory<ClinicFactory> */
    use HasFactory;
    use HasDatabase;
    use HasDomains;
    use SoftDeletes;

    protected $table = 'clinics';

    protected $fillable = [
        'id',
        'name',
        'slug',
        'owner_name',
        'owner_email',
        'owner_phone',
        'status',
        'branding',
        'data',
        'trial_ends_at',
        'subscription_id',
    ];

    protected $casts = [
        'status' => ClinicStatus::class,
        'branding' => 'array',
        'trial_ends_at' => 'datetime',
    ];

    public static function getCustomColumns(): array
    {
        return [
            'id',
            'name',
            'slug',
            'owner_name',
            'owner_email',
            'owner_phone',
            'status',
            'branding',
            'trial_ends_at',
            'subscription_id',
            'created_at',
            'updated_at',
            'deleted_at',
        ];
    }

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    public function supportTickets(): HasMany
    {
        return $this->hasMany(SupportTicket::class);
    }

    protected static function newFactory(): ClinicFactory
    {
        return ClinicFactory::new();
    }
}
