<?php

declare(strict_types=1);

use App\Enums\Central\ClinicStatus;
use App\Enums\Central\SubscriptionStatus;
use App\Models\Central\Clinic;
use App\Models\Central\Subscription;
use App\Models\Central\SubscriptionPlan;
use App\Models\Central\User;

it('refuses to delete a plan that has active subscriptions', function () {
    /** @var User $actor */
    $actor = User::factory()->create(['is_super_admin' => true]);
    $plan = SubscriptionPlan::factory()->create(['slug' => 'guardplan']);
    // withoutEvents skips the TenantCreated pipeline so this test stays
    // RefreshDatabase-friendly (no tenant DB created).
    $clinic = Clinic::withoutEvents(fn () => Clinic::create([
        'id' => 'guard-clinic',
        'name' => 'Guard Clinic',
        'slug' => 'guard-clinic',
        'owner_name' => 'Owner',
        'owner_email' => 'owner@guard.test',
        'status' => ClinicStatus::Active,
    ]));
    Subscription::create([
        'clinic_id' => $clinic->id,
        'plan_id' => $plan->id,
        'status' => SubscriptionStatus::Active,
        'starts_at' => now(),
        'ends_at' => now()->addYear(),
    ]);

    $response = $this->actingAs($actor, 'web_central')
        ->from('https://app.einaya.test/plans')
        ->delete('https://app.einaya.test/plans/'.$plan->id);

    $response->assertSessionHas('error');
    expect(SubscriptionPlan::find($plan->id))->not->toBeNull();
});

it('soft-deletes a plan with no active subscriptions', function () {
    /** @var User $actor */
    $actor = User::factory()->create(['is_super_admin' => true]);
    $plan = SubscriptionPlan::factory()->create(['slug' => 'orphanplan']);

    $this->actingAs($actor, 'web_central')
        ->from('https://app.einaya.test/plans')
        ->delete('https://app.einaya.test/plans/'.$plan->id)
        ->assertSessionHas('success');

    expect(SubscriptionPlan::find($plan->id))->toBeNull()
        ->and(SubscriptionPlan::withTrashed()->find($plan->id))->not->toBeNull();
});
