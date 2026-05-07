<?php

declare(strict_types=1);

use App\Models\Central\DemoRequest;
use App\Models\Central\User;

it('lets a guest submit a valid demo request from the apex domain', function () {
    $response = $this->post('https://einaya.test/demo-request', [
        'clinic_name' => 'Hebron Family Clinic',
        'contact_name' => 'Dr. Layla Habash',
        'email' => 'layla@example.com',
        'phone' => '+970599123456',
        'country' => 'PS',
        'intent' => 'demo',
        'message' => 'We have 3 doctors and ~200 patients/week.',
        'website' => '',
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    $row = DemoRequest::query()->first();

    expect($row)->not->toBeNull();
    expect($row->clinic_name)->toBe('Hebron Family Clinic');
    expect($row->phone)->toBe('+970599123456');
    expect($row->country)->toBe('PS');
    expect($row->intent)->toBe('demo');
    expect($row->is_handled)->toBeFalse();
});

it('rejects a submission with the honeypot filled', function () {
    $response = $this->post('https://einaya.test/demo-request', [
        'clinic_name' => 'Bot Clinic',
        'contact_name' => 'Bot',
        'email' => 'bot@example.com',
        'phone' => '+970599123456',
        'intent' => 'demo',
        'website' => 'http://spam.example.com',
    ]);

    $response->assertSessionHasErrors('website');
    expect(DemoRequest::query()->count())->toBe(0);
});

it('rejects a submission with an invalid phone number', function () {
    $response = $this->post('https://einaya.test/demo-request', [
        'clinic_name' => 'Bad Phone Clinic',
        'contact_name' => 'Test',
        'email' => 'test@example.com',
        'phone' => '12345',
        'intent' => 'demo',
        'website' => '',
    ]);

    $response->assertSessionHasErrors('phone');
    expect(DemoRequest::query()->count())->toBe(0);
});

it('lets a super admin list demo requests at /demo-requests', function () {
    DemoRequest::create([
        'clinic_name' => 'Test Clinic',
        'contact_name' => 'Tester',
        'email' => 'test@example.com',
        'phone' => '+970599123456',
        'country' => 'PS',
        'intent' => 'demo',
    ]);

    $admin = User::factory()->create(['is_super_admin' => true]);

    $this->actingAs($admin, 'web_central')
        ->get('https://app.einaya.test/demo-requests')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Central/DemoRequests/Index')
            ->has('requests.data', 1)
            ->where('unhandledCount', 1));
});

it('blocks non-super-admins from /demo-requests', function () {
    $regular = User::factory()->create(['is_super_admin' => false]);

    $this->actingAs($regular, 'web_central')
        ->get('https://app.einaya.test/demo-requests')
        ->assertStatus(403);
});

it('flips is_handled when a super admin patches the row', function () {
    $row = DemoRequest::create([
        'clinic_name' => 'Test Clinic',
        'contact_name' => 'Tester',
        'email' => 'test@example.com',
        'phone' => '+970599123456',
        'country' => 'PS',
        'intent' => 'demo',
    ]);

    $admin = User::factory()->create(['is_super_admin' => true]);

    $this->actingAs($admin, 'web_central')
        ->patch("https://app.einaya.test/demo-requests/{$row->id}", [
            'is_handled' => true,
            'notes' => 'Called and onboarded.',
        ])
        ->assertRedirect();

    $fresh = $row->fresh();
    expect($fresh->is_handled)->toBeTrue();
    expect($fresh->handled_by)->toBe($admin->id);
    expect($fresh->handled_at)->not->toBeNull();
    expect($fresh->notes)->toBe('Called and onboarded.');
});
