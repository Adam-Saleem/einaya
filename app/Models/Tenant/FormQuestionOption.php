<?php

declare(strict_types=1);

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class FormQuestionOption extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'form_question_id',
        'value',
        'label',
        'order',
    ];

    protected $casts = [
        'order' => 'integer',
    ];

    public function question(): BelongsTo
    {
        return $this->belongsTo(FormQuestion::class, 'form_question_id');
    }
}
