<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant\Doctor;

use App\Actions\Tenant\SubmitFormAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\Doctor\SubmitFormRequest;
use App\Models\Tenant\Consultation;
use App\Models\Tenant\MedicalForm;
use Illuminate\Http\RedirectResponse;

class FormSubmissionController extends Controller
{
    public function store(
        SubmitFormRequest $request,
        Consultation $consultation,
        SubmitFormAction $action,
    ): RedirectResponse {
        /** @var MedicalForm $form */
        $form = MedicalForm::findOrFail($request->validated('medical_form_id'));

        $action->execute($consultation, $form, $request->validated('answers'), $request->user());

        return back()->with('success', 'Form submitted.');
    }
}
