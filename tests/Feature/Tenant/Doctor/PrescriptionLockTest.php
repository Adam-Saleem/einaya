<?php

declare(strict_types=1);

use App\Actions\Tenant\StartConsultationAction;
use App\Models\Tenant\Doctor;
use App\Models\Tenant\Patient;
use App\Models\Tenant\Prescription;
use App\Models\Tenant\PrescriptionItem;
use App\Models\Tenant\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;

require_once __DIR__.'/../TenancyTestSetup.php';

const LOCK_PREFIX = 'pesttestlock';

beforeEach(fn () => tenantTestCleanup(LOCK_PREFIX));
afterEach(fn () => tenantTestCleanup(LOCK_PREFIX));

it('refuses to add items to a printed prescription', function () {
    $tenant = makeTestTenant(LOCK_PREFIX.'-a');

    $admin = null;
    $prescription = null;
    $tenant->run(function () use (&$admin, &$prescription) {
        $admin = User::factory()->create([
            'email' => 'doc@lock.test',
            'password' => Hash::make('Pass#0000'),
            'preferred_language' => 'ar',
        ]);
        $admin->assignRole(['clinic_admin', 'doctor']);
        $doctor = Doctor::factory()->create(['user_id' => $admin->id]);
        $patient = Patient::create([
            'first_name' => 'L', 'last_name' => 'P',
            'phone' => '+970-59-9', 'preferred_language' => 'ar',
        ]);

        $consultation = app(StartConsultationAction::class)->execute($patient, $doctor, null, $admin);
        $prescription = Prescription::create([
            'consultation_id' => $consultation->id,
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'printed_at' => Carbon::now(),
        ]);
    });

    $host = LOCK_PREFIX.'-a.einaya.test';

    test()
        ->actingAs($admin, 'web')
        ->from('http://'.$host.'/consultations/1')
        ->post('http://'.$host.'/prescriptions/'.$prescription->id.'/items', [
            'medication_name' => 'Aspirin',
        ])
        ->assertSessionHas('error');

    $tenant->run(function () use ($prescription) {
        expect(PrescriptionItem::where('prescription_id', $prescription->id)->count())->toBe(0);
    });
});
