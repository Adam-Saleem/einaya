<?php

declare(strict_types=1);

namespace App\Http\Controllers\Central;

use App\Http\Controllers\Controller;
use App\Http\Requests\Central\UpdateSubscriptionRequest;
use App\Http\Resources\Central\SubscriptionResource;
use App\Models\Central\Subscription;
use App\Services\Central\AuditLogService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class SubscriptionController extends Controller
{
    public function __construct(private AuditLogService $audit)
    {
    }

    public function index(): Response
    {
        $subscriptions = Subscription::query()
            ->with(['clinic', 'plan'])
            ->latest('starts_at')
            ->paginate(25);

        return Inertia::render('Central/Subscriptions/Index', [
            'subscriptions' => SubscriptionResource::collection($subscriptions),
        ]);
    }

    public function update(UpdateSubscriptionRequest $request, Subscription $subscription): RedirectResponse
    {
        $previous = ['ends_at' => $subscription->ends_at?->toIso8601String()];

        $subscription->ends_at = $request->date('ends_at');
        $subscription->save();

        $this->audit->log(
            $request->user(),
            'subscription.extended',
            $subscription,
            $previous,
            [
                'ends_at' => $subscription->ends_at?->toIso8601String(),
                'note' => $request->string('note')->toString(),
            ],
        );

        return back()->with('success', 'Subscription extended.');
    }
}
