<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant;

use App\Actions\Tenant\RedeemCouponAction;
use App\Enums\Tenant\Permission;
use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\RedeemCouponRequest;
use App\Models\Central\Clinic;
use App\Models\Central\CouponRedemption;
use App\Models\Central\SubscriptionPlan;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class SubscriptionController extends Controller
{
    public function show(): Response
    {
        abort_unless(
            request()->user()?->can(Permission::ClinicManageSubscription->value),
            403,
        );

        $clinic = Clinic::query()->find(tenant('id'));
        $sub = $clinic?->activeSubscription()?->loadMissing('plan');

        $catalogue = SubscriptionPlan::query()
            ->where('is_active', true)
            ->orderBy('order')
            ->get(['id', 'slug', 'name', 'price_monthly', 'price_yearly', 'features'])
            ->map(fn (SubscriptionPlan $p) => [
                'id' => $p->id,
                'slug' => $p->slug,
                'name' => $p->name,
                'price_monthly' => (float) $p->price_monthly,
                'price_yearly' => (float) $p->price_yearly,
                'features' => $p->features ?? [],
                'is_current' => $sub?->plan_id === $p->id,
            ]);

        $history = CouponRedemption::query()
            ->where('clinic_id', $clinic?->id)
            ->with(['coupon:id,code,description', 'newPlan:id,name', 'priorPlan:id,name'])
            ->orderByDesc('redeemed_at')
            ->limit(10)
            ->get()
            ->map(fn (CouponRedemption $r) => [
                'id' => $r->id,
                'code' => $r->coupon?->code,
                'applied_days' => $r->applied_days,
                'prior_plan' => $r->priorPlan?->name,
                'new_plan' => $r->newPlan?->name,
                'prior_ends_at' => $r->prior_ends_at?->toIso8601String(),
                'new_ends_at' => $r->new_ends_at?->toIso8601String(),
                'redeemed_at' => $r->redeemed_at?->toIso8601String(),
            ]);

        $now = now();
        $endsAt = $sub?->ends_at;
        $daysRemaining = $endsAt ? max(0, (int) $now->diffInDays($endsAt, false)) : null;

        return Inertia::render('Tenant/Subscription/Index', [
            'subscription' => $sub ? [
                'id' => $sub->id,
                'status' => $sub->status->value,
                'status_label' => $sub->status->label(),
                'starts_at' => $sub->starts_at?->toIso8601String(),
                'ends_at' => $endsAt?->toIso8601String(),
                'days_remaining' => $daysRemaining,
                'is_expiring_soon' => $daysRemaining !== null && $daysRemaining <= 14,
                'plan' => $sub->plan ? [
                    'id' => $sub->plan->id,
                    'slug' => $sub->plan->slug,
                    'name' => $sub->plan->name,
                    'price_monthly' => (float) $sub->plan->price_monthly,
                ] : null,
            ] : null,
            'plans' => $catalogue,
            'history' => $history,
        ]);
    }

    public function redeem(RedeemCouponRequest $request, RedeemCouponAction $action): RedirectResponse
    {
        $clinic = Clinic::query()->findOrFail(tenant('id'));

        $result = $action->execute(
            $request->validated('code'),
            $clinic,
            $request->user(),
        );

        $message = match ($result['action']) {
            'extend' => __('Subscription extended by :days days.', ['days' => $result['coupon']->duration_days]),
            'switch' => __('Plan changed to :plan.', ['plan' => $result['subscription']->plan?->name ?? '—']),
            'activate' => __('Subscription activated.'),
        };

        return back()->with('success', $message);
    }
}
