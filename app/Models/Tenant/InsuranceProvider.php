<?php

declare(strict_types=1);

namespace App\Models\Tenant;

use Database\Factories\Tenant\InsuranceProviderFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class InsuranceProvider extends Model
{
    /** @use HasFactory<InsuranceProviderFactory> */
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'name',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function patients(): HasMany
    {
        return $this->hasMany(Patient::class);
    }

    protected static function newFactory(): InsuranceProviderFactory
    {
        return InsuranceProviderFactory::new();
    }
}
