<?php

declare(strict_types=1);

namespace App\Models\Tenant;

use App\Enums\Tenant\FormType;
use Database\Factories\Tenant\MedicalFormFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class MedicalForm extends Model
{
    /** @use HasFactory<MedicalFormFactory> */
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'doctor_id',
        'title',
        'description',
        'type',
        'is_active',
    ];

    protected $casts = [
        'type' => FormType::class,
        'is_active' => 'boolean',
    ];

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class);
    }

    public function sections(): HasMany
    {
        return $this->hasMany(FormSection::class)->orderBy('order');
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(FormSubmission::class);
    }

    protected static function newFactory(): MedicalFormFactory
    {
        return MedicalFormFactory::new();
    }
}
