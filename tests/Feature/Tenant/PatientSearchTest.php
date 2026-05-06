<?php

declare(strict_types=1);

use App\Models\Tenant\Patient;
use App\Services\Tenant\PatientSearchService;

require_once __DIR__.'/TenancyTestSetup.php';

const SEARCH_PREFIX = 'pesttestsearch';

beforeEach(fn () => tenantTestCleanup(SEARCH_PREFIX));
afterEach(fn () => tenantTestCleanup(SEARCH_PREFIX));

it('matches across name / phone / national_id', function () {
    $tenant = makeTestTenant(SEARCH_PREFIX.'-a');

    $tenant->run(function () {
        Patient::create([
            'first_name' => 'Lina',
            'last_name' => 'Habash',
            'phone' => '+970599991111',
            'national_id' => '900000001',
            'preferred_language' => 'ar',
        ]);
        Patient::create([
            'first_name' => 'Omar',
            'last_name' => 'Khalil',
            'phone' => '+970598881212',
            'preferred_language' => 'ar',
        ]);

        $service = app(PatientSearchService::class);

        expect($service->search('Lina')->pluck('first_name')->all())->toBe(['Lina']);
        expect($service->search('Khal')->pluck('last_name')->all())->toBe(['Khalil']);
        expect($service->search('599991111')->pluck('first_name')->all())->toBe(['Lina']);
        expect($service->search('900000001')->pluck('first_name')->all())->toBe(['Lina']);
    });
});
