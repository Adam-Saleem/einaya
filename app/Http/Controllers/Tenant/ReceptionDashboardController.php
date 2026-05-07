<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant;

use App\Enums\Tenant\AppointmentStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\Tenant\AppointmentResource;
use App\Models\Tenant\Appointment;
use App\Models\Tenant\Doctor;
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

        // Phase 21: simplified dashboard ships a single summary line in the
        // header — done count, pending count, and the absolute total.
        $done = 0;
        $pending = 0;
        foreach ($todays as $a) {
            $key = is_object($a->status) ? $a->status->value : (string) $a->status;
            if (in_array($key, [AppointmentStatus::Completed->value], true)) {
                $done++;
            } elseif (! in_array($key, [AppointmentStatus::Cancelled->value, AppointmentStatus::NoShow->value], true)) {
                $pending++;
            }
        }

        $doctors = Doctor::query()
            ->with('user:id,name')
            ->where('is_active', true)
            ->get(['id', 'user_id', 'consultation_duration_minutes'])
            ->map(fn (Doctor $d) => [
                'id' => $d->id,
                'name' => $d->user?->name,
                'consultation_duration_minutes' => $d->consultation_duration_minutes,
            ]);

        return Inertia::render('Tenant/Reception/Dashboard', [
            'summary' => [
                'total' => $todays->count(),
                'done' => $done,
                'pending' => $pending,
            ],
            'queue' => AppointmentResource::collection($todays)->resolve(request()),
            'doctors' => $doctors,
        ]);
    }
}
