<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\ReorderRequest;
use App\Http\Requests\Tenant\StoreSectionRequest;
use App\Http\Requests\Tenant\UpdateSectionRequest;
use App\Models\Tenant\FormSection;
use App\Models\Tenant\MedicalForm;
use App\Services\Tenant\AuditLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class FormSectionController extends Controller
{
    public function __construct(private AuditLogService $audit)
    {
    }

    public function store(StoreSectionRequest $request, MedicalForm $form): RedirectResponse
    {
        $nextOrder = (int) $form->sections()->max('order') + 1;

        $section = FormSection::create([
            'medical_form_id' => $form->id,
            'title' => $request->validated('title'),
            'description' => $request->validated('description'),
            'order' => $nextOrder,
        ]);

        $this->audit->log($request->user(), 'form.section_added', $section, [], $section->only(['title', 'order']));

        return back()->with('success', 'Section added.');
    }

    public function update(UpdateSectionRequest $request, MedicalForm $form, FormSection $section): RedirectResponse
    {
        if ($section->medical_form_id !== $form->id) abort(404);

        $original = $section->only(['title', 'description']);
        $section->fill($request->validated())->save();

        $this->audit->log($request->user(), 'form.section_updated', $section, $original, $section->only(['title', 'description']));

        return back();
    }

    public function destroy(Request $request, MedicalForm $form, FormSection $section): RedirectResponse
    {
        if ($section->medical_form_id !== $form->id) abort(404);

        // Phase 8 spec: don't delete questions referenced by submissions.
        // Section delete cascades into questions in the migration, so guard
        // at this level instead — refuse if any question on this section
        // has been answered in any historical submission.
        $hasAnsweredQuestions = $section->questions()
            ->whereExists(function ($q) {
                $q->select(\DB::raw(1))
                    ->from('form_submissions')
                    ->whereRaw('JSON_CONTAINS_PATH(answers, "one", CONCAT("$.\"", form_questions.key, "\""))');
            })
            ->exists();

        if ($hasAnsweredQuestions) {
            return back()->with(
                'error',
                'This section has questions that appear in historical submissions. Remove individual questions or deactivate the form instead.',
            );
        }

        $section->delete();
        $this->audit->log($request->user(), 'form.section_deleted', $section);

        return back()->with('success', 'Section removed.');
    }

    public function reorder(ReorderRequest $request, MedicalForm $form): RedirectResponse
    {
        $ids = $request->validated('ids');
        foreach ($ids as $index => $id) {
            FormSection::where('medical_form_id', $form->id)
                ->where('id', $id)
                ->update(['order' => $index + 1]);
        }

        $this->audit->log($request->user(), 'form.sections_reordered', $form, [], ['ids' => $ids]);

        return back();
    }
}
