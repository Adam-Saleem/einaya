<?php

declare(strict_types=1);

namespace App\Jobs\Central;

use App\Enums\Central\ClinicStatus;
use App\Models\Central\Clinic;
use App\Models\Central\GlobalSetting;
use App\Models\Central\Subscription;
use App\Models\Central\SupportTicket;
use App\Models\Tenant\Patient;
use App\Models\Tenant\User as TenantUser;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Throwable;

/**
 * Walks every active tenant DB to count rows we want to surface on the
 * super-admin dashboard. Stored in `global_settings.platform_stats` so the
 * dashboard can render synchronously off cached data; users can also trigger
 * a one-shot refresh via the controller endpoint.
 *
 * Suspended/cancelled clinics are skipped so a stuck DB can't crash the job.
 */
class AggregatePlatformStats implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function handle(): void
    {
        $clinics = Clinic::query()->withoutTrashed()->get();

        $totalClinics = $clinics->count();
        $activeClinics = $clinics
            ->where('status', ClinicStatus::Active)
            ->count();
        $activeSubscriptions = Subscription::whereIn('status', ['trial', 'active'])->count();
        $openTickets = SupportTicket::where('status', 'open')->count();

        $patientsTotal = 0;
        $staffTotal = 0;
        $perClinic = [];

        foreach ($clinics as $clinic) {
            if (! $clinic->isActive()) {
                $perClinic[$clinic->id] = ['patients' => 0, 'staff' => 0, 'skipped' => true];
                continue;
            }

            try {
                $clinic->run(function () use (&$patientsTotal, &$staffTotal, &$perClinic, $clinic) {
                    $patients = Patient::query()->count();
                    $staff = TenantUser::query()->where('is_active', true)->count();
                    $patientsTotal += $patients;
                    $staffTotal += $staff;
                    $perClinic[$clinic->id] = [
                        'patients' => $patients,
                        'staff' => $staff,
                        'skipped' => false,
                    ];
                });
            } catch (Throwable $e) {
                report($e);
                $perClinic[$clinic->id] = ['patients' => 0, 'staff' => 0, 'skipped' => true];
            }
        }

        GlobalSetting::updateOrCreate(
            ['key' => 'platform_stats'],
            [
                'value' => [
                    'generated_at' => now()->toIso8601String(),
                    'total_clinics' => $totalClinics,
                    'active_clinics' => $activeClinics,
                    'active_subscriptions' => $activeSubscriptions,
                    'open_tickets' => $openTickets,
                    'total_patients' => $patientsTotal,
                    'total_staff' => $staffTotal,
                    'per_clinic' => $perClinic,
                ],
            ],
        );
    }
}
