<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\StorePatientFileRequest;
use App\Models\Tenant\Patient;
use App\Models\Tenant\PatientFile;
use App\Models\Tenant\User;
use App\Services\Tenant\AuditLogService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PatientFileController extends Controller
{
    public function __construct(private AuditLogService $audit)
    {
    }

    public function store(StorePatientFileRequest $request, Patient $patient): RedirectResponse
    {
        $upload = $request->file('file');
        $stored = $upload->store('patient-files/'.$patient->id, 'public');

        $file = PatientFile::create([
            'patient_id' => $patient->id,
            'uploaded_by' => $request->user()?->id ?? 0,
            'category' => $request->string('category')->toString(),
            'file_path' => $stored,
            'original_name' => $upload->getClientOriginalName(),
            'mime_type' => $upload->getMimeType() ?? 'application/octet-stream',
            'size_bytes' => $upload->getSize() ?: 0,
            'notes' => $request->string('notes')->toString() ?: null,
        ]);

        $this->audit->log($request->user(), 'patient_file.uploaded', $file, [], $file->only([
            'patient_id', 'category', 'original_name',
        ]));

        return back()->with('success', 'File uploaded.');
    }

    public function destroy(Request $request, Patient $patient, PatientFile $file): RedirectResponse
    {
        $this->ensureCan($request->user(), 'files.delete');

        if ($file->patient_id !== $patient->id) abort(404);

        $file->delete();
        $this->audit->log($request->user(), 'patient_file.deleted', $file);

        return back()->with('success', 'File removed.');
    }

    private function ensureCan(?User $user, string $permission): void
    {
        if ($user === null || ! $user->can($permission)) {
            throw new AuthorizationException();
        }
    }
}
