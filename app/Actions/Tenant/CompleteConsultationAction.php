<?php

declare(strict_types=1);

namespace App\Actions\Tenant;

use App\Enums\Tenant\AppointmentStatus;
use App\Models\Tenant\Consultation;
use App\Models\Tenant\User as TenantUser;
use App\Services\Tenant\AuditLogService;
use Illuminate\Support\Carbon;

class CompleteConsultationAction
{
    public function __construct(private AuditLogService $audit)
    {
    }

    public function execute(Consultation $consultation, ?TenantUser $actor): Consultation
    {
        if ($consultation->ended_at !== null) {
            return $consultation;
        }

        $consultation->ended_at = Carbon::now();
        $consultation->save();

        if ($consultation->appointment) {
            $consultation->appointment->status = AppointmentStatus::Completed;
            $consultation->appointment->save();
        }

        $this->audit->log($actor, 'consultation.completed', $consultation, [], [
            'duration_minutes' => $consultation->started_at && $consultation->ended_at
                ? Carbon::parse($consultation->started_at)->diffInMinutes($consultation->ended_at)
                : null,
        ]);

        return $consultation->refresh();
    }
}
