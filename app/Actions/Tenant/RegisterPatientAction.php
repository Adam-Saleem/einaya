<?php

declare(strict_types=1);

namespace App\Actions\Tenant;

use App\Models\Tenant\InsuranceProvider;
use App\Models\Tenant\Patient;
use App\Models\Tenant\PatientFile;
use App\Models\Tenant\User as TenantUser;
use App\Services\Tenant\AuditLogService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

class RegisterPatientAction
{
    public function __construct(private AuditLogService $audit)
    {
    }

    /**
     * @param  array<string, mixed>  $data
     * @param  array<int, array{file: UploadedFile, category: string, notes?: string|null}>  $files
     */
    public function execute(array $data, array $files, ?TenantUser $actor): Patient
    {
        // Phase 21: callers can pass a single `full_name` instead of
        // first_name/last_name. Split on the first space — single-word
        // names duplicate to last_name so the NOT NULL constraint and
        // the existing `name` accessor still work.
        if (! empty($data['full_name'])) {
            $name = trim((string) $data['full_name']);
            if (str_contains($name, ' ')) {
                [$first, $last] = explode(' ', $name, 2);
                $data['first_name'] = trim($first);
                $data['last_name'] = trim($last);
            } else {
                $data['first_name'] = $name;
                $data['last_name'] = $name;
            }
            unset($data['full_name']);
        }

        // "Add new provider" inline support — caller passes
        // `insurance_provider_new` to create on the fly. Auto-toggles
        // has_insurance to true.
        if (! empty($data['insurance_provider_new'])) {
            $provider = InsuranceProvider::firstOrCreate(
                ['name' => $data['insurance_provider_new']],
                ['is_active' => true],
            );
            $data['insurance_provider_id'] = $provider->id;
            $data['has_insurance'] = true;
            unset($data['insurance_provider_new']);
        }

        $data['phone'] = $this->normalizePhone($data['phone'] ?? '');
        if (! empty($data['phone_alt'])) {
            $data['phone_alt'] = $this->normalizePhone($data['phone_alt']);
        }
        if (! empty($data['emergency_phone'])) {
            $data['emergency_phone'] = $this->normalizePhone($data['emergency_phone']);
        }

        $data['registered_by'] = $actor?->id;

        $patient = DB::transaction(function () use ($data, $files) {
            /** @var Patient $patient */
            $patient = Patient::create($data);

            foreach ($files as $entry) {
                if (! ($entry['file'] ?? null) instanceof UploadedFile) continue;
                /** @var UploadedFile $file */
                $file = $entry['file'];
                $stored = $file->store('patient-files/'.$patient->id, 'public');
                PatientFile::create([
                    'patient_id' => $patient->id,
                    'uploaded_by' => $data['registered_by'] ?? 0,
                    'category' => $entry['category'] ?? 'other',
                    'file_path' => $stored,
                    'original_name' => $file->getClientOriginalName(),
                    'mime_type' => $file->getMimeType() ?? 'application/octet-stream',
                    'size_bytes' => $file->getSize() ?: 0,
                    'notes' => $entry['notes'] ?? null,
                ]);
            }

            return $patient;
        });

        $this->audit->log($actor, 'patient.created', $patient, [], [
            'patient_code' => $patient->patient_code,
            'name' => trim($patient->first_name.' '.$patient->last_name),
            'phone' => $patient->phone,
        ]);

        return $patient->fresh();
    }

    /**
     * Strip whitespace, dashes, and parentheses; preserve a leading "+".
     * Stored form: "+970599991111" or "0599991111".
     */
    private function normalizePhone(string $phone): string
    {
        $trimmed = trim($phone);
        $hasPlus = str_starts_with($trimmed, '+');
        $digits = preg_replace('/\D+/', '', $trimmed) ?? '';
        return ($hasPlus ? '+' : '').$digits;
    }
}
