<?php

declare(strict_types=1);

use App\Actions\Tenant\CompleteConsultationAction;
use App\Models\Tenant\ClinicSetting;
use App\Models\Tenant\Consultation;
use App\Models\Tenant\Doctor;
use App\Models\Tenant\Patient;
use App\Models\Tenant\Service;
use App\Models\Tenant\User;
use App\Services\Tenant\BillingCalculator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;

require_once __DIR__.'/TenancyTestSetup.php';

const COMPLETE_SVC_PREFIX = 'pesttestcomplete';

beforeEach(fn () => tenantTestCleanup(COMPLETE_SVC_PREFIX));
afterEach(fn () => tenantTestCleanup(COMPLETE_SVC_PREFIX));

function setupCompleteScenario(string $emailKey): array
{
    $admin = User::factory()->create([
        'email' => $emailKey.'@cmpl.test',
        'password' => Hash::make('Pass#0000'),
        'is_active' => true,
    ]);
    $admin->assignRole('clinic_admin');

    $patient = Patient::factory()->create();
    $doctor = Doctor::factory()->create();

    $consultation = Consultation::create([
        'patient_id' => $patient->id,
        'doctor_id' => $doctor->id,
        'started_at' => Carbon::now(),
    ]);

    ClinicSetting::create([
        'key' => 'pricing',
        'value' => ['first_visit_price' => 100, 'review_visit_price' => 50],
    ]);

    return [$admin, $consultation];
}

it('snapshots service prices into the pivot when completing', function () {
    $tenant = makeTestTenant(COMPLETE_SVC_PREFIX.'-snap');

    $tenant->run(function () {
        [$admin, $consultation] = setupCompleteScenario(uniqid('a', false));

        $svcA = Service::create(['name' => 'X-Ray', 'code' => 'xray', 'price' => 60, 'is_active' => true]);
        $svcB = Service::create(['name' => 'Lab', 'code' => 'lab', 'price' => 30, 'is_active' => true]);

        app(CompleteConsultationAction::class)->execute($consultation, $admin, [
            'visit_type' => 'first',
            'service_ids' => [$svcA->id, $svcB->id],
        ]);

        $consultation->refresh();
        expect($consultation->visit_type)->toBe('first');
        expect($consultation->ended_at)->not->toBeNull();
        expect($consultation->services()->count())->toBe(2);

        $rows = $consultation->services()->orderBy('id')->get();
        expect($rows->first()->service_name_snapshot)->toBe('X-Ray');
        expect((float) $rows->first()->price_at_time)->toBe(60.0);

        // Edit the catalogue — snapshot stays.
        $svcA->update(['name' => 'X-Ray (revised)', 'price' => 999]);
        $rows = $consultation->fresh()->services()->orderBy('id')->get();
        expect($rows->first()->service_name_snapshot)->toBe('X-Ray');
        expect((float) $rows->first()->price_at_time)->toBe(60.0);
    });
});

it('computes the bill base + services correctly', function () {
    $tenant = makeTestTenant(COMPLETE_SVC_PREFIX.'-calc');

    $tenant->run(function () {
        [$admin, $consultation] = setupCompleteScenario(uniqid('a', false));

        $svc = Service::create(['name' => 'ECG', 'code' => 'ecg', 'price' => 25, 'is_active' => true]);

        app(CompleteConsultationAction::class)->execute($consultation, $admin, [
            'visit_type' => 'review',
            'service_ids' => [$svc->id],
        ]);

        $summary = app(BillingCalculator::class)->summary($consultation->refresh());
        expect($summary['base_price'])->toBe(50.0);
        expect($summary['services_total'])->toBe(25.0);
        expect($summary['total'])->toBe(75.0);
    });
});
