<?php

declare(strict_types=1);

namespace App\Policies\Tenant;

use App\Enums\Tenant\Permission;
use App\Models\Tenant\FormSubmission;
use App\Models\Tenant\User;

class FormSubmissionPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can(Permission::FormsView->value);
    }

    public function view(User $user, FormSubmission $submission): bool
    {
        return $user->can(Permission::FormsView->value);
    }

    public function create(User $user): bool
    {
        return $user->can(Permission::FormsSubmit->value);
    }

    public function update(User $user, FormSubmission $submission): bool
    {
        // Submissions are immutable by design (ADR-002) — even doctors can't edit.
        return false;
    }

    public function delete(User $user, FormSubmission $submission): bool
    {
        return $user->can(Permission::FormsManage->value);
    }
}
