<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\StoreBreakRequest;
use App\Http\Requests\Tenant\StoreTimeOffRequest;
use App\Http\Requests\Tenant\UpdateWorkingHoursRequest;
use App\Models\Tenant\Doctor;
use App\Models\Tenant\DoctorBreak;
use App\Models\Tenant\DoctorTimeOff;
use App\Models\Tenant\DoctorWorkingHour;
use App\Services\Tenant\AuditLogService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WorkingHoursController extends Controller
{
    public function __construct(private AuditLogService $audit)
    {
    }

    public function show(Request $request): Response
    {
        if (! $request->user()?->can('doctor.manage_hours')) {
            abort(403);
        }

        $doctor = $this->doctorOrFail($request);
        $doctor->loadMissing(['workingHours', 'breaks', 'timeOff']);

        $byDay = collect(range(0, 6))->mapWithKeys(function (int $day) use ($doctor) {
            $row = $doctor->workingHours->firstWhere('day_of_week', $day);
            return [$day => [
                'day_of_week' => $day,
                'is_active' => (bool) ($row?->is_active ?? false),
                'start_time' => $row?->start_time ? substr((string) $row->start_time, 0, 5) : null,
                'end_time' => $row?->end_time ? substr((string) $row->end_time, 0, 5) : null,
            ]];
        });

        return Inertia::render('Tenant/Doctor/WorkingHours', [
            'hours' => $byDay->values(),
            'breaks' => $doctor->breaks->map(fn (DoctorBreak $b) => [
                'id' => $b->id,
                'day_of_week' => (int) $b->day_of_week,
                'start_time' => substr((string) $b->start_time, 0, 5),
                'end_time' => substr((string) $b->end_time, 0, 5),
                'label' => $b->label,
            ])->values(),
            'timeOff' => $doctor->timeOff
                ->where('ends_at', '>=', now()->subDays(30))
                ->sortBy('starts_at')
                ->map(fn (DoctorTimeOff $t) => [
                    'id' => $t->id,
                    'starts_at' => $t->starts_at?->toIso8601String(),
                    'ends_at' => $t->ends_at?->toIso8601String(),
                    'reason' => $t->reason,
                ])->values(),
        ]);
    }

    public function update(UpdateWorkingHoursRequest $request): RedirectResponse
    {
        $doctor = $this->doctorOrFail($request);

        foreach ($request->validated('hours') as $entry) {
            $isActive = (bool) ($entry['is_active'] ?? false);

            if (! $isActive) {
                // Schema requires start_time / end_time NOT NULL, so we delete
                // the row entirely on inactive days rather than carrying
                // dummy values.
                DoctorWorkingHour::where('doctor_id', $doctor->id)
                    ->where('day_of_week', $entry['day_of_week'])
                    ->delete();
                continue;
            }

            DoctorWorkingHour::updateOrCreate(
                ['doctor_id' => $doctor->id, 'day_of_week' => $entry['day_of_week']],
                [
                    'is_active' => true,
                    'start_time' => $entry['start_time'],
                    'end_time' => $entry['end_time'],
                ],
            );
        }

        $this->audit->log($request->user(), 'doctor.hours_updated', $doctor, [], $request->validated());

        return back()->with('success', 'Working hours saved.');
    }

    public function storeBreak(StoreBreakRequest $request): RedirectResponse
    {
        $doctor = $this->doctorOrFail($request);

        $break = DoctorBreak::create([
            'doctor_id' => $doctor->id,
            'day_of_week' => $request->integer('day_of_week'),
            'start_time' => $request->string('start_time')->toString(),
            'end_time' => $request->string('end_time')->toString(),
            'label' => $request->string('label')->toString() ?: null,
        ]);

        $this->audit->log($request->user(), 'doctor.break_added', $break, [], $break->only([
            'day_of_week', 'start_time', 'end_time', 'label',
        ]));

        return back()->with('success', 'Break added.');
    }

    public function destroyBreak(Request $request, DoctorBreak $break): RedirectResponse
    {
        $doctor = $this->doctorOrFail($request);
        if ($break->doctor_id !== $doctor->id) abort(404);

        $break->delete();
        $this->audit->log($request->user(), 'doctor.break_removed', $break);

        return back()->with('success', 'Break removed.');
    }

    public function storeTimeOff(StoreTimeOffRequest $request): RedirectResponse
    {
        $doctor = $this->doctorOrFail($request);

        $entry = DoctorTimeOff::create([
            'doctor_id' => $doctor->id,
            'starts_at' => $request->date('starts_at'),
            'ends_at' => $request->date('ends_at'),
            'reason' => $request->string('reason')->toString() ?: null,
        ]);

        $this->audit->log($request->user(), 'doctor.timeoff_added', $entry, [], $entry->only([
            'starts_at', 'ends_at', 'reason',
        ]));

        return back()->with('success', 'Time off added.');
    }

    public function destroyTimeOff(Request $request, DoctorTimeOff $time_off): RedirectResponse
    {
        $doctor = $this->doctorOrFail($request);
        if ($time_off->doctor_id !== $doctor->id) abort(404);

        $time_off->delete();
        $this->audit->log($request->user(), 'doctor.timeoff_removed', $time_off);

        return back()->with('success', 'Time off removed.');
    }

    private function doctorOrFail(Request $request): Doctor
    {
        $doctor = $request->user()?->doctor;

        if ($doctor === null) {
            throw new AuthorizationException('No doctor profile attached.');
        }

        return $doctor;
    }
}
