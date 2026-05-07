<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant;

use App\Actions\Tenant\RegisterPatientAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\StorePatientRequest;
use App\Http\Requests\Tenant\UpdatePatientRequest;
use App\Http\Resources\Tenant\AppointmentResource;
use App\Http\Resources\Tenant\PatientFileResource;
use App\Http\Resources\Tenant\PatientResource;
use App\Http\Resources\Tenant\PaymentResource;
use App\Models\Tenant\InsuranceProvider;
use App\Models\Tenant\Patient;
use App\Models\Tenant\User;
use App\Services\Tenant\AuditLogService;
use App\Services\Tenant\PatientSearchService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PatientController extends Controller
{
    public function __construct(
        private AuditLogService $audit,
        private PatientSearchService $searchService,
    ) {
    }

    public function index(Request $request): Response
    {
        $this->ensureCan($request->user(), 'patients.view');

        $query = Patient::query()->with('insuranceProvider');

        if ($search = $request->string('search')->toString()) {
            $matches = $this->searchService->search($search, 200)->pluck('id');
            $query->whereIn('id', $matches);
        }

        if ($gender = $request->string('gender')->toString()) {
            $query->where('gender', $gender);
        }

        if ($request->filled('has_insurance')) {
            $query->where('has_insurance', $request->boolean('has_insurance'));
        }

        $patients = $query->latest('updated_at')->paginate(25)->withQueryString();

        return Inertia::render('Tenant/Patients/Index', [
            'patients' => PatientResource::collection($patients),
            'filters' => [
                'search' => $request->string('search')->toString(),
                'gender' => $request->string('gender')->toString(),
                'has_insurance' => $request->string('has_insurance')->toString(),
            ],
            'insuranceProviders' => InsuranceProvider::where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name']),
        ]);
    }

    public function search(Request $request): JsonResponse
    {
        $this->ensureCan($request->user(), 'patients.view');

        $results = $this->searchService->search($request->string('q')->toString());

        return response()->json([
            'results' => $results->map(fn (Patient $p) => [
                'id' => $p->id,
                'patient_code' => $p->patient_code,
                'name' => trim($p->first_name.' '.$p->last_name),
                'phone' => $p->phone,
                'age' => $p->date_of_birth ? (int) $p->date_of_birth->age : null,
                'gender' => $p->gender?->value,
            ])->values(),
        ]);
    }

    public function store(StorePatientRequest $request, RegisterPatientAction $action): RedirectResponse|JsonResponse
    {
        $data = $request->validated();
        $files = collect($data['files'] ?? [])->map(fn ($entry) => [
            'file' => $entry['file'] ?? null,
            'category' => $entry['category'] ?? 'other',
            'notes' => $entry['notes'] ?? null,
        ])->all();
        unset($data['files']);

        // Phone duplicate guard — caller must explicitly opt in to create.
        if (empty($data['force_duplicate_phone']) && ! empty($data['phone'])) {
            $duplicates = $this->searchService->findByPhone($data['phone']);
            if ($duplicates->isNotEmpty()) {
                if ($request->expectsJson()) {
                    return response()->json([
                        'message' => 'Phone duplicate.',
                        'errors' => ['phone' => ['phone_duplicate']],
                        'duplicate_phone_matches' => $duplicates->toArray(),
                    ], 422);
                }

                return back()
                    ->withInput()
                    ->withErrors([
                        'phone' => 'phone_duplicate',
                    ])
                    ->with('duplicate_phone_matches', $duplicates->toArray());
            }
        }
        unset($data['force_duplicate_phone']);

        $patient = $action->execute($data, $files, $request->user());

        // Phase 21: the new-appointment dialog posts via fetch and needs the
        // freshly created patient's id back; Inertia visits still get the
        // redirect-with-flash flow.
        if ($request->expectsJson()) {
            return response()->json([
                'patient' => [
                    'id' => $patient->id,
                    'patient_code' => $patient->patient_code,
                    'name' => trim($patient->first_name.' '.$patient->last_name),
                    'phone' => $patient->phone,
                ],
            ], 201);
        }

        return redirect("/patients/{$patient->id}")
            ->with('success', __('Patient registered.'));
    }

    public function show(Request $request, Patient $patient): Response
    {
        $this->ensureCan($request->user(), 'patients.view');

        $patient->load(['insuranceProvider']);

        $appointments = $patient->appointments()
            ->with(['doctor.user:id,name'])
            ->orderByDesc('scheduled_for')
            ->limit(50)
            ->get();

        $payments = $patient->payments()
            ->with('collector:id,name')
            ->orderByDesc('paid_at')
            ->limit(50)
            ->get();

        $files = $patient->files()
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('Tenant/Patients/Show', [
            'patient' => (new PatientResource($patient))->toArray($request),
            'appointments' => AppointmentResource::collection($appointments)->resolve($request),
            'payments' => PaymentResource::collection($payments)->resolve($request),
            'files' => PatientFileResource::collection($files)->resolve($request),
            'insuranceProviders' => InsuranceProvider::where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name']),
        ]);
    }

    public function update(UpdatePatientRequest $request, Patient $patient): RedirectResponse
    {
        $original = $patient->only(['first_name', 'last_name', 'phone', 'email', 'has_insurance']);
        $patient->fill($request->validated())->save();

        $this->audit->log($request->user(), 'patient.updated', $patient, $original, $patient->only([
            'first_name', 'last_name', 'phone', 'email', 'has_insurance',
        ]));

        return back()->with('success', 'Patient updated.');
    }

    public function destroy(Request $request, Patient $patient): RedirectResponse
    {
        $this->ensureCan($request->user(), 'patients.delete');

        $patient->delete();
        $this->audit->log($request->user(), 'patient.deleted', $patient);

        return redirect('/patients')->with('success', 'Patient archived.');
    }

    private function ensureCan(?User $user, string $permission): void
    {
        if ($user === null || ! $user->can($permission)) {
            throw new AuthorizationException();
        }
    }
}
