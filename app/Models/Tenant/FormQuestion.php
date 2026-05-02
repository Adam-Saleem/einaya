<?php

declare(strict_types=1);

namespace App\Models\Tenant;

use App\Enums\Tenant\FormQuestionType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class FormQuestion extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'form_section_id',
        'key',
        'label',
        'help_text',
        'type',
        'is_required',
        'validation_rules',
        'conditions',
        'order',
    ];

    protected $casts = [
        'type' => FormQuestionType::class,
        'is_required' => 'boolean',
        'validation_rules' => 'array',
        'conditions' => 'array',
        'order' => 'integer',
    ];

    public function section(): BelongsTo
    {
        return $this->belongsTo(FormSection::class, 'form_section_id');
    }

    public function options(): HasMany
    {
        return $this->hasMany(FormQuestionOption::class)->orderBy('order');
    }
}
