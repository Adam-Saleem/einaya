<?php

declare(strict_types=1);

use App\Models\Central\User;
use PragmaRX\Google2FA\Google2FA;

function setUp2faUser(): array
{
    $user = User::factory()->create([
        'email' => 'admin@central.test',
        'password' => bcrypt('Test@2025!'),
    ]);

    test()->actingAs($user, 'web_central')
        ->post('http://app.einaya.test/two-factor');

    $user->refresh();
    $secret = Illuminate\Support\Facades\Crypt::decryptString($user->two_factor_secret);
    $code = (new Google2FA())->getCurrentOtp($secret);

    test()->actingAs($user, 'web_central')
        ->post('http://app.einaya.test/two-factor/confirm', ['code' => $code]);

    $codes = session('recovery_codes');

    test()->post('http://app.einaya.test/logout');

    return ['user' => $user->refresh(), 'recovery_codes' => $codes];
}

it('redirects to the challenge after credentials when 2FA is enabled', function () {
    setUp2faUser();

    $response = $this->post('http://app.einaya.test/login', [
        'email' => 'admin@central.test',
        'password' => 'Test@2025!',
    ]);

    // Named routes resolve to the first registered host (app.einaya.ps) when
    // generating absolute URLs — so assert on the path, not the host.
    $response->assertRedirectContains('/two-factor/challenge');
    expect(auth('web_central')->check())->toBeFalse();
    expect(session()->has('auth.two_factor.user_id'))->toBeTrue();
});

it('completes login when the user supplies a valid TOTP code', function () {
    ['user' => $user] = setUp2faUser();

    $this->post('http://app.einaya.test/login', [
        'email' => 'admin@central.test',
        'password' => 'Test@2025!',
    ]);

    $secret = Illuminate\Support\Facades\Crypt::decryptString($user->two_factor_secret);
    $code = (new Google2FA())->getCurrentOtp($secret);

    $this->post('http://app.einaya.test/two-factor/challenge', ['code' => $code])
        ->assertRedirect('/');

    expect(auth('web_central')->check())->toBeTrue()
        ->and(auth('web_central')->id())->toBe($user->id);
});

it('accepts a recovery code once and not twice', function () {
    ['user' => $user, 'recovery_codes' => $recoveryCodes] = setUp2faUser();
    $code = $recoveryCodes[0];

    $this->post('http://app.einaya.test/login', [
        'email' => 'admin@central.test',
        'password' => 'Test@2025!',
    ]);

    $this->post('http://app.einaya.test/two-factor/challenge', ['recovery_code' => $code])
        ->assertRedirect('/');

    // Log out and try the same recovery code again — must fail.
    $this->post('http://app.einaya.test/logout');

    $this->post('http://app.einaya.test/login', [
        'email' => 'admin@central.test',
        'password' => 'Test@2025!',
    ]);

    $this->post('http://app.einaya.test/two-factor/challenge', ['recovery_code' => $code])
        ->assertSessionHasErrors('code');

    expect(auth('web_central')->check())->toBeFalse();
});

it('rejects an invalid TOTP code at the challenge', function () {
    setUp2faUser();

    $this->post('http://app.einaya.test/login', [
        'email' => 'admin@central.test',
        'password' => 'Test@2025!',
    ]);

    $this->post('http://app.einaya.test/two-factor/challenge', ['code' => '000000'])
        ->assertSessionHasErrors('code');

    expect(auth('web_central')->check())->toBeFalse();
});
