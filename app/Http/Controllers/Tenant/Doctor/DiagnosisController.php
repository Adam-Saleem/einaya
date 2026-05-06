<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant\Doctor;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\Doctor\StoreDiagnosisRequest;
use App\Models\Tenant\Consultation;
use App\Models\Tenant\Diagnosis;
use App\Models\Tenant\User;
use App\Services\Tenant\AuditLogService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class DiagnosisController extends Controller
{
    public function __construct(private AuditLogService $audit)
    {
    }

    public function store(StoreDiagnosisRequest $request, Consultation $consultation): RedirectResponse
    {
        $diagnosis = Diagnosis::create([
            'consultation_id' => $consultation->id,
            'patient_id' => $consultation->patient_id,
            'description' => $request->validated('description'),
            'code' => $request->validated('code'),
            'notes' => $request->validated('notes'),
        ]);

        $this->audit->log($request->user(), 'diagnosis.created', $diagnosis, [], $diagnosis->only([
            'consultation_id', 'description', 'code',
        ]));

        return back();
    }

    public function update(StoreDiagnosisRequest $request, Diagnosis $diagnosis): RedirectResponse
    {
        $original = $diagnosis->only(['description', 'code', 'notes']);
        $diagnosis->fill($request->validated())->save();

        $this->audit->log($request->user(), 'diagnosis.updated', $diagnosis, $original, $diagnosis->only([
            'description', 'code', 'notes',
        ]));

        return back();
    }

    public function destroy(Request $request, Diagnosis $diagnosis): RedirectResponse
    {
        $this->ensureCan($request->user(), 'diagnoses.delete');

        $diagnosis->delete();
        $this->audit->log($request->user(), 'diagnosis.deleted', $diagnosis);

        return back();
    }

    private function ensureCan(?User $user, string $permission): void
    {
        if ($user === null || ! $user->can($permission)) {
            throw new AuthorizationException();
        }
    }
}
