<?php

declare(strict_types=1);

use App\Models\Central\Coupon;
use App\Models\Central\SubscriptionPlan;
use App\Models\Central\User;

function aPlan(): SubscriptionPlan
{
    return SubscriptionPlan::factory()->create(['slug' => 'starter-coupon-test']);
}

it('lets a super admin create a coupon and normalises the code', function () {
    $admin = User::factory()->create(['is_super_admin' => true]);
    $plan = aPlan();

    $this->actingAs($admin, 'web_central')
        ->post('https://app.einaya.test/coupons', [
            'code' => 'launch-2026',
            'plan_id' => $plan->id,
            'duration_days' => 30,
            'max_uses' => 5,
            'is_active' => true,
        ])
        ->assertRedirect();

    $coupon = Coupon::query()->first();
    expect($coupon)->not->toBeNull();
    expect($coupon->code)->toBe('LAUNCH-2026');
    expect($coupon->duration_days)->toBe(30);
});

it('rejects a duplicate code regardless of case', function () {
    $admin = User::factory()->create(['is_super_admin' => true]);
    $plan = aPlan();
    Coupon::create([
        'code' => 'PROMO',
        'plan_id' => $plan->id,
        'duration_days' => 30,
        'max_uses' => 1,
    ]);

    $this->actingAs($admin, 'web_central')
        ->post('https://app.einaya.test/coupons', [
            'code' => 'promo',
            'plan_id' => $plan->id,
            'duration_days' => 30,
            'max_uses' => 1,
        ])
        ->assertSessionHasErrors('code');
});

it('blocks non-super-admin from /coupons', function () {
    $regular = User::factory()->create(['is_super_admin' => false]);

    $this->actingAs($regular, 'web_central')
        ->get('https://app.einaya.test/coupons')
        ->assertStatus(403);
});

it('reports status active vs expired vs exhausted vs disabled', function () {
    $plan = aPlan();

    $active = Coupon::create([
        'code' => 'A1', 'plan_id' => $plan->id,
        'duration_days' => 30, 'max_uses' => 5, 'used_count' => 1,
        'is_active' => true,
    ]);
    $expired = Coupon::create([
        'code' => 'A2', 'plan_id' => $plan->id,
        'duration_days' => 30, 'max_uses' => 5,
        'expires_at' => now()->subDay(), 'is_active' => true,
    ]);
    $exhausted = Coupon::create([
        'code' => 'A3', 'plan_id' => $plan->id,
        'duration_days' => 30, 'max_uses' => 1, 'used_count' => 1,
        'is_active' => true,
    ]);
    $disabled = Coupon::create([
        'code' => 'A4', 'plan_id' => $plan->id,
        'duration_days' => 30, 'max_uses' => 5, 'is_active' => false,
    ]);

    expect($active->status())->toBe('active');
    expect($active->isRedeemable())->toBeTrue();

    expect($expired->status())->toBe('expired');
    expect($expired->isRedeemable())->toBeFalse();

    expect($exhausted->status())->toBe('exhausted');
    expect($exhausted->isRedeemable())->toBeFalse();

    expect($disabled->status())->toBe('disabled');
    expect($disabled->isRedeemable())->toBeFalse();

    expect(Coupon::active()->pluck('code')->all())->toBe(['A1']);
});

it('updates and soft-deletes a coupon', function () {
    $admin = User::factory()->create(['is_super_admin' => true]);
    $coupon = Coupon::create([
        'code' => 'EDIT', 'plan_id' => aPlan()->id,
        'duration_days' => 30, 'max_uses' => 1, 'is_active' => true,
    ]);

    $this->actingAs($admin, 'web_central')
        ->patch("https://app.einaya.test/coupons/{$coupon->id}", [
            'is_active' => false,
            'description' => 'Discontinued.',
        ])
        ->assertRedirect();

    expect($coupon->fresh()->is_active)->toBeFalse();
    expect($coupon->fresh()->description)->toBe('Discontinued.');

    $this->actingAs($admin, 'web_central')
        ->delete("https://app.einaya.test/coupons/{$coupon->id}")
        ->assertRedirect();

    expect(Coupon::query()->find($coupon->id))->toBeNull();
    expect(Coupon::withTrashed()->find($coupon->id))->not->toBeNull();
});
