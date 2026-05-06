<?php

declare(strict_types=1);

namespace App\Actions\Central;

use App\Enums\Central\SubscriptionStatus;
use App\Models\Central\Clinic;
use App\Models\Central\Subscription;
use App\Models\Central\SubscriptionPlan;
use App\Models\Central\User as CentralUser;
use App\Services\Central\AuditLogService;
use Illuminate\Support\Facades\DB;

class ChangeClinicPlanAction
{
    public function __construct(private AuditLogService $audit)
    {
    }

    public function execute(Clinic $clinic, SubscriptionPlan $plan, ?CentralUser $actor): Subscription
    {
        $previous = $clinic->activeSubscription();

        $subscription = DB::transaction(function () use ($clinic, $plan, $previous) {
            if ($previous !== null && $previous->plan_id === $plan->id) {
                return $previous;
            }

            if ($previous !== null) {
                $previous->status = SubscriptionStatus::Cancelled;
                $previous->ends_at = now();
                $previous->save();
            }

            $next = Subscription::create([
                'clinic_id' => $clinic->id,
                'plan_id' => $plan->id,
                'status' => SubscriptionStatus::Active,
                'starts_at' => now(),
                'ends_at' => now()->addYear(),
            ]);

            $clinic->subscription_id = $next->id;
            $clinic->save();

            return $next;
        });

        $this->audit->log(
            $actor,
            'clinic.plan_changed',
            $clinic,
            $previous !== null ? ['plan_id' => $previous->plan_id] : [],
            ['plan_id' => $plan->id],
        );

        return $subscription;
    }
}
