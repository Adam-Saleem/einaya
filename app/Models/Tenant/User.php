<?php

declare(strict_types=1);

namespace App\Models\Tenant;

use App\Enums\Tenant\PreferredLanguage;
use App\Traits\HasTwoFactorAuth;
use Database\Factories\Tenant\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
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
        'email_verified_at',
        'password',
        'phone',
        'avatar_path',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'two_factor_confirmed_at',
        'preferred_language',
        'is_active',
        'last_login_at',
        'last_login_ip',
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
        'last_login_at' => 'datetime',
        'password' => 'hashed',
        'is_active' => 'boolean',
        'preferred_language' => PreferredLanguage::class,
    ];

    public function doctor(): HasOne
    {
        return $this->hasOne(Doctor::class);
    }

    public function registeredPatients(): HasMany
    {
        return $this->hasMany(Patient::class, 'registered_by');
    }

    protected static function newFactory(): UserFactory
    {
        return UserFactory::new();
    }
}
