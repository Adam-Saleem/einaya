<?php

declare(strict_types=1);

namespace App\Actions\Tenant;

use App\Models\Tenant\Consultation;
use App\Models\Tenant\FormSubmission;
use App\Models\Tenant\MedicalForm;
use App\Models\Tenant\User as TenantUser;
use App\Services\Tenant\AuditLogService;
use App\Services\Tenant\FormSnapshotService;
use Illuminate\Support\Carbon;
use RuntimeException;

class SubmitFormAction
{
    private const MAX_SNAPSHOT_BYTES = 512000;

    public function __construct(
        private AuditLogService $audit,
        private FormSnapshotService $snapshots,
    ) {
    }

    /**
     * Freezes the form structure into `form_snapshot` and the doctor's
     * answers into `answers_snapshot`. ADR-002: once submitted, the
     * submission is immutable — editing the form afterwards doesn't
     * alter historical submissions.
     *
     * @param  array<string, mixed>  $answers
     */
    public function execute(
        Consultation $consultation,
        MedicalForm $form,
        array $answers,
        ?TenantUser $actor,
    ): FormSubmission {
        $snapshot = $this->snapshots->snapshot($form);

        $size = strlen((string) json_encode($snapshot));
        if ($size > self::MAX_SNAPSHOT_BYTES) {
            throw new RuntimeException(
                "Form structure too large to snapshot ({$size} bytes; max " . self::MAX_SNAPSHOT_BYTES . '). Trim sections, questions, or option labels.',
            );
        }

        $submission = FormSubmission::create([
            'medical_form_id' => $form->id,
            'consultation_id' => $consultation->id,
            'patient_id' => $consultation->patient_id,
            'doctor_id' => $consultation->doctor_id,
            'form_snapshot' => $snapshot,
            'answers_snapshot' => $answers,
            'submitted_at' => Carbon::now(),
        ]);

        $this->audit->log($actor, 'form.submitted', $submission, [], [
            'form_id' => $form->id,
            'consultation_id' => $consultation->id,
        ]);

        return $submission;
    }
}
