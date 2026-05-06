<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Appointment;
use App\Models\Tenant\Patient;
use App\Services\Tenant\StatsService;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(private StatsService $stats)
    {
    }

    public function index(): Response
    {
        $today = Carbon::today();

        $upcoming = Appointment::query()
            ->with(['patient:id,first_name,last_name,patient_code', 'doctor.user:id,name'])
            ->whereDate('scheduled_for', $today)
            ->orderBy('scheduled_for')
            ->limit(5)
            ->get();

        $recentPatients = Patient::query()
            ->orderByDesc('created_at')
            ->limit(5)
            ->get(['id', 'first_name', 'last_name', 'patient_code', 'created_at']);

        return Inertia::render('Tenant/Dashboard', [
            'stats' => $this->stats->dashboard(),
            'upcomingToday' => $upcoming->map(fn ($a) => [
                'id' => $a->id,
                'starts_at' => $a->scheduled_for?->toIso8601String(),
                'status' => is_object($a->status) ? $a->status->value : (string) $a->status,
                'patient' => $a->patient ? [
                    'id' => $a->patient->id,
                    'name' => trim($a->patient->first_name.' '.$a->patient->last_name),
                    'patient_code' => $a->patient->patient_code,
                ] : null,
                'doctor' => $a->doctor?->user?->name,
            ])->values(),
            'recentPatients' => $recentPatients->map(fn ($p) => [
                'id' => $p->id,
                'name' => trim($p->first_name.' '.$p->last_name),
                'patient_code' => $p->patient_code,
                'created_at' => $p->created_at?->toIso8601String(),
            ])->values(),
        ]);
    }
}
