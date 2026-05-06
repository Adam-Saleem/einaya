<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Resources\Tenant\FormSubmissionResource;
use App\Models\Tenant\FormSubmission;
use App\Models\Tenant\MedicalForm;
use Inertia\Inertia;
use Inertia\Response;

class FormSubmissionController extends Controller
{
    public function index(MedicalForm $form): Response
    {
        $submissions = FormSubmission::query()
            ->where('medical_form_id', $form->id)
            ->with(['patient:id,first_name,last_name,patient_code', 'doctor.user:id,name'])
            ->orderByDesc('submitted_at')
            ->paginate(25);

        return Inertia::render('Tenant/Forms/Submissions', [
            'form' => [
                'id' => $form->id,
                'title' => $form->title,
            ],
            'submissions' => FormSubmissionResource::collection($submissions),
        ]);
    }

    public function show(FormSubmission $submission): Response
    {
        $submission->load(['patient', 'doctor.user', 'medicalForm']);

        return Inertia::render('Tenant/Forms/Submission', [
            'submission' => (new FormSubmissionResource($submission))->toArray(request()),
        ]);
    }
}
