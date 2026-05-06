<?php

declare(strict_types=1);

namespace App\Actions\Central;

use App\Enums\Central\ClinicStatus;
use App\Models\Central\Clinic;
use App\Models\Central\User as CentralUser;
use App\Services\Central\AuditLogService;

class SuspendClinicAction
{
    public function __construct(private AuditLogService $audit)
    {
    }

    public function suspend(Clinic $clinic, ?CentralUser $actor, ?string $reason = null): Clinic
    {
        return $this->transition(
            $clinic,
            $actor,
            ClinicStatus::Suspended,
            'clinic.suspended',
            ['reason' => $reason],
        );
    }

    public function activate(Clinic $clinic, ?CentralUser $actor): Clinic
    {
        return $this->transition(
            $clinic,
            $actor,
            ClinicStatus::Active,
            'clinic.activated',
        );
    }

    public function cancel(Clinic $clinic, ?CentralUser $actor, ?string $reason = null): Clinic
    {
        return $this->transition(
            $clinic,
            $actor,
            ClinicStatus::Cancelled,
            'clinic.cancelled',
            ['reason' => $reason],
        );
    }

    private function transition(
        Clinic $clinic,
        ?CentralUser $actor,
        ClinicStatus $next,
        string $action,
        array $extraNew = [],
    ): Clinic {
        $previous = $clinic->status instanceof ClinicStatus
            ? $clinic->status->value
            : (string) $clinic->status;

        $clinic->status = $next;
        $clinic->save();

        $this->audit->log(
            $actor,
            $action,
            $clinic,
            ['status' => $previous],
            array_merge(['status' => $next->value], array_filter($extraNew)),
        );

        return $clinic->refresh();
    }
}
