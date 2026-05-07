<?php

declare(strict_types=1);

namespace App\Models\Central;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Stancl\Tenancy\Database\Concerns\CentralConnection;

class CouponRedemption extends Model
{
    use CentralConnection;

    protected $fillable = [
        'coupon_id',
        'clinic_id',
        'subscription_id',
        'redeemed_by_user_id',
        'applied_days',
        'prior_plan_id',
        'new_plan_id',
        'prior_ends_at',
        'new_ends_at',
        'redeemed_at',
    ];

    protected $casts = [
        'prior_ends_at' => 'datetime',
        'new_ends_at' => 'datetime',
        'redeemed_at' => 'datetime',
        'applied_days' => 'integer',
    ];

    public function coupon(): BelongsTo
    {
        return $this->belongsTo(Coupon::class);
    }

    public function clinic(): BelongsTo
    {
        return $this->belongsTo(Clinic::class, 'clinic_id');
    }

    public function priorPlan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class, 'prior_plan_id');
    }

    public function newPlan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class, 'new_plan_id');
    }
}
