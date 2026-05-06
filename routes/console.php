<?php

use App\Jobs\Central\AggregatePlatformStats;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::job(new AggregatePlatformStats())
    ->hourly()
    ->name('central:aggregate-platform-stats')
    ->withoutOverlapping();
