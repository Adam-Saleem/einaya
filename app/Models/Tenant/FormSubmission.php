<?php

declare(strict_types=1);

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class FormSubmission extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'medical_form_id',
        'consultation_id',
        'patient_id',
        'doctor_id',
        'form_snapshot',
        'answers_snapshot',
        'submitted_at',
    ];

    protected $casts = [
        'form_snapshot' => 'array',
        'answers_snapshot' => 'array',
        'submitted_at' => 'datetime',
    ];

    public function medicalForm(): BelongsTo
    {
        return $this->belongsTo(MedicalForm::class);
    }

    public function consultation(): BelongsTo
    {
        return $this->belongsTo(Consultation::class);
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class);
    }
}
