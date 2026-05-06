<?php

declare(strict_types=1);

namespace App\Actions\Central;

use App\Enums\Central\ClinicStatus;
use App\Enums\Central\SubscriptionStatus;
use App\Enums\Tenant\Role as TenantRole;
use App\Models\Central\Clinic;
use App\Models\Central\Subscription;
use App\Models\Central\SubscriptionPlan;
use App\Models\Central\User as CentralUser;
use App\Models\Tenant\User as TenantUser;
use App\Services\Central\AuditLogService;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class CreateClinicAction
{
    public function __construct(private AuditLogService $audit)
    {
    }

    /**
     * @param  array{name: string, slug: string, owner_name: string, owner_email: string, owner_phone?: ?string, plan_id: int, trial_days?: int}  $data
     * @return array{clinic: Clinic, temp_password: string, admin_email: string}
     */
    public function execute(array $data, ?CentralUser $actor): array
    {
        $rootDomain = config('app.env') === 'production' ? 'einaya.ps' : 'einaya.test';
        $trialDays = (int) ($data['trial_days'] ?? 14);
        $tempPassword = $this->generateTemporaryPassword();

        // Cannot wrap this in DB::transaction: Clinic::create() fires
        // stancl's TenantCreated pipeline which runs `CREATE DATABASE` —
        // a DDL statement that implicitly commits any open transaction
        // and then crashes the outer commit with "no active transaction".
        // If the subscription create below fails, the central record is
        // hard-deleted (which fires DeleteDatabase) to keep state aligned.
        try {
            /** @var Clinic $clinic */
            $clinic = Clinic::create([
                'id' => $data['slug'],
                'name' => $data['name'],
                'slug' => $data['slug'],
                'owner_name' => $data['owner_name'],
                'owner_email' => $data['owner_email'],
                'owner_phone' => $data['owner_phone'] ?? null,
                'status' => ClinicStatus::Active,
                'trial_ends_at' => $trialDays > 0 ? now()->addDays($trialDays) : null,
            ]);

            $clinic->domains()->create(['domain' => $data['slug'].'.'.$rootDomain]);

            /** @var SubscriptionPlan $plan */
            $plan = SubscriptionPlan::findOrFail($data['plan_id']);

            $subscription = Subscription::create([
                'clinic_id' => $clinic->id,
                'plan_id' => $plan->id,
                'status' => $trialDays > 0
                    ? SubscriptionStatus::Trial
                    : SubscriptionStatus::Active,
                'starts_at' => now(),
                'ends_at' => $trialDays > 0
                    ? now()->addDays($trialDays)
                    : now()->addYear(),
                'trial_ends_at' => $trialDays > 0 ? now()->addDays($trialDays) : null,
            ]);

            $clinic->subscription_id = $subscription->id;
            $clinic->save();
        } catch (\Throwable $e) {
            if (isset($clinic)) {
                $clinic->forceDelete();
            }
            throw $e;
        }

        // Provision the clinic admin user inside the tenant DB. Tenant
        // migrations and the role catalog are already in place because the
        // TenantCreated pipeline ran during Clinic::create().
        $clinic->run(function () use ($clinic, $data, $tempPassword) {
            $admin = TenantUser::create([
                'name' => $data['owner_name'],
                'email' => $data['owner_email'],
                'password' => Hash::make($tempPassword),
                'phone' => $data['owner_phone'] ?? null,
                'is_active' => true,
                'preferred_language' => 'en',
            ]);

            $admin->assignRole(TenantRole::ClinicAdmin->value);
        });

        $this->audit->log(
            $actor,
            'clinic.created',
            $clinic,
            [],
            [
                'name' => $clinic->name,
                'slug' => $clinic->slug,
                'owner_email' => $clinic->owner_email,
                'plan_id' => $data['plan_id'],
            ],
        );

        return [
            'clinic' => $clinic,
            'temp_password' => $tempPassword,
            'admin_email' => $data['owner_email'],
        ];
    }

    private function generateTemporaryPassword(): string
    {
        // 14 chars, mixed-case + digits + symbol — satisfies the password
        // policy applied on first password change.
        return Str::password(14, symbols: true);
    }
}
