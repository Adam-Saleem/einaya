<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant\Doctor;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\Doctor\StorePrescriptionItemRequest;
use App\Models\Tenant\ClinicSetting;
use App\Models\Tenant\Consultation;
use App\Models\Tenant\Prescription;
use App\Models\Tenant\PrescriptionItem;
use App\Models\Tenant\User;
use App\Services\Tenant\AuditLogService;
use App\Services\Tenant\MedicationSuggestionService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class PrescriptionController extends Controller
{
    public function __construct(
        private AuditLogService $audit,
        private MedicationSuggestionService $suggestions,
    ) {
    }

    /**
     * Ensures the consultation has at most one prescription. The frontend
     * always calls into this endpoint, which idempotently returns the
     * existing prescription if one already exists.
     */
    public function ensure(Request $request, Consultation $consultation): RedirectResponse
    {
        $this->ensureCan($request->user(), 'prescriptions.create');

        $prescription = $consultation->prescriptions()->firstOrCreate([
            'patient_id' => $consultation->patient_id,
            'doctor_id' => $consultation->doctor_id,
        ]);

        if ($prescription->wasRecentlyCreated) {
            $this->audit->log($request->user(), 'prescription.created', $prescription);
        }

        return back();
    }

    public function storeItem(
        StorePrescriptionItemRequest $request,
        Prescription $prescription,
    ): RedirectResponse {
        if ($prescription->printed_at !== null) {
            return back()->with('error', 'Cannot edit a printed prescription.');
        }

        $nextOrder = (int) $prescription->items()->max('order') + 1;
        $data = $request->validated();
        // Schema columns are NOT NULL — coerce nullable inputs to empty
        // strings so the doctor can record a partial item if needed.
        $item = PrescriptionItem::create([
            'prescription_id' => $prescription->id,
            'medication_name' => $data['medication_name'],
            'dosage' => $data['dosage'] ?? '',
            'frequency' => $data['frequency'] ?? '',
            'duration' => $data['duration'] ?? '',
            'instructions' => $data['instructions'] ?? null,
            'order' => $nextOrder,
        ]);

        $this->audit->log($request->user(), 'prescription.item_added', $item, [], $item->only([
            'medication_name', 'dosage', 'frequency', 'duration',
        ]));

        return back();
    }

    public function updateItem(
        StorePrescriptionItemRequest $request,
        Prescription $prescription,
        PrescriptionItem $item,
    ): RedirectResponse {
        if ($prescription->printed_at !== null) {
            return back()->with('error', 'Cannot edit a printed prescription.');
        }
        if ($item->prescription_id !== $prescription->id) abort(404);

        $original = $item->only(['medication_name', 'dosage', 'frequency', 'duration', 'instructions']);
        $item->fill($request->validated())->save();

        $this->audit->log($request->user(), 'prescription.item_updated', $item, $original, $item->only([
            'medication_name', 'dosage', 'frequency', 'duration', 'instructions',
        ]));

        return back();
    }

    public function destroyItem(
        Request $request,
        Prescription $prescription,
        PrescriptionItem $item,
    ): RedirectResponse {
        if ($prescription->printed_at !== null) {
            return back()->with('error', 'Cannot edit a printed prescription.');
        }
        if ($item->prescription_id !== $prescription->id) abort(404);

        $item->delete();
        $this->audit->log($request->user(), 'prescription.item_removed', $item);

        return back();
    }

    public function suggestions(Request $request): JsonResponse
    {
        $this->ensureCan($request->user(), 'prescriptions.create');

        return response()->json([
            'results' => $this->suggestions->suggest($request->string('q')->toString())->values(),
        ]);
    }

    public function print(Request $request, Prescription $prescription): Response
    {
        $this->ensureCan($request->user(), 'prescriptions.view');

        $prescription->load(['patient', 'doctor.user', 'items', 'consultation.diagnoses']);

        // Lock once printed.
        if ($prescription->printed_at === null) {
            $prescription->printed_at = Carbon::now();
            $prescription->save();
            $this->audit->log($request->user(), 'prescription.printed', $prescription);
        }

        $clinic = [
            'general' => ClinicSetting::where('key', 'general')->value('value') ?? [],
            'branding' => ClinicSetting::where('key', 'branding')->value('value') ?? [],
            'receipt' => ClinicSetting::where('key', 'receipt')->value('value') ?? [],
        ];

        return Inertia::render('Tenant/Doctor/PrescriptionPrint', [
            'prescription' => [
                'id' => $prescription->id,
                'notes' => $prescription->notes,
                'printed_at' => $prescription->printed_at?->toIso8601String(),
                'items' => $prescription->items->map(fn ($i) => [
                    'medication_name' => $i->medication_name,
                    'dosage' => $i->dosage,
                    'frequency' => $i->frequency,
                    'duration' => $i->duration,
                    'instructions' => $i->instructions,
                ])->values(),
            ],
            'consultation' => [
                'id' => $prescription->consultation_id,
                'diagnoses' => $prescription->consultation?->diagnoses->map(fn ($d) => [
                    'description' => $d->description,
                    'code' => $d->code,
                ])->values(),
            ],
            'patient' => $prescription->patient ? [
                'name' => trim($prescription->patient->first_name.' '.$prescription->patient->last_name),
                'patient_code' => $prescription->patient->patient_code,
                'age' => $prescription->patient->date_of_birth ? (int) $prescription->patient->date_of_birth->age : null,
                'gender_label' => $prescription->patient->gender?->label(),
                'preferred_language' => $prescription->patient->preferred_language?->value ?? 'ar',
            ] : null,
            'doctor' => [
                'name' => $prescription->doctor->user?->name,
                'specialty' => $prescription->doctor->specialty,
                'license_number' => $prescription->doctor->license_number,
            ],
            'clinic' => $clinic,
        ]);
    }

    private function ensureCan(?User $user, string $permission): void
    {
        if ($user === null || ! $user->can($permission)) {
            throw new AuthorizationException();
        }
    }
}
