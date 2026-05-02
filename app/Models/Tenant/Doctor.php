<?php

declare(strict_types=1);

namespace App\Models\Tenant;

use Database\Factories\Tenant\DoctorFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Doctor extends Model
{
    /** @use HasFactory<DoctorFactory> */
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'specialty',
        'license_number',
        'bio_en',
        'bio_ar',
        'consultation_duration_minutes',
        'is_active',
    ];

    protected $casts = [
        'consultation_duration_minutes' => 'integer',
        'is_active' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function workingHours(): HasMany
    {
        return $this->hasMany(DoctorWorkingHour::class);
    }

    public function breaks(): HasMany
    {
        return $this->hasMany(DoctorBreak::class);
    }

    public function timeOff(): HasMany
    {
        return $this->hasMany(DoctorTimeOff::class);
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }

    public function consultations(): HasMany
    {
        return $this->hasMany(Consultation::class);
    }

    public function medicalForms(): HasMany
    {
        return $this->hasMany(MedicalForm::class);
    }

    protected static function newFactory(): DoctorFactory
    {
        return DoctorFactory::new();
    }
}
