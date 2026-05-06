<?php

declare(strict_types=1);

namespace App\Http\Resources\Tenant;

use App\Models\Tenant\FormSection;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin FormSection */
class FormSectionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'medical_form_id' => $this->medical_form_id,
            'title' => $this->title,
            'description' => $this->description,
            'order' => (int) $this->order,
            'questions' => $this->whenLoaded(
                'questions',
                fn () => FormQuestionResource::collection($this->questions)->resolve($request),
            ),
            'questions_count' => $this->whenCounted('questions'),
        ];
    }
}
