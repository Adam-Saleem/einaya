<?php

declare(strict_types=1);

namespace Database\Seeders\Central;

use App\Models\Central\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@einaya.ps'],
            [
                'name' => 'Einaya Super Admin',
                'password' => Hash::make('Einaya@2025'),
                'email_verified_at' => now(),
                'is_super_admin' => true,
                'preferred_language' => 'en',
            ],
        );
    }
}
