<?php

declare(strict_types=1);

namespace App\Actions\Tenant;

use App\Enums\Central\SubscriptionStatus;
use App\Models\Central\Clinic;
use App\Models\Central\Coupon;
use App\Models\Central\CouponRedemption;
use App\Models\Central\Subscription;
use App\Models\Tenant\User as TenantUser;
use App\Services\Central\AuditLogService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Apply a coupon code to a clinic's active subscription.
 *
 * Three outcomes:
 *  1. Same plan_id as the active subscription → extend ends_at by
 *     coupon.duration_days, preserving any unused time.
 *  2. Different plan_id → cancel the current subscription (ends_at = now)
 *     and open a new one for the coupon's plan with ends_at = now +
 *     duration_days. Unused time on the prior plan is forfeited.
 *  3. No active subscription (clinic is past trial / suspended) → open a
 *     fresh subscription on the coupon's plan with ends_at = now +
 *     duration_days.
 *
 * Everything runs inside a single central-DB transaction with a row-level
 * lock on the coupon, so two clinic admins can't redeem the last slot
 * simultaneously.
 */
class RedeemCouponAction
{
    public function __construct(private AuditLogService $audit)
    {
    }

    /**
     * @return array{
     *   coupon: Coupon,
     *   subscription: Subscription,
     *   redemption: CouponRedemption,
     *   action: 'extend'|'switch'|'activate',
     * }
     */
    public function execute(string $code, Clinic $clinic, ?TenantUser $user): array
    {
        $normalized = strtoupper(trim($code));

        $centralConnection = (string) config('tenancy.database.central_connection');

        return DB::connection($centralConnection)->transaction(function () use ($normalized, $clinic, $user) {
            $coupon = Coupon::query()
                ->where('code', $normalized)
                ->lockForUpdate()
                ->first();

            if ($coupon === null) {
                throw ValidationException::withMessages([
                    'code' => __('No coupon matches that code.'),
                ]);
            }

            if (! $coupon->isRedeemable()) {
                throw ValidationException::withMessages([
                    'code' => match ($coupon->status()) {
                        'expired' => __('This coupon has expired.'),
                        'exhausted' => __('This coupon has been used up.'),
                        'disabled' => __('This coupon is no longer active.'),
                        default => __('This coupon cannot be redeemed.'),
                    },
                ]);
            }

            $alreadyUsed = CouponRedemption::query()
                ->where('coupon_id', $coupon->id)
                ->where('clinic_id', $clinic->id)
                ->exists();

            if ($alreadyUsed) {
                throw ValidationException::withMessages([
                    'code' => __('Your clinic has already used this coupon.'),
                ]);
            }

            $now = Carbon::now();
            $sub = $clinic->activeSubscription();
            $priorPlanId = $sub?->plan_id;
            $priorEndsAt = $sub?->ends_at;

            if ($sub === null) {
                $action = 'activate';
                $newSub = Subscription::create([
                    'clinic_id' => $clinic->id,
                    'plan_id' => $coupon->plan_id,
                    'status' => SubscriptionStatus::Active,
                    'starts_at' => $now,
                    'ends_at' => $now->copy()->addDays($coupon->duration_days),
                ]);
            } elseif ($sub->plan_id === $coupon->plan_id) {
                $action = 'extend';
                $base = $sub->ends_at !== null && $sub->ends_at->isFuture()
                    ? $sub->ends_at
                    : $now;
                $sub->update([
                    'ends_at' => $base->copy()->addDays($coupon->duration_days),
                    'status' => SubscriptionStatus::Active,
                ]);
                $newSub = $sub->refresh();
            } else {
                $action = 'switch';
                $sub->update([
                    'status' => SubscriptionStatus::Cancelled,
                    'ends_at' => $now,
                ]);
                $newSub = Subscription::create([
                    'clinic_id' => $clinic->id,
                    'plan_id' => $coupon->plan_id,
                    'status' => SubscriptionStatus::Active,
                    'starts_at' => $now,
                    'ends_at' => $now->copy()->addDays($coupon->duration_days),
                ]);
            }

            $coupon->increment('used_count');

            $redemption = CouponRedemption::create([
                'coupon_id' => $coupon->id,
                'clinic_id' => $clinic->id,
                'subscription_id' => $newSub->id,
                'redeemed_by_user_id' => $user?->getKey(),
                'applied_days' => $coupon->duration_days,
                'prior_plan_id' => $priorPlanId,
                'new_plan_id' => $coupon->plan_id,
                'prior_ends_at' => $priorEndsAt,
                'new_ends_at' => $newSub->ends_at,
                'redeemed_at' => $now,
            ]);

            // Central audit row — mirrors the pattern other Phase-7 actions
            // use so super admins see redemptions in the activity feed.
            $this->audit->log(
                null,
                'coupon.redeemed',
                $coupon,
                [],
                [
                    'clinic_id' => $clinic->id,
                    'subscription_id' => $newSub->id,
                    'action' => $action,
                    'applied_days' => $coupon->duration_days,
                    'new_ends_at' => $newSub->ends_at?->toIso8601String(),
                ],
            );

            return [
                'coupon' => $coupon->fresh(),
                'subscription' => $newSub,
                'redemption' => $redemption,
                'action' => $action,
            ];
        });
    }
}
