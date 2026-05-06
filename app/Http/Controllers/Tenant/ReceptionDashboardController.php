<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant;

use App\Enums\Tenant\AppointmentStatus;
use App\Enums\Tenant\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\Tenant\AppointmentResource;
use App\Models\Tenant\Appointment;
use App\Models\Tenant\Payment;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class ReceptionDashboardController extends Controller
{
    public function index(): Response
    {
        $today = Carbon::today();
        $start = $today->copy()->startOfDay();
        $end = $today->copy()->endOfDay();

        $todays = Appointment::query()
            ->with(['patient:id,first_name,last_name,patient_code,phone', 'doctor.user:id,name'])
            ->whereBetween('scheduled_for', [$start, $end])
            ->orderBy('scheduled_for')
            ->get();

        $byStatus = [];
        foreach (AppointmentStatus::cases() as $status) {
            $byStatus[$status->value] = 0;
        }
        foreach ($todays as $a) {
            $key = is_object($a->status) ? $a->status->value : (string) $a->status;
            $byStatus[$key] = ($byStatus[$key] ?? 0) + 1;
        }

        // Walk-ins: appointments created today whose scheduled_for is also
        // today (best-effort proxy until v2 explicitly tags walk-ins).
        $walkIns = Appointment::query()
            ->whereDate('created_at', $today)
            ->whereDate('scheduled_for', $today)
            ->count();

        $pendingPayments = Payment::query()
            ->where('status', PaymentStatus::Pending)
            ->count();

        return Inertia::render('Tenant/Reception/Dashboard', [
            'stats' => [
                'today_total' => $todays->count(),
                'by_status' => $byStatus,
                'walk_ins_today' => $walkIns,
                'pending_payments' => $pendingPayments,
            ],
            'queue' => AppointmentResource::collection($todays)->resolve(request()),
        ]);
    }
}
