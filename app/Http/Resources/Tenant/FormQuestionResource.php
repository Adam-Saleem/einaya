<?php

declare(strict_types=1);

namespace App\Http\Resources\Tenant;

use App\Models\Tenant\FormQuestion;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin FormQuestion */
class FormQuestionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'form_section_id' => $this->form_section_id,
            'key' => $this->key,
            'label' => $this->label,
            'help_text' => $this->help_text,
            'type' => $this->type->value,
            'type_label' => $this->type->label(),
            'has_options' => $this->type->hasOptions(),
            'is_required' => (bool) $this->is_required,
            'validation_rules' => $this->validation_rules,
            'order' => (int) $this->order,
            'options' => $this->whenLoaded('options', fn () => $this->options->map(fn ($o) => [
                'id' => $o->id,
                'value' => $o->value,
                'label' => $o->label,
                'order' => (int) $o->order,
            ])->values()),
        ];
    }
}
