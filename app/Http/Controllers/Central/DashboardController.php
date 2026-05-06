<?php

declare(strict_types=1);

namespace App\Http\Controllers\Central;

use App\Enums\Central\ClinicStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\Central\AuditLogResource;
use App\Jobs\Central\AggregatePlatformStats;
use App\Models\Central\CentralAuditLog;
use App\Models\Central\Clinic;
use App\Models\Central\GlobalSetting;
use App\Models\Central\Subscription;
use App\Models\Central\SupportTicket;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $now = now();
        $start = $now->copy()->startOfMonth()->subMonths(11);

        $clinicsByMonth = Clinic::query()
            ->withTrashed()
            ->whereBetween('created_at', [$start, $now])
            ->selectRaw("DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count")
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->keyBy('month');

        $months = collect();
        for ($cursor = $start->copy(); $cursor <= $now; $cursor->addMonth()) {
            $key = $cursor->format('Y-m');
            $months->push([
                'month' => $key,
                'label' => $cursor->format('M Y'),
                'count' => (int) ($clinicsByMonth->get($key)->count ?? 0),
            ]);
        }

        $planDistribution = Subscription::query()
            ->whereIn('status', ['trial', 'active'])
            ->with('plan')
            ->get()
            ->groupBy(fn ($sub) => $sub->plan?->name ?? 'Unassigned')
            ->map(fn ($group) => $group->count())
            ->map(fn ($count, $name) => ['name' => (string) $name, 'value' => (int) $count])
            ->values();

        $stats = GlobalSetting::where('key', 'platform_stats')->value('value') ?? [];

        $totalClinics = Clinic::count();
        $activeClinics = Clinic::where('status', ClinicStatus::Active)->count();

        return Inertia::render('Central/Dashboard', [
            'stats' => [
                'total_clinics' => $totalClinics,
                'active_clinics' => $activeClinics,
                'active_subscriptions' => Subscription::whereIn('status', ['trial', 'active'])->count(),
                'open_tickets' => SupportTicket::where('status', 'open')->count(),
                'total_patients' => $stats['total_patients'] ?? null,
                'total_staff' => $stats['total_staff'] ?? null,
                'generated_at' => $stats['generated_at'] ?? null,
            ],
            'clinicsByMonth' => $months->all(),
            'planDistribution' => $planDistribution,
            'recentActivity' => AuditLogResource::collection(
                CentralAuditLog::with('user')->latest('created_at')->limit(10)->get(),
            ),
        ]);
    }

    public function refreshStats(Request $request): RedirectResponse
    {
        // Run synchronously in v1; queue worker is configured in dev but the
        // user expects an immediate refresh on the dashboard click.
        (new AggregatePlatformStats())->handle();

        return back()->with('success', 'Platform stats refreshed.');
    }
}
