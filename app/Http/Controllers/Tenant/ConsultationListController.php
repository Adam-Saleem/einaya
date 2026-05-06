<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant;

use App\Enums\Tenant\AppointmentStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\Tenant\ConsultationResource;
use App\Models\Tenant\Consultation;
use App\Models\Tenant\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ConsultationListController extends Controller
{
    /**
     * Read-only list of consultations. Doctor sees their own; clinic_admin
     * sees all. Secretary already has `consultations.view` (limited to
     * appointment-status visibility per Phase 5) so they pass through too,
     * but the doctor's own filter is applied for non-admins to keep the
     * list scoped.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        if ($user === null || ! $user->can('consultations.view')) {
            throw new AuthorizationException();
        }

        $query = Consultation::query()
            ->with(['patient:id,first_name,last_name,patient_code,phone', 'doctor.user:id,name']);

        // Scope to own doctor when caller has a doctor profile and is NOT
        // clinic_admin (admins get the firehose).
        $myDoctor = $user->doctor;
        if ($myDoctor && ! $user->hasRole('clinic_admin')) {
            $query->where('doctor_id', $myDoctor->id);
        }

        if ($status = $request->string('status')->toString()) {
            // "open" / "completed" — derived from ended_at.
            if ($status === 'open') $query->whereNull('ended_at');
            if ($status === 'completed') $query->whereNotNull('ended_at');
        }

        if ($from = $request->date('from')) {
            $query->where('started_at', '>=', $from);
        }
        if ($to = $request->date('to')) {
            $query->where('started_at', '<=', $to);
        }

        if ($search = $request->string('search')->toString()) {
            $like = '%'.$search.'%';
            $query->whereHas('patient', function ($q) use ($like) {
                $q->where('first_name', 'like', $like)
                    ->orWhere('last_name', 'like', $like)
                    ->orWhere('patient_code', 'like', $like)
                    ->orWhere('phone', 'like', $like);
            });
        }

        $consultations = $query->latest('started_at')->paginate(25)->withQueryString();

        return Inertia::render('Tenant/Consultations/Index', [
            'consultations' => ConsultationResource::collection($consultations),
            'filters' => [
                'status' => $request->string('status')->toString(),
                'from' => $request->string('from')->toString(),
                'to' => $request->string('to')->toString(),
                'search' => $request->string('search')->toString(),
            ],
        ]);
    }
}
