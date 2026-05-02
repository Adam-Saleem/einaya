<?php

declare(strict_types=1);

use App\Models\Central\User;

it('renders the central login page', function () {
    $this->get('http://app.einaya.test/login')->assertOk();
});

it('logs in a super admin with valid credentials', function () {
    $user = User::factory()->create([
        'email' => 'admin@central.test',
        'password' => bcrypt('Test@2025!'),
        'is_super_admin' => true,
    ]);

    $response = $this->post('http://app.einaya.test/login', [
        'email' => 'admin@central.test',
        'password' => 'Test@2025!',
    ]);

    $response->assertRedirect('/');
    expect(auth('web_central')->id())->toBe($user->id);
});

it('rejects bad credentials with the standard auth error', function () {
    User::factory()->create([
        'email' => 'admin@central.test',
        'password' => bcrypt('Test@2025!'),
    ]);

    $this->post('http://app.einaya.test/login', [
        'email' => 'admin@central.test',
        'password' => 'wrong-password',
    ])->assertSessionHasErrors('email');

    expect(auth('web_central')->check())->toBeFalse();
});

it('logs the super admin out', function () {
    $user = User::factory()->create();

    $this->actingAs($user, 'web_central')
        ->post('http://app.einaya.test/logout')
        ->assertRedirect();

    expect(auth('web_central')->check())->toBeFalse();
});
