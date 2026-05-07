<?php

declare(strict_types=1);

namespace App\Actions\Tenant;

use App\Enums\Tenant\AppointmentStatus;
use App\Models\Tenant\Consultation;
use App\Models\Tenant\ConsultationService;
use App\Models\Tenant\Service;
use App\Models\Tenant\User as TenantUser;
use App\Services\Tenant\AuditLogService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class CompleteConsultationAction
{
    public function __construct(private AuditLogService $audit)
    {
    }

    /**
     * @param  array{visit_type?: ?string, service_ids?: array<int, int>}  $billing
     */
    public function execute(
        Consultation $consultation,
        ?TenantUser $actor,
        array $billing = [],
    ): Consultation {
        if ($consultation->ended_at !== null) {
            return $consultation;
        }

        DB::transaction(function () use ($consultation, $billing) {
            $consultation->ended_at = Carbon::now();
            if (array_key_exists('visit_type', $billing) && $billing['visit_type'] !== null) {
                $consultation->visit_type = $billing['visit_type'];
            }
            $consultation->save();

            // Snapshot the selected services with their current price so
            // future catalogue edits don't rewrite this bill.
            $serviceIds = array_values(array_unique($billing['service_ids'] ?? []));
            if ($serviceIds !== []) {
                $services = Service::query()->whereIn('id', $serviceIds)->get();
                foreach ($services as $service) {
                    ConsultationService::create([
                        'consultation_id' => $consultation->id,
                        'service_id' => $service->id,
                        'service_name_snapshot' => $service->name,
                        'price_at_time' => $service->price,
                        'quantity' => 1,
                    ]);
                }
            }

            if ($consultation->appointment) {
                $consultation->appointment->status = AppointmentStatus::Completed;
                $consultation->appointment->save();
            }
        });

        $this->audit->log($actor, 'consultation.completed', $consultation, [], [
            'duration_minutes' => $consultation->started_at && $consultation->ended_at
                ? Carbon::parse($consultation->started_at)->diffInMinutes($consultation->ended_at)
                : null,
            'visit_type' => $consultation->visit_type,
            'services_count' => $consultation->services()->count(),
        ]);

        return $consultation->refresh();
    }
}
