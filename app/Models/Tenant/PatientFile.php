<?php

declare(strict_types=1);

namespace App\Models\Tenant;

use App\Enums\Tenant\PatientFileCategory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class PatientFile extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'patient_id',
        'uploaded_by',
        'category',
        'file_path',
        'original_name',
        'mime_type',
        'size_bytes',
        'notes',
    ];

    protected $casts = [
        'category' => PatientFileCategory::class,
        'size_bytes' => 'integer',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
