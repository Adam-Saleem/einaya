<?php

declare(strict_types=1);

namespace App\Policies\Tenant;

use App\Enums\Tenant\Permission;
use App\Models\Tenant\User;

/**
 * Authorizes staff-management actions (managing other tenant users).
 * Self-service profile edits go through ProfileController which uses
 * `current_password` instead of a policy check.
 */
class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can(Permission::StaffView->value);
    }

    public function view(User $user, User $target): bool
    {
        if ($user->getKey() === $target->getKey()) {
            return true;
        }

        return $user->can(Permission::StaffView->value);
    }

    public function create(User $user): bool
    {
        return $user->can(Permission::StaffCreate->value);
    }

    public function update(User $user, User $target): bool
    {
        return $user->can(Permission::StaffUpdate->value);
    }

    public function delete(User $user, User $target): bool
    {
        // Users cannot delete themselves through staff management.
        if ($user->getKey() === $target->getKey()) {
            return false;
        }

        return $user->can(Permission::StaffDelete->value);
    }
}
