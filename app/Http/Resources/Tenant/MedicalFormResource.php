<?php

declare(strict_types=1);

namespace App\Http\Resources\Tenant;

use App\Models\Tenant\MedicalForm;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin MedicalForm */
class MedicalFormResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'doctor_id' => $this->doctor_id,
            'title' => $this->title,
            'description' => $this->description,
            'type' => $this->type->value,
            'type_label' => $this->type->label(),
            'is_active' => (bool) $this->is_active,
            'sections_count' => $this->whenCounted('sections'),
            'submissions_count' => $this->whenCounted('submissions'),
            // Plain array, not Resource::collection — the FE Builder treats
            // `sections` as a flat array. `Resource::collection(...)` wraps
            // it in `{ data: [...] }` which broke array operations on the
            // client.
            'sections' => $this->whenLoaded(
                'sections',
                fn () => FormSectionResource::collection($this->sections)->resolve($request),
            ),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
