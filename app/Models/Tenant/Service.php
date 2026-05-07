<?php

declare(strict_types=1);

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Service extends Model
{
    use SoftDeletes;

    protected $table = 'clinic_services';

    protected $fillable = [
        'name',
        'code',
        'description',
        'price',
        'is_active',
        'display_order',
    ];

    protected $casts = [
        'price' => 'integer',
        'is_active' => 'boolean',
        'display_order' => 'integer',
    ];

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function consultationServices(): HasMany
    {
        return $this->hasMany(ConsultationService::class);
    }
}
