<?php

declare(strict_types=1);

use App\Actions\Tenant\StartConsultationAction;
use App\Actions\Tenant\SubmitFormAction;
use App\Enums\Tenant\FormQuestionType;
use App\Enums\Tenant\FormType;
use App\Models\Tenant\Doctor;
use App\Models\Tenant\FormQuestion;
use App\Models\Tenant\FormQuestionOption;
use App\Models\Tenant\FormSection;
use App\Models\Tenant\MedicalForm;
use App\Models\Tenant\Patient;
use App\Models\Tenant\User;

require_once __DIR__.'/../TenancyTestSetup.php';

const SNAP_PREFIX = 'pesttestsnap';

beforeEach(fn () => tenantTestCleanup(SNAP_PREFIX));
afterEach(fn () => tenantTestCleanup(SNAP_PREFIX));

it('renders historical submissions with their original form structure even after edits', function () {
    $tenant = makeTestTenant(SNAP_PREFIX.'-a');

    $tenant->run(function () {
        $admin = User::factory()->create();
        $doctor = Doctor::factory()->create(['user_id' => $admin->id]);
        $patient = Patient::create([
            'first_name' => 'Snap', 'last_name' => 'Test',
            'phone' => '+970-59-4', 'preferred_language' => 'ar',
        ]);

        // Build v1 form: one section, one question.
        $form = MedicalForm::create([
            'doctor_id' => $doctor->id,
            'title' => 'Intake',
            'type' => FormType::Intake,
            'is_active' => true,
        ]);
        $section = FormSection::create([
            'medical_form_id' => $form->id,
            'title' => 'History',
            'order' => 1,
        ]);
        $smokes = FormQuestion::create([
            'form_section_id' => $section->id,
            'key' => 'smokes',
            'label' => 'Do you smoke?',
            'type' => FormQuestionType::Radio,
            'is_required' => true,
            'order' => 1,
        ]);
        FormQuestionOption::create([
            'form_question_id' => $smokes->id,
            'value' => 'yes', 'label' => 'Yes', 'order' => 1,
        ]);
        FormQuestionOption::create([
            'form_question_id' => $smokes->id,
            'value' => 'no', 'label' => 'No', 'order' => 2,
        ]);

        // First consultation, submit v1.
        $c1 = app(StartConsultationAction::class)->execute($patient, $doctor, null, $admin);
        $sub1 = app(SubmitFormAction::class)->execute(
            $c1,
            $form->fresh(['sections.questions.options']),
            ['smokes' => 'yes'],
            $admin,
        );

        // Edit the form: change label, add a question.
        $smokes->label = 'Tobacco use?';
        $smokes->save();
        FormQuestion::create([
            'form_section_id' => $section->id,
            'key' => 'allergies',
            'label' => 'Known allergies',
            'type' => FormQuestionType::Text,
            'order' => 2,
        ]);

        // Second consultation, submit v2.
        $c2 = app(StartConsultationAction::class)->execute($patient, $doctor, null, $admin);
        $sub2 = app(SubmitFormAction::class)->execute(
            $c2,
            $form->fresh(['sections.questions.options']),
            ['smokes' => 'no', 'allergies' => 'penicillin'],
            $admin,
        );

        // First snapshot: original label, only one question.
        $sub1Fresh = $sub1->fresh();
        expect($sub1Fresh->form_snapshot['sections'][0]['questions'])->toHaveCount(1);
        expect($sub1Fresh->form_snapshot['sections'][0]['questions'][0]['label'])
            ->toBe('Do you smoke?');
        expect($sub1Fresh->answers_snapshot)->toBe(['smokes' => 'yes']);

        // Second snapshot: new label, two questions.
        $sub2Fresh = $sub2->fresh();
        expect($sub2Fresh->form_snapshot['sections'][0]['questions'])->toHaveCount(2);
        expect($sub2Fresh->form_snapshot['sections'][0]['questions'][0]['label'])
            ->toBe('Tobacco use?');
        expect($sub2Fresh->answers_snapshot)
            ->toBe(['smokes' => 'no', 'allergies' => 'penicillin']);
    });
});
