<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant\Doctor;

use App\Enums\Tenant\AppointmentStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\Tenant\AppointmentResource;
use App\Models\Tenant\Appointment;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        // Phase 25: doctor home is three stacked work lists — Waiting,
        // In progress, Checkout. The stats / monthly / recent-patients
        // panels are gone. Date filter widens the lookback window.
        $window = match ($request->query('window')) {
            '24h' => Carbon::now()->subHours(24),
            '3d' => Carbon::now()->subDays(3),
            default => Carbon::now()->subHours(8),
        };

        $eagerLoads = [
            'patient:id,first_name,last_name,patient_code,phone,allergies_summary,chronic_summary',
            'doctor.user:id,name',
        ];

        $waiting = Appointment::query()
            ->with($eagerLoads)
            ->where('status', AppointmentStatus::Arrived)
            ->whereBetween('scheduled_for', [$window, Carbon::now()->endOfDay()])
            ->orderBy('arrived_at')
            ->get();

        $inProgress = Appointment::query()
            ->with($eagerLoads)
            ->where('status', AppointmentStatus::InProgress)
            ->whereBetween('scheduled_for', [$window, Carbon::now()->endOfDay()])
            ->orderBy('scheduled_for')
            ->get();

        $checkout = Appointment::query()
            ->with($eagerLoads)
            ->where('status', AppointmentStatus::Completed)
            ->whereBetween('scheduled_for', [$window, Carbon::now()->endOfDay()])
            ->orderByDesc('scheduled_for')
            ->limit(50)
            ->get();

        return Inertia::render('Tenant/Doctor/Dashboard', [
            'window' => $request->query('window', '8h'),
            'waiting' => AppointmentResource::collection($waiting)->resolve($request),
            'inProgress' => AppointmentResource::collection($inProgress)->resolve($request),
            'checkout' => AppointmentResource::collection($checkout)->resolve($request),
        ]);
    }
}
