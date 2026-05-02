<?php

declare(strict_types=1);

use App\Models\Central\SubscriptionPlan;
use Database\Seeders\Central\SubscriptionPlansSeeder;

it('seeds the three subscription plans with expected values', function () {
    $this->seed(SubscriptionPlansSeeder::class);

    expect(SubscriptionPlan::count())->toBe(3);

    $starter = SubscriptionPlan::where('slug', 'starter')->first();
    expect($starter)->not->toBeNull()
        ->and($starter->name)->toBe('Starter')
        ->and((float) $starter->price_monthly)->toBe(19.00)
        ->and((float) $starter->price_yearly)->toBe(190.00)
        ->and($starter->max_patients)->toBe(500)
        ->and($starter->max_staff)->toBe(2)
        ->and($starter->is_active)->toBeTrue()
        ->and($starter->features)->toContain('form_builder');

    $pro = SubscriptionPlan::where('slug', 'pro')->first();
    expect($pro)->not->toBeNull()
        ->and((float) $pro->price_monthly)->toBe(49.00)
        ->and($pro->max_patients)->toBe(5000)
        ->and($pro->max_staff)->toBe(5)
        ->and($pro->features)->toContain('sms');

    $enterprise = SubscriptionPlan::where('slug', 'enterprise')->first();
    expect($enterprise)->not->toBeNull()
        ->and((float) $enterprise->price_monthly)->toBe(129.00)
        ->and($enterprise->max_patients)->toBeNull()
        ->and($enterprise->max_staff)->toBeNull()
        ->and($enterprise->features)->toContain('priority_support');
});

it('reseeding is idempotent', function () {
    $this->seed(SubscriptionPlansSeeder::class);
    $this->seed(SubscriptionPlansSeeder::class);

    expect(SubscriptionPlan::count())->toBe(3);
});
