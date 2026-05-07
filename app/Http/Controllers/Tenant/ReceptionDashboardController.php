<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant;

use App\Enums\Tenant\AppointmentStatus;
use App\Enums\Tenant\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\Tenant\AppointmentResource;
use App\Models\Tenant\Appointment;
use App\Models\Tenant\Consultation;
use App\Models\Tenant\Doctor;
use App\Models\Tenant\Payment;
use App\Services\Tenant\BillingCalculator;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class ReceptionDashboardController extends Controller
{
    public function index(BillingCalculator $billing): Response
    {
        $today = Carbon::today();
        $start = $today->copy()->startOfDay();
        $end = $today->copy()->endOfDay();

        // Phase 22: three buckets driven off appointment.status.
        $appointments = Appointment::query()
            ->with(['patient:id,first_name,last_name,patient_code,phone', 'doctor.user:id,name'])
            ->whereBetween('scheduled_for', [$start, $end])
            ->orderBy('scheduled_for')
            ->get();

        $scheduled = [];
        $inProgress = [];
        $completedAppts = [];
        foreach ($appointments as $a) {
            $key = is_object($a->status) ? $a->status->value : (string) $a->status;
            if (in_array($key, [
                AppointmentStatus::Pending->value,
                AppointmentStatus::Confirmed->value,
                AppointmentStatus::Arrived->value,
            ], true)) {
                $scheduled[] = $a;
            } elseif ($key === AppointmentStatus::InProgress->value) {
                $inProgress[] = $a;
            } elseif ($key === AppointmentStatus::Completed->value) {
                $completedAppts[] = $a;
            }
        }

        $completedIds = collect($completedAppts)->pluck('id')->all();
        // "Paid" for reception purposes means a fully-settled or partially
        // collected payment row exists. The PaymentStatus enum carries:
        // Pending | Paid | Partial | Refunded — Pending and Refunded both
        // imply the visit still owes money.
        $paidIds = $completedIds === []
            ? []
            : Payment::query()
                ->whereIn('appointment_id', $completedIds)
                ->whereIn('status', [PaymentStatus::Paid, PaymentStatus::Partial])
                ->pluck('appointment_id')
                ->all();

        // Build the completed bucket with billing breakdown attached
        // so reception can see the total + record payment without
        // chasing the consultation page.
        $completed = collect($completedAppts)->map(function (Appointment $a) use ($billing, $paidIds) {
            $consultation = Consultation::query()
                ->with('services')
                ->where('appointment_id', $a->id)
                ->first();

            $summary = $consultation ? $billing->summary($consultation) : null;

            return [
                'id' => $a->id,
                'patient' => $a->patient ? [
                    'id' => $a->patient->id,
                    'name' => trim($a->patient->first_name.' '.$a->patient->last_name),
                    'phone' => $a->patient->phone,
                ] : null,
                'doctor' => $a->doctor?->user?->name,
                'scheduled_for' => $a->scheduled_for?->toIso8601String(),
                'consultation_id' => $consultation?->id,
                'visit_type' => $consultation?->visit_type,
                'billing' => $summary,
                'is_paid' => in_array($a->id, $paidIds, true),
            ];
        })->all();

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
                'scheduled' => count($scheduled),
                'in_progress' => count($inProgress),
                'pending_payment' => collect($completed)->where('is_paid', false)->count(),
                'total' => $appointments->count(),
            ],
            'scheduled' => AppointmentResource::collection(collect($scheduled))->resolve(request()),
            'inProgress' => AppointmentResource::collection(collect($inProgress))->resolve(request()),
            'completed' => $completed,
            'doctors' => $doctors,
        ]);
    }
}
