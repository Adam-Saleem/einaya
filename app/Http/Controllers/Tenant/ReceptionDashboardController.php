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
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class ReceptionDashboardController extends Controller
{
    public function index(Request $request, BillingCalculator $billing): Response
    {
        // Phase 25: reception is one list with client-side filters now.
        // The controller exposes today's full appointment set + a billing
        // map keyed by appointment_id so the FE can colour Checkout rows
        // and offer a Record-payment action where appropriate.
        $date = $request->date('date') ?? Carbon::today();
        $start = $date->copy()->startOfDay();
        $end = $date->copy()->endOfDay();

        $appointments = Appointment::query()
            ->with([
                'patient:id,first_name,last_name,patient_code,phone,allergies_summary,chronic_summary',
                'doctor.user:id,name',
            ])
            ->whereBetween('scheduled_for', [$start, $end])
            ->orderBy('scheduled_for')
            ->get();

        $completedIds = $appointments
            ->filter(fn ($a) => is_object($a->status)
                ? $a->status === AppointmentStatus::Completed
                : $a->status === 'completed')
            ->pluck('id')
            ->all();

        $paidIds = $completedIds === []
            ? []
            : Payment::query()
                ->whereIn('appointment_id', $completedIds)
                ->whereIn('status', [PaymentStatus::Paid, PaymentStatus::Partial])
                ->pluck('appointment_id')
                ->all();

        // Build per-appointment billing summary so the Checkout-bucket
        // row can show its calculated total + drive the Record-payment
        // dialog with a prefill.
        $billingByAppointmentId = [];
        if ($completedIds !== []) {
            $consultations = Consultation::query()
                ->with('services')
                ->whereIn('appointment_id', $completedIds)
                ->get()
                ->keyBy('appointment_id');

            foreach ($completedIds as $aid) {
                $cons = $consultations->get($aid);
                if ($cons === null) continue;
                $billingByAppointmentId[$aid] = $billing->summary($cons) + [
                    'is_paid' => in_array($aid, $paidIds, true),
                    'consultation_id' => $cons->id,
                ];
            }
        }

        // Bucket counts for the filter strip. Matches the 4 visit-state
        // buckets — pending|confirmed → scheduled, arrived → waiting,
        // in_progress → engaged, completed → checkout.
        $counts = [
            'scheduled' => 0,
            'waiting' => 0,
            'engaged' => 0,
            'checkout' => 0,
            'cancelled' => 0,
        ];
        foreach ($appointments as $a) {
            $key = is_object($a->status) ? $a->status->value : (string) $a->status;
            if (in_array($key, [AppointmentStatus::Pending->value, AppointmentStatus::Confirmed->value], true)) {
                $counts['scheduled']++;
            } elseif ($key === AppointmentStatus::Arrived->value) {
                $counts['waiting']++;
            } elseif ($key === AppointmentStatus::InProgress->value) {
                $counts['engaged']++;
            } elseif ($key === AppointmentStatus::Completed->value) {
                $counts['checkout']++;
            } elseif (in_array($key, [AppointmentStatus::Cancelled->value, AppointmentStatus::NoShow->value], true)) {
                $counts['cancelled']++;
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
            'date' => $date->toDateString(),
            'counts' => $counts,
            'appointments' => AppointmentResource::collection($appointments)->resolve($request),
            'billingByAppointmentId' => $billingByAppointmentId,
            'doctors' => $doctors,
        ]);
    }
}
