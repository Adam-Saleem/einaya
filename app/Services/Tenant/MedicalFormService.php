<?php

declare(strict_types=1);

namespace App\Services\Tenant;

use App\Models\Tenant\MedicalForm;
use App\Models\Tenant\FormQuestion;
use App\Models\Tenant\FormQuestionOption;
use App\Models\Tenant\FormSection;
use Illuminate\Support\Str;

class MedicalFormService
{
    /**
     * Slugify a label into a stable_key. Returns lowercase ASCII with
     * non-alphanumerics collapsed to underscores. Caller is responsible for
     * uniqueness within the form.
     *
     *   "Do you smoke?" → "do_you_smoke"
     *   "Past surgeries (if any)" → "past_surgeries_if_any"
     */
    public function generateKey(string $label): string
    {
        $slug = Str::of($label)->ascii()->lower()->replaceMatches('/[^a-z0-9]+/', '_')->trim('_')->toString();

        return $slug !== '' ? $slug : 'question';
    }

    /**
     * Pick a unique stable_key within a single form. Appends a numeric
     * suffix if needed.
     */
    public function uniqueKey(MedicalForm $form, string $candidate, ?int $ignoreQuestionId = null): string
    {
        $base = $this->generateKey($candidate);
        $key = $base;
        $suffix = 1;

        while ($this->keyExistsInForm($form, $key, $ignoreQuestionId)) {
            $suffix++;
            $key = $base.'_'.$suffix;
        }

        return $key;
    }

    private function keyExistsInForm(MedicalForm $form, string $key, ?int $ignoreQuestionId): bool
    {
        return FormQuestion::query()
            ->whereHas('section', fn ($q) => $q->where('medical_form_id', $form->id))
            ->where('key', $key)
            ->when($ignoreQuestionId, fn ($q) => $q->where('id', '!=', $ignoreQuestionId))
            ->exists();
    }

    /**
     * Deep-clone a form including sections, questions, options. Used for
     * the "Duplicate" action on the forms list. The new form is marked
     * inactive so the doctor can adjust it before publishing.
     */
    public function duplicate(MedicalForm $form): MedicalForm
    {
        $form->loadMissing(['sections.questions.options']);

        /** @var MedicalForm $copy */
        $copy = MedicalForm::create([
            'doctor_id' => $form->doctor_id,
            'title' => $form->title.' (copy)',
            'description' => $form->description,
            'type' => $form->type,
            'is_active' => false,
        ]);

        foreach ($form->sections as $section) {
            /** @var FormSection $copiedSection */
            $copiedSection = FormSection::create([
                'medical_form_id' => $copy->id,
                'title' => $section->title,
                'description' => $section->description,
                'order' => $section->order,
            ]);

            foreach ($section->questions as $question) {
                /** @var FormQuestion $copiedQuestion */
                $copiedQuestion = FormQuestion::create([
                    'form_section_id' => $copiedSection->id,
                    'key' => $question->key,
                    'label' => $question->label,
                    'help_text' => $question->help_text,
                    'type' => $question->type,
                    'is_required' => $question->is_required,
                    'validation_rules' => $question->validation_rules,
                    'conditions' => $question->conditions,
                    'order' => $question->order,
                ]);

                foreach ($question->options as $option) {
                    FormQuestionOption::create([
                        'form_question_id' => $copiedQuestion->id,
                        'value' => $option->value,
                        'label' => $option->label,
                        'order' => $option->order,
                    ]);
                }
            }
        }

        return $copy->fresh(['sections.questions.options']);
    }
}
