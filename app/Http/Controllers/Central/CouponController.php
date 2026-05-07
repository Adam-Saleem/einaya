<?php

declare(strict_types=1);

namespace App\Http\Controllers\Central;

use App\Http\Controllers\Controller;
use App\Http\Requests\Central\StoreCouponRequest;
use App\Http\Requests\Central\UpdateCouponRequest;
use App\Http\Resources\Central\CouponResource;
use App\Models\Central\Coupon;
use App\Models\Central\SubscriptionPlan;
use App\Services\Central\AuditLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CouponController extends Controller
{
    public function __construct(private AuditLogService $audit)
    {
    }

    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $status = $request->query('status', 'all');
        $planId = $request->query('plan_id');

        $rows = Coupon::query()
            ->with(['plan:id,name,slug', 'creator:id,name,email'])
            ->when($search !== '', function ($q) use ($search) {
                $q->where('code', 'like', '%'.strtoupper($search).'%')
                    ->orWhere('description', 'like', '%'.$search.'%');
            })
            ->when(is_numeric($planId), fn ($q) => $q->where('plan_id', (int) $planId))
            ->when($status === 'active', fn ($q) => $q->active())
            ->when($status === 'expired', fn ($q) => $q->where('expires_at', '<=', now()))
            ->when($status === 'exhausted', fn ($q) => $q->whereColumn('used_count', '>=', 'max_uses'))
            ->when($status === 'disabled', fn ($q) => $q->where('is_active', false))
            ->orderByDesc('created_at')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Central/Coupons/Index', [
            'coupons' => CouponResource::collection($rows),
            'plans' => SubscriptionPlan::query()
                ->where('is_active', true)
                ->orderBy('order')
                ->get(['id', 'name', 'slug'])
                ->map->only(['id', 'name', 'slug']),
            'filters' => [
                'search' => $search,
                'status' => is_string($status) ? $status : 'all',
                'plan_id' => is_numeric($planId) ? (int) $planId : null,
            ],
        ]);
    }

    public function store(StoreCouponRequest $request): RedirectResponse
    {
        $coupon = Coupon::create($request->safe()->merge([
            'created_by' => $request->user()?->id,
        ])->all());

        $this->audit->log(
            $request->user(),
            'coupon.created',
            $coupon,
            [],
            $coupon->only(['code', 'plan_id', 'duration_days', 'max_uses', 'expires_at', 'is_active']),
        );

        return back()->with('success', __('Coupon created.'));
    }

    public function update(UpdateCouponRequest $request, Coupon $coupon): RedirectResponse
    {
        $old = $coupon->only(['code', 'plan_id', 'duration_days', 'max_uses', 'expires_at', 'is_active', 'description']);
        $coupon->update($request->safe()->all());

        $this->audit->log(
            $request->user(),
            'coupon.updated',
            $coupon,
            $old,
            $coupon->only(['code', 'plan_id', 'duration_days', 'max_uses', 'expires_at', 'is_active', 'description']),
        );

        return back()->with('success', __('Coupon updated.'));
    }

    public function destroy(Request $request, Coupon $coupon): RedirectResponse
    {
        $old = $coupon->only(['code', 'plan_id', 'duration_days', 'used_count', 'max_uses']);
        $coupon->delete();

        $this->audit->log(
            $request->user(),
            'coupon.deleted',
            $coupon,
            $old,
            [],
        );

        return back()->with('success', __('Coupon archived.'));
    }
}
