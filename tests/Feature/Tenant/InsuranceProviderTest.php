<?php

declare(strict_types=1);

use App\Models\Tenant\InsuranceProvider;
use App\Models\Tenant\Patient;
use App\Models\Tenant\User;
use Illuminate\Support\Facades\Hash;

require_once __DIR__.'/TenancyTestSetup.php';

const INS_PREFIX = 'pesttestins';

beforeEach(fn () => tenantTestCleanup(INS_PREFIX));
afterEach(fn () => tenantTestCleanup(INS_PREFIX));

it('refuses to delete a provider that has patients linked', function () {
    $tenant = makeTestTenant(INS_PREFIX.'-block');

    /** @var User $admin */
    $admin = null;
    /** @var InsuranceProvider $provider */
    $provider = null;
    $tenant->run(function () use (&$admin, &$provider) {
        $admin = User::factory()->create([
            'email' => 'admin@ins.test',
            'password' => Hash::make('Pass#0000'),
            'is_active' => true,
            'preferred_language' => 'ar',
        ]);
        $admin->assignRole('clinic_admin');

        $provider = InsuranceProvider::factory()->create(['name' => 'Acme', 'is_active' => true]);
        Patient::create([
            'first_name' => 'Linked',
            'last_name' => 'Patient',
            'phone' => '+970-59-9999',
            'preferred_language' => 'ar',
            'insurance_provider_id' => $provider->id,
        ]);
    });

    $host = INS_PREFIX.'-block.einaya.test';

    $this->actingAs($admin, 'web')
        ->from('http://'.$host.'/insurance-providers')
        ->delete('http://'.$host.'/insurance-providers/'.$provider->id)
        ->assertSessionHas('error');

    $tenant->run(function () use ($provider) {
        expect(InsuranceProvider::find($provider->id))->not->toBeNull();
    });
});
