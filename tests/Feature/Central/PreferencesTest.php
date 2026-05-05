<?php

declare(strict_types=1);

use App\Models\Central\User;

beforeEach(function () {
    $this->user = User::factory()->create([
        'is_super_admin' => true,
        'preferred_language' => 'en',
        'theme_preference' => 'system',
    ]);
});

it('persists the language preference for an authenticated central user', function () {
    $response = $this->actingAs($this->user, 'web_central')
        ->from('https://app.einaya.test/')
        ->post('https://app.einaya.test/api/preferences/language', [
            'language' => 'ar',
        ]);

    $response->assertRedirect('https://app.einaya.test/');
    expect($this->user->fresh()->preferred_language)->toBe('ar');
});

it('persists the theme preference for an authenticated central user', function () {
    $response = $this->actingAs($this->user, 'web_central')
        ->from('https://app.einaya.test/')
        ->post('https://app.einaya.test/api/preferences/theme', [
            'theme' => 'dark',
        ]);

    $response->assertRedirect('https://app.einaya.test/');
    expect($this->user->fresh()->theme_preference)->toBe('dark');
});

it('rejects an invalid language', function () {
    $this->actingAs($this->user, 'web_central')
        ->from('https://app.einaya.test/')
        ->post('https://app.einaya.test/api/preferences/language', [
            'language' => 'fr',
        ])
        ->assertSessionHasErrors('language');
});

it('rejects an invalid theme', function () {
    $this->actingAs($this->user, 'web_central')
        ->from('https://app.einaya.test/')
        ->post('https://app.einaya.test/api/preferences/theme', [
            'theme' => 'sepia',
        ])
        ->assertSessionHasErrors('theme');
});
