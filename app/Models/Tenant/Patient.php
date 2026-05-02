<?php

declare(strict_types=1);

namespace App\Models\Tenant;

use App\Enums\Tenant\PatientGender;
use App\Enums\Tenant\PatientMaritalStatus;
use App\Enums\Tenant\PreferredLanguage;
use App\Services\Tenant\PatientCodeGenerator;
use Database\Factories\Tenant\PatientFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Patient extends Model
{
    /** @use HasFactory<PatientFactory> */
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'patient_code',
        'first_name',
        'last_name',
        'national_id',
        'date_of_birth',
        'gender',
        'marital_status',
        'occupation',
        'preferred_language',
        'phone',
        'phone_alt',
        'email',
        'address',
        'city',
        'emergency_name',
        'emergency_phone',
        'emergency_relation',
        'blood_type',
        'allergies_summary',
        'chronic_summary',
        'medications_summary',
        'has_insurance',
        'insurance_provider_id',
        'insurance_policy_number',
        'profile_photo_path',
        'notes',
        'referred_by',
        'registered_by',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'gender' => PatientGender::class,
        'marital_status' => PatientMaritalStatus::class,
        'preferred_language' => PreferredLanguage::class,
        'has_insurance' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::creating(function (Patient $patient) {
            if ($patient->patient_code === null || $patient->patient_code === '') {
                $patient->patient_code = app(PatientCodeGenerator::class)->next();
            }
        });
    }

    public function fullName(): string
    {
        return trim($this->first_name.' '.$this->last_name);
    }

    public function insuranceProvider(): BelongsTo
    {
        return $this->belongsTo(InsuranceProvider::class);
    }

    public function registeredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'registered_by');
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }

    public function consultations(): HasMany
    {
        return $this->hasMany(Consultation::class);
    }

    public function files(): HasMany
    {
        return $this->hasMany(PatientFile::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function formSubmissions(): HasMany
    {
        return $this->hasMany(FormSubmission::class);
    }

    protected static function newFactory(): PatientFactory
    {
        return PatientFactory::new();
    }
}
