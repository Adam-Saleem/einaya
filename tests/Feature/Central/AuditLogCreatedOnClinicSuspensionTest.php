<?php

declare(strict_types=1);

use App\Actions\Central\SuspendClinicAction;
use App\Enums\Central\ClinicStatus;
use App\Models\Central\CentralAuditLog;
use App\Models\Central\Clinic;
use App\Models\Central\User;

it('records old/new status in the central audit log when a clinic is suspended', function () {
    /** @var User $actor */
    $actor = User::factory()->create(['is_super_admin' => true]);

    // withoutEvents skips the TenantCreated pipeline so the test isn't on
    // the hook for cleaning up a real tenant DB.
    $clinic = Clinic::withoutEvents(fn () => Clinic::create([
        'id' => 'audit-clinic',
        'name' => 'Audit Clinic',
        'slug' => 'audit-clinic',
        'owner_name' => 'Owner',
        'owner_email' => 'owner@audit.test',
        'status' => ClinicStatus::Active,
    ]));

    app(SuspendClinicAction::class)->suspend($clinic, $actor, 'misuse');

    $log = CentralAuditLog::where('action', 'clinic.suspended')
        ->where('auditable_id', $clinic->id)
        ->latest('created_at')
        ->first();

    expect($log)->not->toBeNull()
        ->and($log->user_id)->toBe($actor->id)
        ->and($log->old_values)->toBe(['status' => 'active'])
        ->and($log->new_values)->toMatchArray(['status' => 'suspended', 'reason' => 'misuse']);
});
