<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| The closure you provide to your test functions is always bound to a specific PHPUnit test
| case class. By default, that class is "PHPUnit\Framework\TestCase". Of course, you may
| need to change it using the "pest()" function to bind a different classes or traits.
|
*/

// Tests that touch only the central DB use RefreshDatabase.
pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in(
        'Feature/ExampleTest.php',
        'Feature/Auth/CentralLoginTest.php',
        'Feature/Auth/TwoFactorSetupTest.php',
        'Feature/Auth/TwoFactorChallengeTest.php',
        'Feature/Auth/LoginThrottlingTest.php',
        'Feature/Auth/PasswordRequirementsTest.php',
        'Feature/Central/SubscriptionPlanTest.php',
        'Feature/Central/AuditLogTest.php',
        'Feature/Central/PreferencesTest.php',
        'Feature/Central/PlanCannotBeDeletedTest.php',
        'Feature/Central/AuditLogCreatedOnClinicSuspensionTest.php',
        'Feature/Central/OnlySuperAdminCanAccessTest.php',
        'Feature/Central/DemoRequestTest.php',
        'Feature/Central/CouponTest.php',
    );

// Tests that create/delete tenant databases must NOT use RefreshDatabase:
// tenant DB creation/deletion is DDL that auto-commits and cannot be rolled
// back per-test. They manage their own state.
pest()->extend(TestCase::class)
    ->in(
        'Feature/TenancyTest.php',
        'Feature/Central/ClinicCreationTest.php',
        'Feature/Central/CreateClinicTest.php',
        'Feature/Central/SuspendClinicTest.php',
        'Feature/Tenant',
        'Feature/Auth/TenantLoginTest.php',
        'Feature/Auth/WrongContextTest.php',
    );

/*
|--------------------------------------------------------------------------
| Expectations
|--------------------------------------------------------------------------
|
| When you're writing tests, you often need to check that values meet certain conditions. The
| "expect()" function gives you access to a set of "expectations" methods that you can use
| to assert different things. Of course, you may extend the Expectation API at any time.
|
*/

expect()->extend('toBeOne', function () {
    return $this->toBe(1);
});

/*
|--------------------------------------------------------------------------
| Functions
|--------------------------------------------------------------------------
|
| While Pest is very powerful out-of-the-box, you may have some testing code specific to your
| project that you don't want to repeat in every file. Here you can also expose helpers as
| global functions to help you to reduce the number of lines of code in your test files.
|
*/

function something()
{
    // ..
}
