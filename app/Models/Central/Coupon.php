<?php

declare(strict_types=1);

namespace App\Models\Central;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Stancl\Tenancy\Database\Concerns\CentralConnection;

class Coupon extends Model
{
    use CentralConnection;
    use SoftDeletes;

    protected $fillable = [
        'code',
        'plan_id',
        'duration_days',
        'expires_at',
        'max_uses',
        'used_count',
        'description',
        'is_active',
        'created_by',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'is_active' => 'boolean',
        'duration_days' => 'integer',
        'max_uses' => 'integer',
        'used_count' => 'integer',
    ];

    public function plan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class, 'plan_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function redemptions(): HasMany
    {
        return $this->hasMany(CouponRedemption::class);
    }

    /**
     * Coupons that can still be redeemed right now.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query
            ->where('is_active', true)
            ->whereColumn('used_count', '<', 'max_uses')
            ->where(function (Builder $q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
            });
    }

    public function isExpired(): bool
    {
        return $this->expires_at !== null && $this->expires_at->isPast();
    }

    public function isExhausted(): bool
    {
        return $this->used_count >= $this->max_uses;
    }

    /**
     * One of: active | expired | exhausted | disabled.
     * Useful for the admin index page status pill and the redemption check.
     */
    public function status(): string
    {
        if (! $this->is_active) return 'disabled';
        if ($this->isExpired()) return 'expired';
        if ($this->isExhausted()) return 'exhausted';

        return 'active';
    }

    public function isRedeemable(): bool
    {
        return $this->status() === 'active';
    }
}
