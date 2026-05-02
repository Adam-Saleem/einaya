<?php

declare(strict_types=1);

use App\Models\Central\User;
use Illuminate\Support\Facades\Hash;

it('rejects a weak password on update', function () {
    $user = User::factory()->create([
        'password' => Hash::make('Original@2025!'),
    ]);

    $cases = [
        'short',                    // too short
        'alllowercase1!',           // no uppercase
        'ALLUPPERCASE1!',           // no lowercase
        'NoNumbersHere!',           // no digit
        'NoSymbolHere1A',           // no symbol
    ];

    foreach ($cases as $weak) {
        $this->actingAs($user, 'web_central')
            ->from('http://app.einaya.test/profile')
            ->put('http://app.einaya.test/password', [
                'current_password' => 'Original@2025!',
                'password' => $weak,
                'password_confirmation' => $weak,
            ])
            ->assertSessionHasErrors('password');
    }
});

it('accepts a password meeting all rules', function () {
    $user = User::factory()->create([
        'password' => Hash::make('Original@2025!'),
    ]);

    $strong = 'NewStrong@2025#';

    $this->actingAs($user, 'web_central')
        ->from('http://app.einaya.test/profile')
        ->put('http://app.einaya.test/password', [
            'current_password' => 'Original@2025!',
            'password' => $strong,
            'password_confirmation' => $strong,
        ])
        ->assertSessionHasNoErrors();

    expect(Hash::check($strong, $user->fresh()->password))->toBeTrue();
});
