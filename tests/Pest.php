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

// Breeze-installed tests + central tests that don't touch tenant DDL.
pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in(
        'Feature/Auth',
        'Feature/ProfileTest.php',
        'Feature/ExampleTest.php',
        'Feature/Central/SubscriptionPlanTest.php',
        'Feature/Central/AuditLogTest.php',
    );

// Tests that create/delete tenant databases must NOT use RefreshDatabase:
// tenant DB creation/deletion is DDL that auto-commits and cannot be rolled
// back per-test. They manage their own state.
pest()->extend(TestCase::class)
    ->in(
        'Feature/TenancyTest.php',
        'Feature/Central/ClinicCreationTest.php',
        'Feature/Tenant',
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
