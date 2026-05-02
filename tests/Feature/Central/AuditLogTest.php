<?php

declare(strict_types=1);

use App\Models\Central\CentralAuditLog;
use App\Models\Central\SubscriptionPlan;
use App\Models\Central\User;
use App\Services\Central\AuditLogService;
use Illuminate\Http\Request;

it('logs an action with all expected fields', function () {
    $user = User::factory()->create();
    $auditable = SubscriptionPlan::factory()->create();

    $request = Request::create('/test', 'POST', server: [
        'REMOTE_ADDR' => '203.0.113.42',
        'HTTP_USER_AGENT' => 'PestTest/1.0',
    ]);

    $service = new AuditLogService($request);

    $log = $service->log(
        user: $user,
        action: 'plan.created',
        auditable: $auditable,
        oldValues: [],
        newValues: ['name' => $auditable->name, 'slug' => $auditable->slug],
    );

    expect($log)->toBeInstanceOf(CentralAuditLog::class)
        ->and($log->user_id)->toBe($user->id)
        ->and($log->action)->toBe('plan.created')
        ->and($log->auditable_type)->toBe(SubscriptionPlan::class)
        ->and($log->auditable_id)->toBe($auditable->id)
        ->and($log->old_values)->toBeNull()
        ->and($log->new_values)->toBe(['name' => $auditable->name, 'slug' => $auditable->slug])
        ->and($log->ip_address)->toBe('203.0.113.42')
        ->and($log->user_agent)->toBe('PestTest/1.0')
        ->and($log->created_at)->not->toBeNull();
});

it('handles a null user and missing request gracefully', function () {
    $service = new AuditLogService(null);

    $log = $service->log(null, 'system.heartbeat');

    expect($log->user_id)->toBeNull()
        ->and($log->action)->toBe('system.heartbeat')
        ->and($log->auditable_type)->toBeNull()
        ->and($log->auditable_id)->toBeNull()
        ->and($log->ip_address)->toBeNull()
        ->and($log->user_agent)->toBeNull();
});

it('user relationship resolves', function () {
    $user = User::factory()->create();
    $service = new AuditLogService(null);

    $log = $service->log($user, 'user.test_event');

    expect($log->user)->not->toBeNull()
        ->and($log->user->id)->toBe($user->id);
});
