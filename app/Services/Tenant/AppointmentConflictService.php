<?php

declare(strict_types=1);

namespace App\Services\Tenant;

use App\Enums\Tenant\AppointmentStatus;
use App\Models\Tenant\Appointment;
use App\Models\Tenant\Doctor;
use App\Models\Tenant\DoctorBreak;
use App\Models\Tenant\DoctorTimeOff;
use App\Models\Tenant\DoctorWorkingHour;
use Illuminate\Support\Carbon;

class AppointmentConflictService
{
    /**
     * Returns a list of conflict reasons for a candidate slot. Empty list
     * means the slot is clean. Used by the booking dialog and the
     * drag-reschedule handler. Booking still proceeds if the only issues
     * are warnings (break / time-off override is allowed per spec) but
     * hard conflicts (overlapping appointment) abort the save.
     *
     * @return array{warnings: list<string>, errors: list<string>}
     */
    public function check(
        Doctor $doctor,
        Carbon $startsAt,
        int $durationMinutes,
        ?int $ignoreAppointmentId = null,
    ): array {
        $warnings = [];
        $errors = [];

        $endsAt = $startsAt->copy()->addMinutes($durationMinutes);

        // Hard conflict: another active appointment for this doctor that
        // overlaps. Cancelled / no-show appointments don't count.
        $overlapping = Appointment::query()
            ->where('doctor_id', $doctor->id)
            ->whereNotIn('status', [
                AppointmentStatus::Cancelled->value,
                AppointmentStatus::NoShow->value,
            ])
            ->when($ignoreAppointmentId, fn ($q) => $q->where('id', '!=', $ignoreAppointmentId))
            ->where(function ($q) use ($startsAt, $endsAt) {
                $q->where(function ($inner) use ($startsAt, $endsAt) {
                    $inner->where('scheduled_for', '<', $endsAt)
                        ->whereRaw('DATE_ADD(scheduled_for, INTERVAL duration_minutes MINUTE) > ?', [$startsAt]);
                });
            })
            ->exists();

        if ($overlapping) {
            $errors[] = 'overlap';
        }

        // Soft warning: outside this day's working hours.
        $dow = (int) $startsAt->dayOfWeek;
        $workingHours = DoctorWorkingHour::query()
            ->where('doctor_id', $doctor->id)
            ->where('day_of_week', $dow)
            ->where('is_active', true)
            ->first();

        if ($workingHours === null) {
            $warnings[] = 'outside_working_day';
        } else {
            $start = Carbon::parse($startsAt->toDateString().' '.$workingHours->start_time);
            $end = Carbon::parse($startsAt->toDateString().' '.$workingHours->end_time);
            if ($startsAt->lt($start) || $endsAt->gt($end)) {
                $warnings[] = 'outside_working_hours';
            }
        }

        // Soft warning: collides with a recurring break.
        $breaks = DoctorBreak::where('doctor_id', $doctor->id)
            ->where('day_of_week', $dow)
            ->get();
        foreach ($breaks as $break) {
            $bStart = Carbon::parse($startsAt->toDateString().' '.$break->start_time);
            $bEnd = Carbon::parse($startsAt->toDateString().' '.$break->end_time);
            if ($startsAt->lt($bEnd) && $endsAt->gt($bStart)) {
                $warnings[] = 'break:'.($break->label ?? '');
                break;
            }
        }

        // Soft warning: collides with a time-off block.
        $timeOff = DoctorTimeOff::where('doctor_id', $doctor->id)
            ->where('starts_at', '<=', $endsAt)
            ->where('ends_at', '>=', $startsAt)
            ->exists();
        if ($timeOff) {
            $warnings[] = 'time_off';
        }

        return ['warnings' => $warnings, 'errors' => $errors];
    }
}
