<?php

declare(strict_types=1);

use App\Actions\Tenant\RedeemCouponAction;
use App\Enums\Central\SubscriptionStatus;
use App\Models\Central\Coupon;
use App\Models\Central\CouponRedemption;
use App\Models\Central\Subscription;
use App\Models\Central\SubscriptionPlan;
use App\Models\Tenant\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

require_once __DIR__.'/TenancyTestSetup.php';

const SUB_PREFIX = 'pesttestsub';

beforeEach(fn () => tenantTestCleanup(SUB_PREFIX));
afterEach(fn () => tenantTestCleanup(SUB_PREFIX));

function makeAdmin(): User
{
    $admin = User::factory()->create([
        'email' => 'admin@sub.test',
        'password' => Hash::make('Pass#0000'),
        'is_active' => true,
    ]);
    $admin->assignRole('clinic_admin');

    return $admin;
}

it('extends the subscription when the coupon plan matches the active plan', function () {
    $clinic = makeTestTenant(SUB_PREFIX.'-extend');
    $plan = SubscriptionPlan::factory()->create();

    $sub = Subscription::create([
        'clinic_id' => $clinic->id,
        'plan_id' => $plan->id,
        'status' => SubscriptionStatus::Active,
        'starts_at' => now()->subDays(10),
        'ends_at' => now()->addDays(5),
    ]);

    $coupon = Coupon::create([
        'code' => 'EXTEND30',
        'plan_id' => $plan->id,
        'duration_days' => 30,
        'max_uses' => 1,
        'is_active' => true,
    ]);

    $clinic->run(function () use ($clinic, $coupon, $sub) {
        $admin = makeAdmin();
        $result = app(RedeemCouponAction::class)->execute($coupon->code, $clinic, $admin);

        expect($result['action'])->toBe('extend');
        expect($result['subscription']->id)->toBe($sub->id);
        expect($result['subscription']->ends_at->isAfter(now()->addDays(34)))->toBeTrue();
        expect($coupon->fresh()->used_count)->toBe(1);
        expect(CouponRedemption::query()->where('coupon_id', $coupon->id)->count())->toBe(1);
    });
});

it('switches the active subscription when the coupon plan differs', function () {
    $clinic = makeTestTenant(SUB_PREFIX.'-switch');
    $starter = SubscriptionPlan::factory()->create();
    $pro = SubscriptionPlan::factory()->create();

    $oldSub = Subscription::create([
        'clinic_id' => $clinic->id,
        'plan_id' => $starter->id,
        'status' => SubscriptionStatus::Active,
        'starts_at' => now()->subDays(5),
        'ends_at' => now()->addDays(10),
    ]);

    $coupon = Coupon::create([
        'code' => 'PROUPGRADE',
        'plan_id' => $pro->id,
        'duration_days' => 30,
        'max_uses' => 1,
        'is_active' => true,
    ]);

    $clinic->run(function () use ($clinic, $coupon, $oldSub, $pro) {
        $admin = makeAdmin();
        $result = app(RedeemCouponAction::class)->execute($coupon->code, $clinic, $admin);

        expect($result['action'])->toBe('switch');
        expect($result['subscription']->plan_id)->toBe($pro->id);
        expect($result['subscription']->id)->not->toBe($oldSub->id);

        $oldSub->refresh();
        expect($oldSub->status->value)->toBe('cancelled');
    });
});

it('rejects a second redemption from the same clinic', function () {
    $clinic = makeTestTenant(SUB_PREFIX.'-dup');
    $plan = SubscriptionPlan::factory()->create();
    Subscription::create([
        'clinic_id' => $clinic->id,
        'plan_id' => $plan->id,
        'status' => SubscriptionStatus::Active,
        'starts_at' => now(),
        'ends_at' => now()->addDays(30),
    ]);
    $coupon = Coupon::create([
        'code' => 'ONCE',
        'plan_id' => $plan->id,
        'duration_days' => 30,
        'max_uses' => 5,
        'is_active' => true,
    ]);

    $clinic->run(function () use ($clinic, $coupon) {
        $admin = makeAdmin();
        app(RedeemCouponAction::class)->execute($coupon->code, $clinic, $admin);

        expect(fn () => app(RedeemCouponAction::class)->execute($coupon->code, $clinic, $admin))
            ->toThrow(ValidationException::class);

        expect($coupon->fresh()->used_count)->toBe(1);
        expect(CouponRedemption::query()->where('coupon_id', $coupon->id)->count())->toBe(1);
    });
});

it('rejects an exhausted coupon', function () {
    $clinic = makeTestTenant(SUB_PREFIX.'-exhausted');
    $plan = SubscriptionPlan::factory()->create();
    $coupon = Coupon::create([
        'code' => 'BURNED',
        'plan_id' => $plan->id,
        'duration_days' => 30,
        'max_uses' => 1,
        'used_count' => 1,
        'is_active' => true,
    ]);

    $clinic->run(function () use ($clinic, $coupon) {
        $admin = makeAdmin();
        expect(fn () => app(RedeemCouponAction::class)->execute($coupon->code, $clinic, $admin))
            ->toThrow(ValidationException::class);
    });
});

it('rejects an expired coupon', function () {
    $clinic = makeTestTenant(SUB_PREFIX.'-expired');
    $plan = SubscriptionPlan::factory()->create();
    $coupon = Coupon::create([
        'code' => 'OLD',
        'plan_id' => $plan->id,
        'duration_days' => 30,
        'max_uses' => 5,
        'expires_at' => now()->subDay(),
        'is_active' => true,
    ]);

    $clinic->run(function () use ($clinic, $coupon) {
        $admin = makeAdmin();
        expect(fn () => app(RedeemCouponAction::class)->execute($coupon->code, $clinic, $admin))
            ->toThrow(ValidationException::class);
    });
});

it('blocks doctor / secretary from the redeem endpoint', function () {
    $clinic = makeTestTenant(SUB_PREFIX.'-perm');
    $plan = SubscriptionPlan::factory()->create();
    Coupon::create([
        'code' => 'SECRET',
        'plan_id' => $plan->id,
        'duration_days' => 30,
        'max_uses' => 5,
        'is_active' => true,
    ]);

    $clinic->run(function () use ($clinic) {
        $secretary = User::factory()->create([
            'email' => 'sec@perm.test',
            'password' => Hash::make('Pass#0000'),
            'is_active' => true,
        ]);
        $secretary->assignRole('secretary');

        $host = $clinic->id.'.einaya.test';
        test()
            ->actingAs($secretary, 'web')
            ->from('http://'.$host.'/subscription')
            ->post('http://'.$host.'/subscription/redeem', ['code' => 'SECRET'])
            ->assertStatus(403);
    });
});
