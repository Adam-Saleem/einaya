<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant\Doctor;

use App\Enums\Tenant\AppointmentStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\Tenant\AppointmentResource;
use App\Models\Tenant\Appointment;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class QueueController extends Controller
{
    public function index(Request $request): Response
    {
        $appointments = Appointment::query()
            ->with(['patient:id,first_name,last_name,patient_code,phone,date_of_birth,gender', 'doctor.user:id,name'])
            ->whereDate('scheduled_for', Carbon::today())
            ->whereIn('status', [
                AppointmentStatus::Arrived->value,
                AppointmentStatus::InProgress->value,
            ])
            ->orderBy('queue_number')
            ->get();

        return Inertia::render('Tenant/Doctor/Queue', [
            'queue' => AppointmentResource::collection($appointments)->resolve($request),
        ]);
    }
}
