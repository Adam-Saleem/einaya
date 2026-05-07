<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Consultation;
use App\Models\Tenant\Patient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Phase 25: lightweight JSON endpoint backing the PatientDetailsDialog
 * modal on the Reception page. Returns the same simple form shape
 * (full_name + national_id + phone + gender + marital_status + city +
 * village + DOB) plus a recent visit history with snapshot data so the
 * Medical history tab renders without a second round-trip.
 */
class PatientProfileController extends Controller
{
    public function show(Request $request, Patient $patient): JsonResponse
    {
        if (! $request->user()?->can('patients.view')) {
            abort(403);
        }

        $patient->loadMissing('insuranceProvider');

        $history = Consultation::query()
            ->where('patient_id', $patient->id)
            ->with(['doctor.user:id,name', 'services'])
            ->orderByDesc('started_at')
            ->limit(20)
            ->get()
            ->map(fn (Consultation $c) => [
                'id' => $c->id,
                'started_at' => $c->started_at?->toIso8601String(),
                'ended_at' => $c->ended_at?->toIso8601String(),
                'visit_type' => $c->visit_type,
                'chief_complaint' => $c->chief_complaint,
                'notes' => $c->notes,
                'follow_up_in_days' => $c->follow_up_in_days,
                'doctor' => $c->doctor?->user?->name,
                'services' => $c->services->map(fn ($s) => [
                    'name' => $s->service_name_snapshot,
                    'price' => (int) $s->price_at_time,
                    'quantity' => (int) $s->quantity,
                ])->all(),
            ]);

        return response()->json([
            'patient' => [
                'id' => $patient->id,
                // Mirrors the simple-form shape the dialog edits.
                'full_name' => trim($patient->first_name.' '.$patient->last_name),
                'first_name' => $patient->first_name,
                'last_name' => $patient->last_name,
                'national_id' => $patient->national_id,
                'phone' => $patient->phone,
                'gender' => $patient->gender?->value,
                'marital_status' => $patient->marital_status?->value,
                'city' => $patient->city,
                'village' => $patient->village,
                'date_of_birth' => $patient->date_of_birth?->toDateString(),
                'allergies_summary' => $patient->allergies_summary,
                'chronic_summary' => $patient->chronic_summary,
                'age' => $patient->date_of_birth ? (int) $patient->date_of_birth->age : null,
            ],
            'history' => $history,
        ]);
    }
}
