<?php

declare(strict_types=1);

use App\Actions\Tenant\StartConsultationAction;
use App\Models\Tenant\Doctor;
use App\Models\Tenant\Patient;
use App\Models\Tenant\Prescription;
use App\Models\Tenant\PrescriptionItem;
use App\Models\Tenant\User;
use App\Services\Tenant\MedicationSuggestionService;

require_once __DIR__.'/../TenancyTestSetup.php';

const MED_PREFIX = 'pesttestmed';

beforeEach(fn () => tenantTestCleanup(MED_PREFIX));
afterEach(fn () => tenantTestCleanup(MED_PREFIX));

it('returns previously prescribed medications matching a query', function () {
    $tenant = makeTestTenant(MED_PREFIX.'-a');

    $tenant->run(function () {
        $admin = User::factory()->create();
        $doctor = Doctor::factory()->create(['user_id' => $admin->id]);
        $patient = Patient::create([
            'first_name' => 'M', 'last_name' => 'P',
            'phone' => '+970-59-7', 'preferred_language' => 'ar',
        ]);

        $consultation = app(StartConsultationAction::class)->execute($patient, $doctor, null, $admin);
        $prescription = Prescription::create([
            'consultation_id' => $consultation->id,
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
        ]);

        foreach (['Amoxicillin 500mg', 'Amoxiclav 625mg', 'Paracetamol 500mg'] as $i => $med) {
            PrescriptionItem::create([
                'prescription_id' => $prescription->id,
                'medication_name' => $med,
                'dosage' => '500mg',
                'frequency' => '3x/day',
                'duration' => '7 days',
                'order' => $i + 1,
            ]);
        }

        $hits = app(MedicationSuggestionService::class)->suggest('amox')->all();
        expect($hits)->toContain('Amoxicillin 500mg', 'Amoxiclav 625mg');
        expect($hits)->not->toContain('Paracetamol 500mg');
    });
});
