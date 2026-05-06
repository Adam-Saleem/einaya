<?php

declare(strict_types=1);

use App\Models\Central\User;

it('returns 403 for non-super-admin central users hitting the dashboard', function () {
    $regular = User::factory()->create(['is_super_admin' => false]);

    $this->actingAs($regular, 'web_central')
        ->get('https://app.einaya.test/')
        ->assertStatus(403);
});

it('returns 403 for non-super-admin central users hitting clinic management', function () {
    $regular = User::factory()->create(['is_super_admin' => false]);

    foreach (['/clinics', '/plans', '/subscriptions', '/tickets', '/audit', '/settings'] as $path) {
        $this->actingAs($regular, 'web_central')
            ->get('https://app.einaya.test'.$path)
            ->assertStatus(403);
    }
});

it('redirects guests to the login page', function () {
    $this->get('https://app.einaya.test/')->assertRedirect('/login');
});

it('lets super admins through', function () {
    $admin = User::factory()->create(['is_super_admin' => true]);

    $this->actingAs($admin, 'web_central')
        ->get('https://app.einaya.test/')
        ->assertOk();
});
