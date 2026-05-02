<?php

declare(strict_types=1);

use App\Models\Central\User;

it('enables 2FA, confirms with a valid TOTP code, and exposes recovery codes', function () {
    $user = User::factory()->create();

    $this->actingAs($user, 'web_central')
        ->post('http://app.einaya.test/two-factor');

    $user->refresh();

    expect($user->two_factor_secret)->not->toBeNull()
        ->and($user->two_factor_confirmed_at)->toBeNull();

    // Generate a real TOTP code from the user's secret.
    $service = app(App\Services\TwoFactorService::class);
    $secret = Illuminate\Support\Facades\Crypt::decryptString($user->two_factor_secret);
    $code = (new PragmaRX\Google2FA\Google2FA())->getCurrentOtp($secret);

    $response = $this->actingAs($user, 'web_central')
        ->post('http://app.einaya.test/two-factor/confirm', ['code' => $code]);

    $response->assertSessionHas('recovery_codes');
    $user->refresh();

    expect($user->two_factor_confirmed_at)->not->toBeNull()
        ->and($user->hasTwoFactorEnabled())->toBeTrue();

    $codes = session('recovery_codes');
    expect($codes)->toBeArray()->toHaveCount(8);
    foreach ($codes as $code) {
        expect($code)->toMatch('/^[A-Z0-9]{4}-[A-Z0-9]{4}$/');
    }
});

it('rejects an invalid TOTP confirmation code', function () {
    $user = User::factory()->create();

    $this->actingAs($user, 'web_central')
        ->post('http://app.einaya.test/two-factor');

    $this->actingAs($user->refresh(), 'web_central')
        ->post('http://app.einaya.test/two-factor/confirm', ['code' => '000000'])
        ->assertSessionHasErrors('code');

    $user->refresh();
    expect($user->two_factor_confirmed_at)->toBeNull();
});

it('disables 2FA and clears the secret', function () {
    $user = User::factory()->create();
    $this->actingAs($user, 'web_central')->post('http://app.einaya.test/two-factor');
    $user->refresh();

    $secret = Illuminate\Support\Facades\Crypt::decryptString($user->two_factor_secret);
    $code = (new PragmaRX\Google2FA\Google2FA())->getCurrentOtp($secret);
    $this->actingAs($user, 'web_central')->post('http://app.einaya.test/two-factor/confirm', ['code' => $code]);

    $this->actingAs($user->refresh(), 'web_central')
        ->delete('http://app.einaya.test/two-factor');

    $user->refresh();
    expect($user->two_factor_secret)->toBeNull()
        ->and($user->two_factor_confirmed_at)->toBeNull()
        ->and($user->two_factor_recovery_codes)->toBeNull();
});
