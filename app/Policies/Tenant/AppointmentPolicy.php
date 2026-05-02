<?php

declare(strict_types=1);

namespace App\Policies\Tenant;

use App\Enums\Tenant\Permission;
use App\Models\Tenant\Appointment;
use App\Models\Tenant\User;

class AppointmentPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can(Permission::AppointmentsView->value);
    }

    public function view(User $user, Appointment $appointment): bool
    {
        return $user->can(Permission::AppointmentsView->value);
    }

    public function create(User $user): bool
    {
        return $user->can(Permission::AppointmentsCreate->value);
    }

    public function update(User $user, Appointment $appointment): bool
    {
        return $user->can(Permission::AppointmentsUpdate->value);
    }

    public function cancel(User $user, Appointment $appointment): bool
    {
        return $user->can(Permission::AppointmentsCancel->value);
    }

    public function delete(User $user, Appointment $appointment): bool
    {
        return $user->can(Permission::AppointmentsDelete->value);
    }
}
