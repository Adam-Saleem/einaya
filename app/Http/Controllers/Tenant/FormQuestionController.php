<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant;

use App\Enums\Tenant\FormQuestionType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\ReorderRequest;
use App\Http\Requests\Tenant\StoreQuestionRequest;
use App\Http\Requests\Tenant\UpdateQuestionRequest;
use App\Models\Tenant\FormQuestion;
use App\Models\Tenant\FormQuestionOption;
use App\Models\Tenant\FormSection;
use App\Services\Tenant\AuditLogService;
use App\Services\Tenant\MedicalFormService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class FormQuestionController extends Controller
{
    public function __construct(
        private AuditLogService $audit,
        private MedicalFormService $service,
    ) {
    }

    public function store(StoreQuestionRequest $request, FormSection $section): RedirectResponse
    {
        $form = $section->medicalForm;
        $type = FormQuestionType::from($request->validated('type'));

        $rawKey = $request->string('key')->toString() ?: $request->validated('label');
        $key = $this->service->uniqueKey($form, $rawKey);

        $nextOrder = (int) $section->questions()->max('order') + 1;

        $question = FormQuestion::create([
            'form_section_id' => $section->id,
            'key' => $key,
            'label' => $request->validated('label'),
            'help_text' => $request->validated('help_text'),
            'type' => $type,
            'is_required' => $request->boolean('is_required'),
            'validation_rules' => $request->validated('validation_rules'),
            'order' => $nextOrder,
        ]);

        $this->syncOptions($question, $request->validated('options') ?? []);

        $this->audit->log($request->user(), 'form.question_added', $question, [], $question->only(['key', 'label', 'type']));

        return back();
    }

    public function update(UpdateQuestionRequest $request, FormSection $section, FormQuestion $question): RedirectResponse
    {
        if ($question->form_section_id !== $section->id) abort(404);

        $form = $section->medicalForm;
        $type = FormQuestionType::from($request->validated('type'));

        $rawKey = $request->string('key')->toString() ?: $request->validated('label');
        $key = $this->service->uniqueKey($form, $rawKey, $question->id);

        $original = $question->only(['key', 'label', 'help_text', 'type', 'is_required', 'validation_rules']);

        $question->fill([
            'key' => $key,
            'label' => $request->validated('label'),
            'help_text' => $request->validated('help_text'),
            'type' => $type,
            'is_required' => $request->boolean('is_required'),
            'validation_rules' => $request->validated('validation_rules'),
        ])->save();

        $this->syncOptions($question, $request->validated('options') ?? []);

        $this->audit->log($request->user(), 'form.question_updated', $question, $original, $question->only([
            'key', 'label', 'help_text', 'type', 'is_required', 'validation_rules',
        ]));

        return back();
    }

    public function destroy(Request $request, FormSection $section, FormQuestion $question): RedirectResponse
    {
        if ($question->form_section_id !== $section->id) abort(404);

        // Phase 8 spec: don't hard-delete questions referenced by historical
        // submissions — soft-delete only. Submissions store the form_snapshot
        // separately, so soft-deleting here is enough for ADR-002 compliance.
        $question->delete();
        $this->audit->log($request->user(), 'form.question_deleted', $question);

        return back()->with('success', 'Question removed.');
    }

    public function reorder(ReorderRequest $request, FormSection $section): RedirectResponse
    {
        $ids = $request->validated('ids');
        foreach ($ids as $index => $id) {
            FormQuestion::where('form_section_id', $section->id)
                ->where('id', $id)
                ->update(['order' => $index + 1]);
        }

        $this->audit->log($request->user(), 'form.questions_reordered', $section, [], ['ids' => $ids]);

        return back();
    }

    /**
     * @param  array<int, array{value: string, label: string}>  $options
     */
    private function syncOptions(FormQuestion $question, array $options): void
    {
        if (! $question->type->hasOptions()) {
            $question->options()->delete();
            return;
        }

        $existing = $question->options()->pluck('id', 'value')->toArray();
        $seen = [];

        foreach ($options as $index => $option) {
            $value = $option['value'];
            $seen[] = $value;

            if (isset($existing[$value])) {
                FormQuestionOption::where('id', $existing[$value])->update([
                    'label' => $option['label'],
                    'order' => $index + 1,
                ]);
            } else {
                FormQuestionOption::create([
                    'form_question_id' => $question->id,
                    'value' => $value,
                    'label' => $option['label'],
                    'order' => $index + 1,
                ]);
            }
        }

        // Soft-delete options that were dropped from the dialog.
        $question->options()
            ->whereNotIn('value', $seen)
            ->delete();
    }
}
