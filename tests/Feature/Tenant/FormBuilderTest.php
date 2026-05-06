<?php

declare(strict_types=1);

use App\Enums\Tenant\FormQuestionType;
use App\Enums\Tenant\FormType;
use App\Models\Tenant\Doctor;
use App\Models\Tenant\FormQuestion;
use App\Models\Tenant\FormQuestionOption;
use App\Models\Tenant\FormSection;
use App\Models\Tenant\MedicalForm;
use App\Models\Tenant\User;
use App\Services\Tenant\FormSnapshotService;
use App\Services\Tenant\MedicalFormService;
use Illuminate\Support\Facades\Hash;

require_once __DIR__.'/TenancyTestSetup.php';

const BUILDER_PREFIX = 'pesttestbuilder';
const BUILDER_TENANT = 'pesttestbuilder-a';

beforeEach(fn () => tenantTestCleanup(BUILDER_PREFIX));
afterEach(fn () => tenantTestCleanup(BUILDER_PREFIX));

it('produces a stable, ordered snapshot from a form', function () {
    $tenant = makeTestTenant(BUILDER_TENANT);

    $tenant->run(function () {
        \Database\Seeders\Tenant\RolesAndPermissionsSeeder::class;
        $doctor = Doctor::factory()->create([
            'user_id' => User::factory()->create()->id,
        ]);

        /** @var MedicalForm $form */
        $form = MedicalForm::create([
            'doctor_id' => $doctor->id,
            'title' => 'Intake',
            'description' => 'Initial intake',
            'type' => FormType::Intake,
            'is_active' => false,
        ]);

        $section1 = FormSection::create([
            'medical_form_id' => $form->id,
            'title' => 'History',
            'order' => 1,
        ]);
        $section2 = FormSection::create([
            'medical_form_id' => $form->id,
            'title' => 'Symptoms',
            'order' => 2,
        ]);

        $smokes = FormQuestion::create([
            'form_section_id' => $section1->id,
            'key' => 'smokes',
            'label' => 'Do you smoke?',
            'type' => FormQuestionType::Radio,
            'is_required' => true,
            'order' => 1,
        ]);
        FormQuestionOption::create([
            'form_question_id' => $smokes->id,
            'value' => 'yes',
            'label' => 'Yes',
            'order' => 1,
        ]);
        FormQuestionOption::create([
            'form_question_id' => $smokes->id,
            'value' => 'no',
            'label' => 'No',
            'order' => 2,
        ]);

        FormQuestion::create([
            'form_section_id' => $section2->id,
            'key' => 'duration',
            'label' => 'Duration of symptoms',
            'type' => FormQuestionType::Text,
            'order' => 1,
        ]);

        $snapshot = app(FormSnapshotService::class)->snapshot($form->fresh(['sections.questions.options']));

        expect($snapshot)
            ->toHaveKey('form_id', $form->id)
            ->toHaveKey('title', 'Intake')
            ->toHaveKey('type', 'intake');
        expect($snapshot['sections'])->toHaveCount(2);
        expect($snapshot['sections'][0]['title'])->toBe('History');
        expect($snapshot['sections'][0]['questions'][0])
            ->toMatchArray([
                'key' => 'smokes',
                'type' => 'radio',
                'required' => true,
            ]);
        expect($snapshot['sections'][0]['questions'][0]['options'])
            ->toBe([
                ['value' => 'yes', 'label' => 'Yes'],
                ['value' => 'no', 'label' => 'No'],
            ]);
        expect($snapshot['sections'][1]['questions'][0]['options'])->toBe([]);
    });
});

it('generates unique stable keys within a single form', function () {
    $tenant = makeTestTenant('pesttestbuilder-keys');

    $tenant->run(function () {
        $doctor = Doctor::factory()->create([
            'user_id' => User::factory()->create()->id,
        ]);

        $form = MedicalForm::create([
            'doctor_id' => $doctor->id,
            'title' => 'Test',
            'type' => FormType::Custom,
        ]);

        $service = app(MedicalFormService::class);

        expect($service->generateKey('Do you smoke?'))->toBe('do_you_smoke');
        expect($service->generateKey('Past surgeries (if any)?'))->toBe('past_surgeries_if_any');

        // First registration of the key returns the bare slug.
        $section = FormSection::create([
            'medical_form_id' => $form->id,
            'title' => 'A',
            'order' => 1,
        ]);
        FormQuestion::create([
            'form_section_id' => $section->id,
            'key' => 'allergies',
            'label' => 'Allergies',
            'type' => FormQuestionType::Text,
            'order' => 1,
        ]);

        expect($service->uniqueKey($form, 'Allergies'))->toBe('allergies_2');
    });
});

it('routes the secretary out of forms.manage', function () {
    $tenant = makeTestTenant('pesttestbuilder-perm');

    $tenant->run(function () {
        $secretary = User::factory()->create([
            'email' => 'sec@bldr.test',
            'password' => Hash::make('Pass#0000'),
            'is_active' => true,
            'preferred_language' => 'ar',
        ]);
        $secretary->assignRole('secretary');

        expect($secretary->can('forms.view'))->toBeFalse();
        expect($secretary->can('forms.manage'))->toBeFalse();
    });
});
