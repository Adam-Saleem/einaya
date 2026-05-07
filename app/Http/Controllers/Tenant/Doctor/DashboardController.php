<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant\Doctor;

use App\Enums\Tenant\AppointmentStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\Tenant\AppointmentResource;
use App\Models\Tenant\Appointment;
use App\Models\Tenant\Consultation;
use App\Models\Tenant\Patient;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $today = Carbon::today();
        $monthStart = Carbon::now()->startOfMonth();
        $monthEnd = Carbon::now()->endOfMonth();
        $followUpEnd = Carbon::now()->addDays(7);

        $todayAppointments = Appointment::query()
            ->with([
                'patient:id,first_name,last_name,patient_code,phone,allergies_summary,chronic_summary',
                'doctor.user:id,name',
            ])
            ->whereDate('scheduled_for', $today)
            ->orderBy('scheduled_for')
            ->get();

        $byStatus = [];
        foreach (AppointmentStatus::cases() as $status) {
            $byStatus[$status->value] = 0;
        }
        foreach ($todayAppointments as $a) {
            $key = is_object($a->status) ? $a->status->value : (string) $a->status;
            $byStatus[$key] = ($byStatus[$key] ?? 0) + 1;
        }

        $patientsSeenToday = Consultation::query()
            ->whereDate('started_at', $today)
            ->whereNotNull('ended_at')
            ->count();

        $monthConsultations = Consultation::query()
            ->whereBetween('started_at', [$monthStart, $monthEnd])
            ->count();

        $pendingFollowUps = Consultation::query()
            ->whereNotNull('follow_up_in_days')
            ->whereNotNull('ended_at')
            ->where('ended_at', '>=', Carbon::now()->subDays(60))
            ->get(['ended_at', 'follow_up_in_days', 'patient_id'])
            ->filter(function ($c) use ($followUpEnd) {
                if ($c->ended_at === null || $c->follow_up_in_days === null) return false;
                $due = Carbon::parse($c->ended_at)->addDays((int) $c->follow_up_in_days);
                return $due->between(Carbon::now(), $followUpEnd);
            })
            ->count();

        $inProgress = Consultation::query()
            ->with('patient:id,first_name,last_name,patient_code')
            ->whereDate('started_at', $today)
            ->whereNull('ended_at')
            ->latest('started_at')
            ->first();

        $arrivedQueue = $todayAppointments
            ->filter(fn ($a) => is_object($a->status)
                ? $a->status === AppointmentStatus::Arrived
                : $a->status === 'arrived')
            ->values();

        $recentPatients = Consultation::query()
            ->with('patient:id,first_name,last_name,patient_code')
            ->whereNotNull('ended_at')
            ->latest('ended_at')
            ->limit(5)
            ->get();

        return Inertia::render('Tenant/Doctor/Dashboard', [
            'stats' => [
                'today_total' => $todayAppointments->count(),
                'arrived' => $byStatus[AppointmentStatus::Arrived->value] ?? 0,
                'completed' => $byStatus[AppointmentStatus::Completed->value] ?? 0,
                'patients_seen_today' => $patientsSeenToday,
                'pending_followups' => $pendingFollowUps,
                'month_consultations' => $monthConsultations,
            ],
            'inProgress' => $inProgress ? [
                'id' => $inProgress->id,
                'patient_name' => trim(
                    ($inProgress->patient->first_name ?? '').' '.
                    ($inProgress->patient->last_name ?? ''),
                ),
                'patient_code' => $inProgress->patient?->patient_code,
                'started_at' => $inProgress->started_at?->toIso8601String(),
            ] : null,
            'queue' => AppointmentResource::collection($arrivedQueue)->resolve($request),
            'todaySchedule' => AppointmentResource::collection($todayAppointments)->resolve($request),
            'recentPatients' => $recentPatients->map(fn ($c) => [
                'consultation_id' => $c->id,
                'patient_id' => $c->patient_id,
                'patient_name' => trim(
                    ($c->patient->first_name ?? '').' '.($c->patient->last_name ?? ''),
                ),
                'patient_code' => $c->patient?->patient_code,
                'ended_at' => $c->ended_at?->toIso8601String(),
            ])->values(),
        ]);
    }
}
