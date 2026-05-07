<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant\Doctor;

use App\Actions\Tenant\CompleteConsultationAction;
use App\Actions\Tenant\StartConsultationAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\Doctor\StartConsultationRequest;
use App\Http\Requests\Tenant\Doctor\UpdateConsultationRequest;
use App\Http\Resources\Tenant\ConsultationResource;
use App\Models\Tenant\Appointment;
use App\Models\Tenant\Consultation;
use App\Models\Tenant\MedicalForm;
use App\Models\Tenant\Patient;
use App\Models\Tenant\User;
use App\Services\Tenant\AuditLogService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ConsultationController extends Controller
{
    public function __construct(private AuditLogService $audit)
    {
    }

    public function store(StartConsultationRequest $request, StartConsultationAction $action): RedirectResponse
    {
        $patient = Patient::findOrFail($request->validated('patient_id'));
        $appointment = $request->filled('appointment_id')
            ? Appointment::findOrFail($request->validated('appointment_id'))
            : null;

        $doctor = $request->user()?->doctor;
        if ($doctor === null) {
            throw new AuthorizationException('No doctor profile attached.');
        }

        $consultation = $action->execute($patient, $doctor, $appointment, $request->user());

        return redirect("/consultations/{$consultation->id}");
    }

    public function show(Request $request, Consultation $consultation): Response
    {
        $this->ensureCan($request->user(), 'consultations.view');

        $consultation->load([
            'patient.insuranceProvider',
            'doctor.user',
            'diagnoses',
            'prescriptions.items',
            'formSubmissions',
        ]);

        $pastConsultations = Consultation::query()
            ->where('patient_id', $consultation->patient_id)
            ->where('id', '!=', $consultation->id)
            ->whereNotNull('ended_at')
            ->with(['diagnoses', 'formSubmissions'])
            ->orderByDesc('ended_at')
            ->limit(20)
            ->get();

        return Inertia::render('Tenant/Doctor/Consultation', [
            'consultation' => (new ConsultationResource($consultation))->toArray($request),
            'history' => $pastConsultations->map(fn (Consultation $c) => [
                'id' => $c->id,
                'started_at' => $c->started_at?->toIso8601String(),
                'ended_at' => $c->ended_at?->toIso8601String(),
                'chief_complaint' => $c->chief_complaint,
                'diagnoses_count' => $c->diagnoses->count(),
                'submissions_count' => $c->formSubmissions->count(),
            ])->values(),
            'forms' => MedicalForm::query()
                ->where('is_active', true)
                ->orderByDesc('updated_at')
                ->get(['id', 'title', 'type'])
                ->map(fn ($f) => [
                    'id' => $f->id,
                    'title' => $f->title,
                    'type' => is_object($f->type) ? $f->type->value : (string) $f->type,
                ]),
            'services' => \App\Models\Tenant\Service::active()
                ->orderBy('display_order')
                ->orderBy('name')
                ->get(['id', 'name', 'price'])
                ->map(fn ($s) => [
                    'id' => $s->id,
                    'name' => $s->name,
                    'price' => (float) $s->price,
                ]),
            'pricing' => $this->pricing(),
        ]);
    }

    /**
     * @return array{first_visit_price: float, review_visit_price: float}
     */
    private function pricing(): array
    {
        $row = \App\Models\Tenant\ClinicSetting::query()
            ->where('key', 'pricing')
            ->first();
        $value = $row?->value ?? [];

        return [
            'first_visit_price' => (float) ($value['first_visit_price'] ?? 0),
            'review_visit_price' => (float) ($value['review_visit_price'] ?? 0),
        ];
    }

    public function update(UpdateConsultationRequest $request, Consultation $consultation): RedirectResponse
    {
        $original = $consultation->only(['chief_complaint', 'notes', 'follow_up_in_days']);
        $consultation->fill($request->validated())->save();

        $this->audit->log($request->user(), 'consultation.updated', $consultation, $original, $consultation->only([
            'chief_complaint', 'notes', 'follow_up_in_days',
        ]));

        return back();
    }

    public function complete(
        Request $request,
        Consultation $consultation,
        CompleteConsultationAction $action,
    ): RedirectResponse {
        $this->ensureCan($request->user(), 'consultations.update');

        $billing = $request->validate([
            'visit_type' => ['nullable', 'in:first,review'],
            'service_ids' => ['nullable', 'array'],
            'service_ids.*' => ['integer', 'exists:clinic_services,id'],
        ]);

        $action->execute($consultation, $request->user(), [
            'visit_type' => $billing['visit_type'] ?? null,
            'service_ids' => $billing['service_ids'] ?? [],
        ]);

        return redirect('/doctor')->with('success', 'Consultation completed.');
    }

    private function ensureCan(?User $user, string $permission): void
    {
        if ($user === null || ! $user->can($permission)) {
            throw new AuthorizationException();
        }
    }
}
