<?php

declare(strict_types=1);

namespace App\Services\Tenant;

use App\Enums\Tenant\AppointmentStatus;
use App\Models\Tenant\Appointment;
use App\Models\Tenant\Consultation;
use App\Models\Tenant\Patient;
use App\Models\Tenant\Payment;
use Illuminate\Support\Carbon;

class StatsService
{
    /**
     * @return array{
     *     today_appointments: array{total: int, by_status: array<string, int>},
     *     patients_this_month: array{new: int, returning: int, total: int},
     *     revenue_this_month: float,
     *     pending_followups: int,
     * }
     */
    public function dashboard(): array
    {
        $today = Carbon::today();
        $monthStart = Carbon::now()->startOfMonth();
        $monthEnd = Carbon::now()->endOfMonth();
        $followUpEnd = Carbon::now()->addDays(7);

        $todayAppointments = Appointment::query()
            ->whereDate('scheduled_for', $today)
            ->get(['status']);

        $byStatus = [];
        foreach (AppointmentStatus::cases() as $status) {
            $byStatus[$status->value] = 0;
        }
        foreach ($todayAppointments as $appointment) {
            $key = $appointment->status instanceof AppointmentStatus
                ? $appointment->status->value
                : (string) $appointment->status;
            $byStatus[$key] = ($byStatus[$key] ?? 0) + 1;
        }

        $monthPatients = Patient::query()
            ->whereBetween('created_at', [$monthStart, $monthEnd])
            ->count();

        $returningPatients = Patient::query()
            ->whereHas('appointments', fn ($q) => $q->whereBetween('scheduled_for', [$monthStart, $monthEnd]))
            ->where('created_at', '<', $monthStart)
            ->count();

        $revenue = (float) Payment::query()
            ->whereBetween('paid_at', [$monthStart, $monthEnd])
            ->sum('amount');

        $pendingFollowUps = Consultation::query()
            ->whereNotNull('follow_up_in_days')
            ->where('ended_at', '>=', Carbon::now()->subDays(60))
            ->get(['ended_at', 'follow_up_in_days'])
            ->filter(function ($c) use ($followUpEnd) {
                if ($c->ended_at === null || $c->follow_up_in_days === null) return false;
                $due = Carbon::parse($c->ended_at)->addDays((int) $c->follow_up_in_days);
                return $due->between(Carbon::now(), $followUpEnd);
            })
            ->count();

        return [
            'today_appointments' => [
                'total' => $todayAppointments->count(),
                'by_status' => $byStatus,
            ],
            'patients_this_month' => [
                'new' => $monthPatients,
                'returning' => $returningPatients,
                'total' => $monthPatients + $returningPatients,
            ],
            'revenue_this_month' => $revenue,
            'pending_followups' => $pendingFollowUps,
        ];
    }
}
