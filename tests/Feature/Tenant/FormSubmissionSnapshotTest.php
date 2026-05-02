<?php

declare(strict_types=1);

use App\Enums\Tenant\FormQuestionType;
use App\Enums\Tenant\FormType;
use App\Models\Tenant\Doctor;
use App\Models\Tenant\FormQuestion;
use App\Models\Tenant\FormSection;
use App\Models\Tenant\FormSubmission;
use App\Models\Tenant\MedicalForm;
use App\Models\Tenant\Patient;
use App\Models\Tenant\User as TenantUser;

require_once __DIR__.'/TenancyTestSetup.php';

const SNAPSHOT_PREFIX = 'pesttestsnapshot';

beforeEach(fn () => tenantTestCleanup(SNAPSHOT_PREFIX));
afterEach(fn () => tenantTestCleanup(SNAPSHOT_PREFIX));

it('locks form structure into each submission so later edits do not rewrite history', function () {
    $tenant = makeTestTenant('pesttestsnapshot-1');

    $tenant->run(function (): void {
        $user = TenantUser::create([
            'name' => 'Dr. Test',
            'email' => 'doc@example.test',
            'password' => 'hashed-not-real',
        ]);
        $doctor = Doctor::create([
            'user_id' => $user->id,
            'specialty' => 'General Medicine',
        ]);
        $patient = Patient::create([
            'first_name' => 'Snap',
            'last_name' => 'Patient',
            'phone' => '+970-59-000-9000',
            'preferred_language' => 'ar',
        ]);

        $form = MedicalForm::create([
            'doctor_id' => $doctor->id,
            'title' => 'Snapshot Form',
            'type' => FormType::Custom,
        ]);
        $section = FormSection::create([
            'medical_form_id' => $form->id,
            'title' => 'Section 1',
            'order' => 1,
        ]);
        $q1 = FormQuestion::create([
            'form_section_id' => $section->id,
            'key' => 'q1',
            'label' => 'Original label',
            'type' => FormQuestionType::Text,
            'order' => 1,
        ]);

        // First submission captures the v1 structure.
        $snapshotV1 = buildSnapshot($form);
        $submission1 = FormSubmission::create([
            'medical_form_id' => $form->id,
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'form_snapshot' => $snapshotV1,
            'answers_snapshot' => ['q1' => 'first answer'],
            'submitted_at' => now(),
        ]);

        // Edit the live form: rename q1, add q2.
        $q1->update(['label' => 'Renamed label']);
        FormQuestion::create([
            'form_section_id' => $section->id,
            'key' => 'q2',
            'label' => 'New question added later',
            'type' => FormQuestionType::Text,
            'order' => 2,
        ]);

        // Second submission captures the v2 structure.
        $snapshotV2 = buildSnapshot($form->refresh());
        $submission2 = FormSubmission::create([
            'medical_form_id' => $form->id,
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'form_snapshot' => $snapshotV2,
            'answers_snapshot' => ['q1' => 'second answer', 'q2' => 'new answer'],
            'submitted_at' => now(),
        ]);

        // First submission still shows the v1 structure — old visit unchanged.
        $loaded1 = FormSubmission::find($submission1->id);
        $sections1 = $loaded1->form_snapshot['sections'];
        expect($sections1[0]['questions'])->toHaveCount(1)
            ->and($sections1[0]['questions'][0]['label'])->toBe('Original label');

        // Second submission has the new structure.
        $loaded2 = FormSubmission::find($submission2->id);
        $sections2 = $loaded2->form_snapshot['sections'];
        expect($sections2[0]['questions'])->toHaveCount(2)
            ->and($sections2[0]['questions'][0]['label'])->toBe('Renamed label')
            ->and($sections2[0]['questions'][1]['key'])->toBe('q2');
    });
});

/**
 * Tiny inline snapshot builder for the test — mirrors the seeder's structure
 * so the assertions above know exactly what to look for.
 *
 * @return array<string, mixed>
 */
function buildSnapshot(MedicalForm $form): array
{
    $form->loadMissing('sections.questions.options');

    return [
        'id' => $form->id,
        'title' => $form->title,
        'type' => $form->type->value,
        'sections' => $form->sections->map(fn (FormSection $s) => [
            'id' => $s->id,
            'title' => $s->title,
            'order' => $s->order,
            'questions' => $s->questions->map(fn (FormQuestion $q) => [
                'id' => $q->id,
                'key' => $q->key,
                'label' => $q->label,
                'type' => $q->type->value,
                'order' => $q->order,
                'options' => $q->options->map(fn ($o) => [
                    'value' => $o->value,
                    'label' => $o->label,
                    'order' => $o->order,
                ])->all(),
            ])->all(),
        ])->all(),
    ];
}
