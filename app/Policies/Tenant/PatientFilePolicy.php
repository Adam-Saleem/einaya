<?php

declare(strict_types=1);

namespace App\Policies\Tenant;

use App\Enums\Tenant\Permission;
use App\Enums\Tenant\PatientFileCategory;
use App\Models\Tenant\PatientFile;
use App\Models\Tenant\User;

class PatientFilePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can(Permission::FilesView->value);
    }

    public function view(User $user, PatientFile $file): bool
    {
        if (! $user->can(Permission::FilesView->value)) {
            return false;
        }

        // Secretaries can VIEW administrative file categories regardless of
        // medical access; they can VIEW external_report / prescription_scan
        // only if they happen to have view_medical (they don't in v1, but
        // the rule keeps the policy honest).
        if (in_array(
            $file->category,
            [PatientFileCategory::ExternalReport, PatientFileCategory::PrescriptionScan],
            true,
        )) {
            return $user->can(Permission::PatientsViewMedical->value);
        }

        return true;
    }

    public function upload(User $user, PatientFile $fileOrCategory = null): bool
    {
        // Re-used for the resource-style `create` ability (no model yet).
        return $user->can(Permission::FilesUpload->value);
    }

    public function create(User $user): bool
    {
        return $user->can(Permission::FilesUpload->value);
    }

    public function delete(User $user, PatientFile $file): bool
    {
        return $user->can(Permission::FilesDelete->value);
    }
}
