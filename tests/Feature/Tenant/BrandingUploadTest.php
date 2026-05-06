<?php

declare(strict_types=1);

use App\Models\Tenant\ClinicSetting;
use App\Models\Tenant\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

require_once __DIR__.'/TenancyTestSetup.php';

const BRANDING_PREFIX = 'pesttestbranding';

beforeEach(fn () => tenantTestCleanup(BRANDING_PREFIX));
afterEach(fn () => tenantTestCleanup(BRANDING_PREFIX));

it('stores the uploaded logo path in clinic_settings', function () {
    $tenant = makeTestTenant(BRANDING_PREFIX.'-a');

    /** @var User $admin */
    $admin = null;
    $tenant->run(function () use (&$admin) {
        $admin = User::factory()->create([
            'email' => 'admin@brand.test',
            'password' => Hash::make('Pass#0000'),
            'is_active' => true,
            'preferred_language' => 'ar',
        ]);
        $admin->assignRole('clinic_admin');
    });

    Storage::fake('public');

    $host = BRANDING_PREFIX.'-a.einaya.test';

    $this->actingAs($admin, 'web')
        ->from('http://'.$host.'/settings')
        ->post(
            'http://'.$host.'/settings/branding/logo',
            ['logo' => UploadedFile::fake()->image('logo.png', 200, 200)],
        )
        ->assertRedirect();

    $tenant->run(function () {
        $setting = ClinicSetting::where('key', 'branding')->first();
        expect($setting)->not->toBeNull();
        expect($setting->value)->toHaveKey('logo_url');
        expect((string) $setting->value['logo_url'])->toStartWith('/storage/branding/');
    });
});
