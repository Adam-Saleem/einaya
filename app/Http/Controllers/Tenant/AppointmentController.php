<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant;

use App\Actions\Tenant\BookAppointmentAction;
use App\Enums\Tenant\AppointmentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\StoreAppointmentRequest;
use App\Http\Requests\Tenant\UpdateAppointmentRequest;
use App\Http\Resources\Tenant\AppointmentResource;
use App\Models\Tenant\Appointment;
use App\Models\Tenant\Doctor;
use App\Models\Tenant\User;
use App\Services\Tenant\AppointmentConflictService;
use App\Services\Tenant\AuditLogService;
use App\Services\Tenant\QueueService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class AppointmentController extends Controller
{
    public function __construct(
        private AuditLogService $audit,
        private AppointmentConflictService $conflicts,
        private QueueService $queue,
    ) {
    }

    public function index(Request $request): Response
    {
        $this->ensureCan($request->user(), 'appointments.view');

        return Inertia::render('Tenant/Appointments/Calendar', [
            'doctors' => Doctor::with('user:id,name')
                ->where('is_active', true)
                ->get()
                ->map(fn (Doctor $d) => [
                    'id' => $d->id,
                    'name' => $d->user?->name,
                    'consultation_duration_minutes' => $d->consultation_duration_minutes,
                ]),
        ]);
    }

    public function today(Request $request): Response
    {
        $this->ensureCan($request->user(), 'appointments.view');

        $today = Carbon::today();
        $appointments = Appointment::query()
            ->with(['patient:id,first_name,last_name,patient_code,phone', 'doctor.user:id,name'])
            ->whereBetween('scheduled_for', [$today->copy()->startOfDay(), $today->copy()->endOfDay()])
            ->orderBy('scheduled_for')
            ->get();

        return Inertia::render('Tenant/Appointments/Today', [
            'appointments' => AppointmentResource::collection($appointments)->resolve($request),
        ]);
    }

    public function data(Request $request): JsonResponse
    {
        $this->ensureCan($request->user(), 'appointments.view');

        $start = $request->date('start') ?? Carbon::now()->startOfWeek();
        $end = $request->date('end') ?? Carbon::now()->endOfWeek();

        $appointments = Appointment::query()
            ->with(['patient:id,first_name,last_name,patient_code', 'doctor.user:id,name'])
            ->whereBetween('scheduled_for', [$start, $end])
            ->get();

        return response()->json([
            'events' => $appointments->map(fn (Appointment $a) => [
                'id' => $a->id,
                'title' => trim(($a->patient->first_name ?? '').' '.($a->patient->last_name ?? '')),
                'start' => $a->scheduled_for?->toIso8601String(),
                'end' => $a->scheduled_for?->copy()->addMinutes((int) $a->duration_minutes)->toIso8601String(),
                'status' => is_object($a->status) ? $a->status->value : (string) $a->status,
                'extendedProps' => [
                    'patient_id' => $a->patient_id,
                    'patient_code' => $a->patient->patient_code ?? null,
                    'doctor_id' => $a->doctor_id,
                    'reason' => $a->reason,
                    'queue_number' => $a->queue_number,
                ],
            ])->values(),
        ]);
    }

    public function store(StoreAppointmentRequest $request, BookAppointmentAction $action): RedirectResponse
    {
        $appointment = $action->execute($request->validated(), $request->user());

        return back()->with('success', "Appointment booked.");
    }

    public function update(
        UpdateAppointmentRequest $request,
        Appointment $appointment,
    ): RedirectResponse {
        $original = $appointment->only(['scheduled_for', 'duration_minutes', 'status']);
        $data = $request->validated();

        if (isset($data['scheduled_for']) || isset($data['duration_minutes'])) {
            $startsAt = Carbon::parse($data['scheduled_for'] ?? $appointment->scheduled_for);
            $duration = (int) ($data['duration_minutes'] ?? $appointment->duration_minutes);
            $check = $this->conflicts->check(
                $appointment->doctor,
                $startsAt,
                $duration,
                $appointment->id,
            );
            if (! empty($check['errors'])) {
                return back()->withErrors([
                    'scheduled_for' => 'This slot overlaps another appointment.',
                ]);
            }
            if (! empty($check['warnings']) && empty($data['force'])) {
                return back()->withErrors([
                    'scheduled_for' => 'warnings:'.implode('|', $check['warnings']),
                ]);
            }
        }

        unset($data['force']);
        $appointment->fill($data)->save();

        $this->audit->log($request->user(), 'appointment.updated', $appointment, $original, $appointment->only([
            'scheduled_for', 'duration_minutes', 'status',
        ]));

        return back()->with('success', 'Appointment updated.');
    }

    public function arrive(Request $request, Appointment $appointment): RedirectResponse
    {
        $this->ensureCan($request->user(), 'appointments.update');

        $this->queue->markArrived($appointment);
        $this->audit->log($request->user(), 'appointment.arrived', $appointment, [], [
            'queue_number' => $appointment->queue_number,
        ]);

        return back()->with('success', 'Marked arrived.');
    }

    public function cancel(Request $request, Appointment $appointment): RedirectResponse
    {
        $this->ensureCan($request->user(), 'appointments.cancel');

        $reason = $request->string('reason')->toString();
        $appointment->status = AppointmentStatus::Cancelled;
        $appointment->cancelled_at = Carbon::now();
        $appointment->cancellation_reason = $reason !== '' ? $reason : null;
        $appointment->save();

        $this->audit->log($request->user(), 'appointment.cancelled', $appointment, [], [
            'reason' => $reason,
        ]);

        return back()->with('success', 'Appointment cancelled.');
    }

    public function noShow(Request $request, Appointment $appointment): RedirectResponse
    {
        $this->ensureCan($request->user(), 'appointments.update');

        $appointment->status = AppointmentStatus::NoShow;
        $appointment->save();
        $this->audit->log($request->user(), 'appointment.no_show', $appointment);

        return back()->with('success', 'Marked no-show.');
    }

    private function ensureCan(?User $user, string $permission): void
    {
        if ($user === null || ! $user->can($permission)) {
            throw new AuthorizationException();
        }
    }
}
