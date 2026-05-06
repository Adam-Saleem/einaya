<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\StoreFormRequest;
use App\Http\Requests\Tenant\UpdateFormRequest;
use App\Http\Resources\Tenant\MedicalFormResource;
use App\Models\Tenant\MedicalForm;
use App\Services\Tenant\AuditLogService;
use App\Services\Tenant\MedicalFormService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MedicalFormController extends Controller
{
    public function __construct(
        private AuditLogService $audit,
        private MedicalFormService $service,
    ) {
    }

    public function index(Request $request): Response
    {
        if (! $request->user()?->can('forms.view')) {
            abort(403);
        }

        $forms = MedicalForm::query()
            ->withCount(['sections', 'submissions'])
            ->orderByDesc('updated_at')
            ->paginate(20);

        return Inertia::render('Tenant/Forms/Index', [
            'forms' => MedicalFormResource::collection($forms),
        ]);
    }

    public function store(StoreFormRequest $request): RedirectResponse
    {
        $doctor = $request->user()?->doctor;

        $form = MedicalForm::create([
            'doctor_id' => $doctor?->id,
            'title' => $request->validated('title'),
            'description' => $request->validated('description'),
            'type' => $request->validated('type'),
            'is_active' => false,
        ]);

        $this->audit->log($request->user(), 'form.created', $form, [], $form->only(['title', 'type']));

        return redirect("/forms/{$form->id}/edit");
    }

    /**
     * JSON endpoint used by the consultation page (Phase 10) to load a
     * form's canonical snapshot before fill-in. Returning the raw
     * FormSnapshotService output keeps the FormRenderer fed by the same
     * shape it'll see when the submission comes back from history.
     */
    public function snapshot(MedicalForm $form): \Illuminate\Http\JsonResponse
    {
        if (! request()->user()?->can('forms.submit')) {
            abort(403);
        }

        $form->load(['sections.questions.options']);

        return response()->json(
            app(\App\Services\Tenant\FormSnapshotService::class)->snapshot($form),
        );
    }

    public function edit(MedicalForm $form): Response
    {
        if (! request()->user()?->can('forms.manage')) {
            abort(403);
        }

        $form->load(['sections.questions.options']);

        return Inertia::render('Tenant/Forms/Builder', [
            'form' => (new MedicalFormResource($form))->toArray(request()),
        ]);
    }

    public function update(UpdateFormRequest $request, MedicalForm $form): RedirectResponse
    {
        $original = $form->only(['title', 'description', 'type', 'is_active']);
        $form->fill($request->validated())->save();

        $this->audit->log(
            $request->user(),
            'form.updated',
            $form,
            $original,
            $form->only(['title', 'description', 'type', 'is_active']),
        );

        return back()->with('success', 'Form saved.');
    }

    public function destroy(Request $request, MedicalForm $form): RedirectResponse
    {
        if ($form->submissions()->exists()) {
            return back()->with(
                'error',
                'Cannot delete a form that has submissions. Deactivate it instead.',
            );
        }

        $form->delete();
        $this->audit->log($request->user(), 'form.deleted', $form);

        return redirect('/forms')->with('success', 'Form archived.');
    }

    public function duplicate(Request $request, MedicalForm $form): RedirectResponse
    {
        $copy = $this->service->duplicate($form);
        $this->audit->log($request->user(), 'form.duplicated', $copy, [], ['source_id' => $form->id]);

        return redirect("/forms/{$copy->id}/edit");
    }
}
