<?php

declare(strict_types=1);

namespace App\Http\Resources\Central;

use App\Models\Central\SubscriptionPlan;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin SubscriptionPlan */
class PlanResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'price_monthly' => (float) $this->price_monthly,
            'price_yearly' => (float) $this->price_yearly,
            'max_patients' => $this->max_patients,
            'max_staff' => $this->max_staff,
            'features' => $this->features ?? [],
            'is_active' => $this->is_active,
            'order' => $this->order,
            'subscription_count' => $this->whenCounted('subscriptions'),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
