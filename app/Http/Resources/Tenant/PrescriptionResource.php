<?php

declare(strict_types=1);

namespace App\Http\Resources\Tenant;

use App\Models\Tenant\Prescription;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Prescription */
class PrescriptionResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'consultation_id' => $this->consultation_id,
            'patient_id' => $this->patient_id,
            'doctor_id' => $this->doctor_id,
            'notes' => $this->notes,
            'printed_at' => $this->printed_at?->toIso8601String(),
            'is_locked' => $this->printed_at !== null,
            'created_at' => $this->created_at?->toIso8601String(),
            'items' => $this->whenLoaded('items', fn () => $this->items
                ->sortBy('order')
                ->values()
                ->map(fn ($item) => [
                    'id' => $item->id,
                    'medication_name' => $item->medication_name,
                    'dosage' => $item->dosage,
                    'frequency' => $item->frequency,
                    'duration' => $item->duration,
                    'instructions' => $item->instructions,
                    'order' => (int) $item->order,
                ])
                ->all()),
        ];
    }
}
