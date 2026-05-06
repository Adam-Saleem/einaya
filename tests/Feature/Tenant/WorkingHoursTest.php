<?php

declare(strict_types=1);

use App\Models\Tenant\Doctor;
use App\Models\Tenant\DoctorWorkingHour;
use App\Models\Tenant\User;
use Illuminate\Support\Facades\Hash;

require_once __DIR__.'/TenancyTestSetup.php';

const HOURS_PREFIX = 'pesttesthours';

beforeEach(fn () => tenantTestCleanup(HOURS_PREFIX));
afterEach(fn () => tenantTestCleanup(HOURS_PREFIX));

it('saves a weekly schedule via the controller', function () {
    $tenant = makeTestTenant(HOURS_PREFIX.'-a');

    /** @var User $admin */
    $admin = null;
    $tenant->run(function () use (&$admin) {
        $admin = User::factory()->create([
            'email' => 'doc@hours.test',
            'password' => Hash::make('Pass#0000'),
            'is_active' => true,
            'preferred_language' => 'ar',
        ]);
        $admin->assignRole(['clinic_admin', 'doctor']);
        Doctor::factory()->create(['user_id' => $admin->id]);
    });

    $host = HOURS_PREFIX.'-a.einaya.test';
    $payload = [
        'hours' => collect(range(0, 6))->map(fn ($d) => [
            'day_of_week' => $d,
            'is_active' => $d <= 4,
            'start_time' => $d <= 4 ? '09:00' : null,
            'end_time' => $d <= 4 ? '17:00' : null,
        ])->all(),
    ];

    $this->actingAs($admin, 'web')
        ->from('http://'.$host.'/doctor/hours')
        ->post('http://'.$host.'/doctor/hours', $payload)
        ->assertRedirect();

    $tenant->run(function () {
        $rows = DoctorWorkingHour::orderBy('day_of_week')->get();
        // Inactive days have no row (schema requires NOT NULL start/end).
        expect($rows)->toHaveCount(5);
        expect($rows->pluck('day_of_week')->all())->toBe([0, 1, 2, 3, 4]);
        expect($rows->first()->start_time)->toBe('09:00:00');
    });
});
