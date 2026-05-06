<?php

declare(strict_types=1);

namespace App\Http\Controllers\Central;

use App\Http\Controllers\Controller;
use App\Http\Requests\Central\StorePlanRequest;
use App\Http\Requests\Central\UpdatePlanRequest;
use App\Http\Resources\Central\PlanResource;
use App\Models\Central\SubscriptionPlan;
use App\Services\Central\AuditLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PlanController extends Controller
{
    public function __construct(private AuditLogService $audit)
    {
    }

    public function index(): Response
    {
        $plans = SubscriptionPlan::query()
            ->withCount(['subscriptions' => fn ($q) => $q->whereIn('status', ['trial', 'active'])])
            ->orderBy('order')
            ->get();

        return Inertia::render('Central/Plans/Index', [
            'plans' => PlanResource::collection($plans),
        ]);
    }

    public function store(StorePlanRequest $request): RedirectResponse
    {
        $plan = SubscriptionPlan::create($request->validated());
        $this->audit->log($request->user(), 'plan.created', $plan, [], $plan->only([
            'name', 'slug', 'price_monthly', 'price_yearly',
        ]));

        return back()->with('success', 'Plan created.');
    }

    public function update(UpdatePlanRequest $request, SubscriptionPlan $plan): RedirectResponse
    {
        $original = $plan->only([
            'name', 'price_monthly', 'price_yearly', 'max_patients', 'max_staff',
            'features', 'is_active', 'order',
        ]);

        $plan->fill($request->validated())->save();

        $this->audit->log(
            $request->user(),
            'plan.updated',
            $plan,
            $original,
            $plan->only([
                'name', 'price_monthly', 'price_yearly', 'max_patients', 'max_staff',
                'features', 'is_active', 'order',
            ]),
        );

        return back()->with('success', 'Plan updated.');
    }

    public function destroy(Request $request, SubscriptionPlan $plan): RedirectResponse
    {
        // Spec: cannot delete a plan that has active subscriptions. Soft
        // delete preserves historical references in subscription rows.
        $activeCount = $plan->subscriptions()
            ->whereIn('status', ['trial', 'active'])
            ->count();

        if ($activeCount > 0) {
            return back()->with(
                'error',
                "Cannot delete plan: {$activeCount} active subscription(s) reference it.",
            );
        }

        $plan->delete();
        $this->audit->log($request->user(), 'plan.deleted', $plan, $plan->toArray());

        return back()->with('success', 'Plan archived.');
    }
}
