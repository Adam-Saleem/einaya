<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant\Doctor;

use App\Http\Controllers\Controller;
use App\Http\Resources\Tenant\ConsultationResource;
use App\Models\Tenant\Consultation;
use App\Models\Tenant\Patient;
use App\Models\Tenant\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PatientHistoryController extends Controller
{
    public function show(Request $request, Patient $patient): Response
    {
        $this->ensureCan($request->user(), 'consultations.view');

        $consultations = Consultation::query()
            ->where('patient_id', $patient->id)
            ->with([
                'doctor.user',
                'diagnoses',
                'prescriptions.items',
                'formSubmissions',
            ])
            ->orderByDesc('started_at')
            ->get();

        return Inertia::render('Tenant/Doctor/PatientHistory', [
            'patient' => [
                'id' => $patient->id,
                'name' => trim($patient->first_name.' '.$patient->last_name),
                'patient_code' => $patient->patient_code,
                'age' => $patient->date_of_birth ? (int) $patient->date_of_birth->age : null,
                'gender_label' => $patient->gender?->label(),
            ],
            'consultations' => ConsultationResource::collection($consultations)->resolve($request),
        ]);
    }

    private function ensureCan(?User $user, string $permission): void
    {
        if ($user === null || ! $user->can($permission)) {
            throw new AuthorizationException();
        }
    }
}
