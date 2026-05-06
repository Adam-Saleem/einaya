<?php

declare(strict_types=1);

namespace App\Services\Tenant;

use App\Models\Tenant\MedicalForm;

/**
 * Produces the canonical JSON shape that gets frozen onto a FormSubmission
 * row at submit time (see ADR-002). The same shape is also used by the
 * front-end <FormRenderer /> for the live preview, so the on-screen
 * builder preview is byte-identical to what a future doctor will see when
 * reviewing the historical submission.
 *
 * Shape is intentionally flat / dumb — no Eloquent leakage, no dates, no
 * tenant context. Anything that lands in this snapshot is a permanent
 * historical record.
 */
class FormSnapshotService
{
    /**
     * @return array{
     *     form_id: int,
     *     title: string,
     *     description: string|null,
     *     type: string,
     *     version_at: string,
     *     sections: array<int, array{
     *         id: int,
     *         title: string,
     *         description: string|null,
     *         order: int,
     *         questions: array<int, array{
     *             id: int,
     *             key: string,
     *             label: string,
     *             help_text: string|null,
     *             type: string,
     *             required: bool,
     *             order: int,
     *             validation_rules: array<string, mixed>|null,
     *             options: array<int, array{value: string, label: string}>,
     *         }>,
     *     }>,
     * }
     */
    public function snapshot(MedicalForm $form): array
    {
        $form->loadMissing(['sections.questions.options']);

        return [
            'form_id' => $form->id,
            'title' => $form->title,
            'description' => $form->description,
            'type' => $form->type->value,
            'version_at' => now()->toIso8601String(),
            'sections' => $form->sections
                ->sortBy('order')
                ->values()
                ->map(fn ($section) => [
                    'id' => $section->id,
                    'title' => $section->title,
                    'description' => $section->description,
                    'order' => (int) $section->order,
                    'questions' => $section->questions
                        ->sortBy('order')
                        ->values()
                        ->map(fn ($question) => [
                            'id' => $question->id,
                            'key' => $question->key,
                            'label' => $question->label,
                            'help_text' => $question->help_text,
                            'type' => $question->type->value,
                            'required' => (bool) $question->is_required,
                            'order' => (int) $question->order,
                            'validation_rules' => $question->validation_rules,
                            'options' => $question->type->hasOptions()
                                ? $question->options
                                    ->sortBy('order')
                                    ->values()
                                    ->map(fn ($option) => [
                                        'value' => $option->value,
                                        'label' => $option->label,
                                    ])
                                    ->all()
                                : [],
                        ])
                        ->all(),
                ])
                ->all(),
        ];
    }
}
