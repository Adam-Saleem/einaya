<?php

declare(strict_types=1);

namespace App\Models\Central;

use App\Traits\HasTwoFactorAuth;
use Database\Factories\Central\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory;
    use HasTwoFactorAuth;
    use Notifiable;
    use SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'password',
        'is_super_admin',
        'preferred_language',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'two_factor_confirmed_at' => 'datetime',
        'password' => 'hashed',
        'is_super_admin' => 'boolean',
    ];

    protected static function newFactory(): UserFactory
    {
        return UserFactory::new();
    }
}
