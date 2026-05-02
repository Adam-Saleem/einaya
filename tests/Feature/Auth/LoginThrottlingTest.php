<?php

declare(strict_types=1);

use App\Models\Central\User;
use Illuminate\Support\Facades\RateLimiter;

beforeEach(function () {
    // Each test starts with a clean rate-limiter so consecutive Pest runs
    // don't bleed into each other.
    RateLimiter::clear('admin@central.test|127.0.0.1');
});

it('blocks the 6th login attempt within a minute', function () {
    User::factory()->create([
        'email' => 'admin@central.test',
        'password' => bcrypt('Test@2025!'),
    ]);

    for ($i = 0; $i < 5; $i++) {
        $this->post('http://app.einaya.test/login', [
            'email' => 'admin@central.test',
            'password' => 'wrong-password',
        ])->assertSessionHasErrors('email');
    }

    $response = $this->post('http://app.einaya.test/login', [
        'email' => 'admin@central.test',
        'password' => 'Test@2025!', // even correct password is now blocked
    ]);

    $response->assertSessionHasErrors('email');
    $error = session('errors')->first('email');
    expect($error)->toMatch('/(throttle|seconds|attempts)/i');
    expect(auth('web_central')->check())->toBeFalse();
});
